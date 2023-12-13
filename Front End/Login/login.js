async function login(e){
    try{
        e.preventDefault();
        console.log(e.target.email.value);

        const loginDetails = {
            email : e.target.email.value,
            password : e.target.password.value
        }

        console.log(loginDetails);

        const response = await axios.post('http://localhost:3000/user/login',loginDetails)
            window.location.href = "../ExpenseTracker/index.html";
    }catch(err){
        console.log(JSON.stringify(err));
        document.body.innerHTML += `<div style = "color:red;">${err}</div>`;
    }
}