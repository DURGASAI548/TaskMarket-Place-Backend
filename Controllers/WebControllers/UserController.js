const mongoose = require('mongoose')
const UserSchema = require("../../Models/user")
const OrganizationSchema = require("../../Models/organization")
const BranchSchema = require("../../Models/branch")


const GetNormalUsers = async (req, res) => {
    try {
        const users = await UserSchema.find({ userType: "user" })
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

const AddUser = async (req, res) => {
    try {
        const userId = req.user.id;

        const {
            name,
            email,
            rollNo,
            phoneNo,
            org,
            branch,
            displayName
        } = req.body;


        if (!name || !email || !rollNo || !phoneNo || !org || !branch) {
            return res.status(400).json({
                success: false,
                message: "All required fields must be provided",
            });
        }


        const loggedUser = await UserSchema.findById(userId);

        if (!loggedUser) {
            return res.status(404).json({
                success: false,
                message: "Logged-in user not found",
            });
        }

        const organization = await OrganizationSchema.findById(org);
        if (!organization) {
            return res.status(404).json({
                success: false,
                message: "Organization not found",
            });
        }

        const branchData = await BranchSchema.findById(branch);
        if (!branchData) {
            return res.status(404).json({
                success: false,
                message: "Branch not found",
            });
        }


        if (loggedUser.userType === "superAdmin") {
        }

        else if (loggedUser.userType === "orgAdmin") {
            if (loggedUser.org?.toString() !== org) {
                return res.status(403).json({
                    success: false,
                    message: "You can only add users to your organization",
                });
            }

            if (branchData.org.toString() !== org) {
                return res.status(400).json({
                    success: false,
                    message: "Branch does not belong to this organization",
                });
            }
        }

        else if (loggedUser.userType === "branchaAdmin") {
            if (
                loggedUser.org?.toString() !== org ||
                loggedUser.branch?.toString() !== branch
            ) {
                return res.status(403).json({
                    success: false,
                    message: "You can only add users to your branch",
                });
            }
        }

        else {
            return res.status(403).json({
                success: false,
                message: "Access denied",
            });
        }


        const existingUser = await UserSchema.findOne({
            $or: [
                { email },
                { rollNo }
            ]
        });

        if (existingUser) {
            let message = "User already exists";

            if (existingUser.email === email) {
                message = "Email already exists";
            } else if (existingUser.rollNo === rollNo) {
                message = "Roll number already exists";
            }

            return res.status(400).json({
                success: false,
                message,
            });
        }



        let profileURL = null;

        if (req.file) {
            profileURL = req.file.key;
        }
        const newUser = await UserSchema.create({
            name,
            email,
            password: null,
            isEmailVerified: null,
            rollNo,
            phoneNo,
            org,
            branch,
            displayName,
            profileURL,
            userType: "user",
            addedBy: userId,
            updatedBy: userId,
        });

        return res.status(201).json({
            success: true,
            message: "User created successfully",
            data: newUser,
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Error creating user",
            error: error.message,
        });
    }
};

exports.GetNormalUsers = GetNormalUsers;
exports.AddUser = AddUser;