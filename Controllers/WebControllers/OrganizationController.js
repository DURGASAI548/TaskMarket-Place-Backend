const mongoose = require('mongoose')
const OrganizationSchema = require("../../Models/organization")
const UserSchema = require("../../Models/user")

const AddOrganization = async (req, res) => {
  try {
    const userId = req.user.id
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. No user found",
      });
    }

    const user = await UserSchema.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.userType !== "superAdmin") {
      return res.status(403).json({
        success: false,
        message: "Only superAdmin can create organization",
      });
    }

    const { orgName, orgDescription, orgAdminUser } = req.body;

    if (!orgAdminUser || !orgName || !orgDescription.trim()) {
      return res.status(404).json({
        success: false,
        message: "All Fields are Required",
      });
    }
    const Adminuser = await UserSchema.findById(orgAdminUser);

    if (!Adminuser) {
      return res.status(404).json({
        success: false,
        message: "Admin User not found",
      });
    }

    const existingOrg = await OrganizationSchema.findOne({
      orgName: { $regex: `^${orgName}$`, $options: "i" },
    });

    if (existingOrg) {
      return res.status(400).json({
        success: false,
        message: "Organization already exists (case-insensitive match)",
      });
    }

    const newOrg = await OrganizationSchema.create({
      orgName,
      orgDescription,
      orgAdminUser,
      addedBy: userId,
      updatedBy: userId,
    });

    await UserSchema.findByIdAndUpdate(
        Adminuser,
        {userType : "orgAdmin"},
        {new : true}
    )
    res.status(201).json({
      success: true,
      message: "Organization created successfully",
      data: newOrg,
    });
  } catch (error) {
    console.log(error)
    res.status(500).json({
      success: false,
      message: "Error creating organization",
      error: error.message,
    });
  }
};

exports.AddOrganization = AddOrganization

