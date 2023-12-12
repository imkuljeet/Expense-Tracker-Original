const User = require("../models/users");
const bcrypt = require("bcrypt");

function isStringInvalid(string) {
  if (string === undefined || string.length === 0) {
    return true;
  } else {
    return false;
  }
}

exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log("email is", email);

    if (
      isStringInvalid(name) ||
      isStringInvalid(email) ||
      isStringInvalid(password)
    ) {
      return res
        .status(400)
        .json({ err: "Bad Parameters, Something is missing" });
    }

    const saltrounds = 10;
    bcrypt.hash(password, saltrounds, async (err, hash) => {
      console.log(err);

      await User.create({ name, email, password: hash });
      res.status(201).json({ message: "Successfully create New user" });
    });

    // await User.create({ name, email, password });
    // res.status(201).json({ message: "Successfully Created New User" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (isStringInvalid(email) || isStringInvalid(password)) {
      return res
        .status(400)
        .json({ success: false, message: "Email or password is missing" });
    }

    console.log(password);

    const user = await User.findAll({ where: { email } }); //same as User.findAll({ where: { email: email } });
    //user is an array of objects..user[0].password will provide me the password from the object in the array

    if (user.length > 0) {
      bcrypt.compare(password, user[0].password, (err, result) => {
        if (err) {
          throw new Error("Something went wrong");
        }
        if (result === true) {
          return res
            .status(200)
            .json({ success: true, message: "User logged in successfully" });
        } else {
          return res
            .status(400)
            .json({ success: false, message: "Password is incorrect" });
        }
      });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "User Doesnot exitst" });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
