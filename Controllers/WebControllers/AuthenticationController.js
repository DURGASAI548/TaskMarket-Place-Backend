const mongoose = require('mongoose')

const Login = async (req, res, next) => {
    console.log("responding")
    res.cookie("token", "TestingCookie", {
        httpOnly: true,
        secure: true,
        sameSite: "none"
    });
    return res.status(200).json("Login API")
}

exports.Login = Login;