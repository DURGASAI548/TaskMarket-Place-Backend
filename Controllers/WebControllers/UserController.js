const mongoose = require('mongoose')
const UserSchema = require("../../Models/user")

const GetNormalUsers = async (req, res) => {
    try {
        const users = await User.find({ userType: "user" })
            .select("name displayName email phoneNo profileURL"); 

        return res.status(200).json({
            success: true,
            count: users.length,
            data: users,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching users",
            error: error.message,
        });
    }
}

exports.GetNormalUsers = GetNormalUsers;