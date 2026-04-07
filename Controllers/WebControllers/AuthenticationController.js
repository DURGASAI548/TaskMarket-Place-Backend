const mongoose = require('mongoose')
const UserSchema = require("../../Models/user")
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const generateToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            role: user.userType,
            email:user.email,
            displayName:user.displayName
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "5h",
        }
    );
};

const Login = async (req, res) => {
    try {
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({
                message: "Email/Username and password required",
            });
        }

        
        const user = await UserSchema.findOne({
            $or: [{ email: identifier }, { name: identifier }],
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid credentials",
            });
        }

        
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid credentials",
            });
        }

        
        const token = generateToken(user);

       
        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "None",
            maxAge:  5 * 60 * 60 * 1000, 
        });

        return res.status(200).json({
            message: "Login successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.profileURL,
                role: user.userType,
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Server error",
        });
    }
};


exports.Login = Login;