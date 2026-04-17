const mongoose = require('mongoose')
const UserSchema = require("../../Models/user")
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require('nodemailer');

const generateToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            role: user.userType,
            email: user.email,
            displayName: user.displayName
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "5h",
        }
    );
};

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000);
};

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "battu2825@gmail.com",
        pass: "ztcg rrwh rfdo uptp",
    },
});

const CheckUserAndSendOTP = async (req, res) => {
    try {
        const { identifier } = req.body;
        if (!identifier) {
            return res.status(400).json({
                success: false,
                message: "Identifier (email or displayName) is required",
            });
        }
        const user = await UserSchema.findOne({
            $or: [{ email: identifier }, { displayName: identifier }],
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (user.isEmailVerified === true) {
            return res.status(200).json({
                success: true,
                message: "User already verified",
            });
        }
        if (user.otpCreatedAt) {
            const diff = (new Date() - user.otpCreatedAt) / 1000;
            if (diff < 60) {
                return res.status(429).json({
                    success: false,
                    message: "Please wait before requesting another OTP",
                });
            }
        }

        const otp = generateOTP();

        user.otp = otp;
        user.otpCreatedAt = new Date();
        await user.save();

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: "Task Market Place Email Verification OTP",
            html: `
       <!DOCTYPE html>

<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>OTP Verification</title>
</head>
<body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color:#f4f6f8;">

  <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; margin:auto; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.08);">
<tr>
  <td style="background:#0a66c2; padding:20px; text-align:center; color:#ffffff;">
    <h2 style="margin:0;">Task Market Place</h2>
    <p style="margin:5px 0 0; font-size:14px;">Aditya University</p>
  </td>
</tr>

<!-- Body -->
<tr>
  <td style="padding:30px; text-align:left; color:#333;">
    <h3 style="margin-top:0;">OTP Verification</h3>
    <p>Hello,</p>
    <p>
      Use the One-Time Password (OTP) below to complete your verification process on 
      <strong>Task Market Place</strong>.
    </p>

    <!-- OTP Box -->
    <div style="margin:25px 0; text-align:center;">
      <span style="display:inline-block; padding:15px 30px; font-size:24px; letter-spacing:5px; background:#f0f4ff; color:#0a66c2; border-radius:6px; font-weight:bold;">
        {{OTP_CODE}}
      </span>
    </div>

    <p style="font-size:14px;">
      This OTP is valid for <strong>5 minutes</strong>. Please do not share it with anyone.
    </p>

    <p style="font-size:14px; color:#777;">
      If you did not request this, you can safely ignore this email.
    </p>
  </td>
</tr>

<!-- Footer -->
<tr>
  <td style="background:#f4f6f8; padding:20px; text-align:center; font-size:12px; color:#777;">
    © 2026 Aditya University<br/>
    Task Market Place | All Rights Reserved
  </td>
</tr>

  </table>

      `
        };

        await transporter.sendMail(mailOptions);

        return res.status(200).json({
            success: true,
            message: "OTP sent to registered email",
        });
    } catch (error) {
        console.log("Error in checkUserAndSendOTP:", error);
        return res.status(500).json({
            success: false,
            message: error,
        });
    }
};

const VerifyUserOTP = async (req, res) => {
    try {
        const { identifier, otp } = req.body;
        if (!identifier || !otp) {
            return res.status(400).json({
                success: false,
                message: "Identifier and OTP are required",
            });
        }

        const user = await UserSchema.findOne({
            $or: [{ email: identifier }, { displayName: identifier }],
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (!user.otp || !user.otpCreatedAt) {
            return res.status(400).json({
                success: false,
                message: "No OTP found. Please request a new one.",
            });
        }

        const diff = (new Date() - user.otpCreatedAt) / 1000;
        if (diff > 300) {
            return res.status(400).json({
                success: false,
                message: "OTP expired. Please request a new one.",
            });
        }

        if (user.otp !== Number(otp)) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP",
            });
        }

        user.isEmailVerified = true;
        // user.otp = null;
        // user.otpCreatedAt = null;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Email verified successfully",
        });
    } catch (error) {
        console.error("Error in verifyUserOTP:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

const SetUserPassword = async (req, res) => {
    try {
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({
                success: false,
                message: "Identifier and password are required",
            });
        }

        const user = await UserSchema.findOne({
            $or: [{ email: identifier }, { displayName: identifier }],
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (!user.isEmailVerified) {
            return res.status(403).json({
                success: false,
                message: "User is not verified. Please verify OTP first.",
            });
        }

        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        user.password = hashedPassword;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password set successfully",
        });
    } catch (error) {
        console.log("Error in setUserPassword:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
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
            $or: [{ email: identifier }, { displayName: identifier }],
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
            maxAge: 5 * 60 * 60 * 1000,
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

const Logout = async (req, res) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: true,
            sameSite: "None",
        });

        return res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error logging out",
            error: error.message,
        });
    }
};

const VerifyTokenEachPage = async (req, res) => {
    const authHeader = req.cookies.token;
    if (!authHeader) return res.status(401).json({ message: 'Unauthorized' });

    const token = authHeader;
    console.log(token)
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        console.log(req.user)
        return res.status(200).json({ message: "Valid token" })
    } catch (err) {
        return res.status(403).json({ message: 'Invalid token' });
    }
}

exports.Login = Login;
exports.Logout = Logout;
exports.VerifyTokenEachPage = VerifyTokenEachPage;
exports.CheckUserAndSendOTP = CheckUserAndSendOTP;
exports.VerifyUserOTP = VerifyUserOTP;
exports.SetUserPassword = SetUserPassword;