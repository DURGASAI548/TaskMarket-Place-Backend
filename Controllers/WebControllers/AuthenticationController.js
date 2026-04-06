const mongoose = require('mongoose')

const Login = async(req , res , next) => {
    return res.status(200).json("Login API")
}

exports.Login = Login;