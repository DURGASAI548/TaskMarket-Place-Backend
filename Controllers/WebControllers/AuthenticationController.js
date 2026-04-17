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
        <h3>Your OTP for verification</h3>
        <p><b>${otp}</b></p>
        <p>This OTP is valid for 5 minutes.</p>
      `,
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