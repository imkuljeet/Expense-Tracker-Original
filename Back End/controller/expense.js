const Expense = require('../models/expenses');
const User = require('../models/users');
const sequelize = require('../util/database');
const AWS = require('aws-sdk');

const addexpense = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { expenseamount, description, category } = req.body;

        if (expenseamount == undefined || expenseamount.length === 0) {
            return res.status(400).json({ success: false, message: 'Parameters missing' });
        }

        const expense = await Expense.create(
            { expenseamount, description, category, userId: req.user.id },
            { transaction: t }
        );

        const totalExpense = Number(req.user.totalExpenses) + Number(expenseamount);
        console.log('total Expense amt is', totalExpense);

        await User.update(
            {
                totalExpenses: totalExpense,
            },
            {
                where: { id: req.user.id },
                transaction: t,
            }
        );

        await t.commit();
        res.status(200).json({ expense: expense });
    } catch (err) {
        await t.rollback();
        return res.status(500).json({ success: false, error: err });
    }
};


const getexpenses = (req, res)=> {
    
    Expense.findAll({ where : { userId: req.user.id}}).then(expenses => {
        return res.status(200).json({expenses, success: true})
    })
    .catch(err => {
        console.log(err)
        return res.status(500).json({ error: err, success: false})
    })
}

const deleteexpense = async (req, res) => {
    const t = await sequelize.transaction();
    try{

    const expenseid = req.params.expenseid;
    if(expenseid == undefined || expenseid.length === 0){
        return res.status(400).json({success: false, })
    }

    const expense = await Expense.findByPk(expenseid);
    await User.update({
        totalExpenses: req.user.totalExpenses - expense.expenseamount
    },{where: {id: req.user.id}},{transaction: t});

   
    let destroy = await Expense.destroy({where: { id: expenseid, userId: req.user.id }},{transaction: t});
        if(destroy === 0){
            await t.rollback();
            return res.status(404).json({success: false, message: 'Expense doenst belong to the user'})
        }
        return res.status(200).json({ success: true, message: "Deleted Successfuly"})
    }catch(err) {
        console.log(err);
        await t.rollback();
        return res.status(500).json({ success: true, message: "Failed"})
    }
}

// const downloadExpenses =  async (req, res) => {
//     const expenses = await req.expenses.getexpenses();
//     console.log(expenses);
// };

function uploadTos3(data, filename){
    const BUCKET_NAME ='expensetrackingapp22';
    const IAM_USER_KEY = 'AKIAQMMRBQ7UGMAC43VM';
    const IAM_USER_SECRET = '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';

        let s3bucket = new AWS.S3({
        accessKeyId: IAM_USER_KEY,
        secretAccessKey: IAM_USER_SECRET
        // Bucket: BUCKET_NAME
        })

        var params = {
            Bucket: BUCKET_NAME,
            Key: filename,
            Body: data,
            ACL: 'public-read'
        }

        return new Promise((resolve,reject)=>{
            s3bucket.upload(params, (err, s3response)=>{
                if(err){
                    console.log("Something went wrong",err)
                    // reject(err);
                }else{
                    console.log("success",s3response);
                    resolve(s3response.Location);
                }
            })
        })

        
    }





const downloadExpenses = async (req, res) => {
    try {
      // Assuming req.user is the current user object
      const expenses = await req.user.getExpenses();
      console.log(expenses);

      const stringifiedExpenses = JSON.stringify(expenses);

      const userId = req.user.id;

      //It should depend upon userid
      const filename = `Expense${userId}/${new Date()}.txt`;
      const fileURl = await uploadTos3(stringifiedExpenses,filename);
      console.log(fileURl);
      res.status(200).json({ fileURl, success: true })
    

      // Add logic to send expenses data as a downloadable file
    } catch (error) {
      console.error('Error downloading expenses:', error);
      return res.status(500).json({ success: false, error: 'Failed to download expenses' });
    }
  };

  const addexpensetopagination = async (req, res) => {
    // try {
    //   const page = req.query.page || 1;
    //   const itemsPerPage = 3;
    //   const offset = (page - 1) * itemsPerPage;
  
    //   // Assuming you have a Sequelize query to fetch expenses with pagination
    //   const expenses = await Expense.findAll({
    //     limit: itemsPerPage,
    //     offset: offset,
    //     order: [['createdAt', 'DESC']], // Adjust the order as needed
    //   });
  
    //   res.json({ expenses });
    // } catch (error) {
    //   console.error(error);
    //   res.status(500).json({ error: 'Internal Server Error' });
    // }

    try {
        const page = req.query.page || 1;
        const pageSize = parseInt(req.query.pageSize, 10) || 10; // Parse to integer, default to 10 if not set
        const offset = (page - 1) * pageSize;
    
        // Assuming you have a Sequelize query to fetch expenses with pagination
        const expenses = await Expense.findAll({
          limit: pageSize,
          offset: offset,
          order: [['createdAt', 'DESC']], // Adjust the order as needed
        });
    
        res.json({ expenses });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
  }

module.exports = {
    deleteexpense,
    getexpenses,
    addexpense,
    downloadExpenses,
    addexpensetopagination
}