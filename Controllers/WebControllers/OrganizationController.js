const mongoose = require('mongoose')
const OrganizationSchema = require("../../Models/organization")
const UserSchema = require("../../Models/user")
const BranchSchema = require("../../Models/branch")

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
    return res.status(201).json({
      success: true,
      message: "Organization created successfully",
      data: newOrg,
    });
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      success: false,
      message: "Error creating organization",
      error: error.message,
    });
  }
};

const GetOrganizations = async (req, res) => {
  try {
    const userId = req.user.id;

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

    let matchCondition = {};

    if (user.userType === "superAdmin") {
      matchCondition = {}; // all orgs
    } else if (user.userType === "orgAdmin") {
      matchCondition = { orgAdminUser: userId };
    } else {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const organizations = await OrganizationSchema.aggregate([
      { $match: matchCondition },

      {
        $lookup: {
          from: "branches", 
          localField: "_id",
          foreignField: "org",
          as: "branches",
        },
      },

      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "org",
          as: "users",
        },
      },

      {
        $lookup: {
          from: "tasks",
          localField: "_id",
          foreignField: "orgScope",
          as: "tasks",
        },
      },
      {
        $addFields: {
          branchCount: { $size: "$branches" },
          userCount: { $size: "$users" },
          taskCount: { $size: "$tasks" },
        },
      },
      {
        $project: {
          branches: 0,
          users: 0,
          tasks: 0,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      count: organizations.length,
      data: organizations,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error fetching organizations",
      error: error.message,
    });
  }
};

const UpdateOrganization = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orgId } = req.params;

    const { orgName, orgDescription, orgAdminUser } = req.body;

    if (!orgId) {
      return res.status(400).json({
        success: false,
        message: "Organization ID is required",
      });
    }

    const user = await UserSchema.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const organization = await OrganizationSchema.findById(orgId);
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    if (
      user.userType !== "superAdmin" &&
      organization.orgAdminUser.toString() !== userId
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to edit this organization",
      });
    }

    if (orgName) {
      const existingOrg = await OrganizationSchema.findOne({
        _id: { $ne: orgId },
        orgName: { $regex: `^${orgName}$`, $options: "i" },
      });

      if (existingOrg) {
        return res.status(400).json({
          success: false,
          message: "Organization name already exists",
        });
      }

      organization.orgName = orgName;
    }

    if (orgDescription !== undefined) {
      organization.orgDescription = orgDescription;
    }

    if (orgAdminUser && orgAdminUser !== organization.orgAdminUser.toString()) {
      const oldAdminId = organization.orgAdminUser;
      const newAdminId = orgAdminUser;

      const newAdmin = await UserSchema.findById(newAdminId);
      if (!newAdmin) {
        return res.status(404).json({
          success: false,
          message: "New admin user not found",
        });
      }

      organization.orgAdminUser = newAdminId;

      await UserSchema.findByIdAndUpdate(newAdminId, {
        userType: "orgAdmin",
      });

      const stillAdmin = await OrganizationSchema.findOne({
        orgAdminUser: oldAdminId,
      });

      if (!stillAdmin) {
        await UserSchema.findByIdAndUpdate(oldAdminId, {
          userType: "user",
        });
      }
    }

    organization.updatedBy = userId;

    await organization.save();

    return res.status(200).json({
      success: true,
      message: "Organization updated successfully",
      data: organization,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error updating organization",
      error: error.message,
    });
  }
};

const GetOrganizationById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orgId } = req.params;

    if (!orgId) {
      return res.status(400).json({
        success: false,
        message: "Organization ID is required",
      });
    }

    const user = await UserSchema.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const organization = await OrganizationSchema.findById(orgId);

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    if (
      user.userType !== "superAdmin" &&
      organization.orgAdminUser.toString() !== userId
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    return res.status(200).json({
      success: true,
      data: organization,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error fetching organization",
      error: error.message,
    });
  }
};


const DeleteOrganization = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orgId } = req.params;

    if (!orgId) {
      return res.status(400).json({
        success: false,
        message: "Organization ID is required",
      });
    }

    const organization = await OrganizationSchema.findById(orgId);

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    if (organization.addedBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Only organization creator can delete",
      });
    }

    const orgAdminId = organization.orgAdminUser;

    const branches = await BranchSchema.find({ org: orgId });
    const branchAdminIds = branches.map(b => b.branchAdmin).filter(Boolean);

    await BranchSchema.deleteMany({ org: orgId });

    await UserSchema.deleteMany({ org: orgId });

    await OrganizationSchema.findByIdAndDelete(orgId);

    

    if (orgAdminId) {
      const stillOrgAdmin = await OrganizationSchema.findOne({
        orgAdminUser: orgAdminId,
      });

      if (!stillOrgAdmin) {
        await UserSchema.findByIdAndUpdate(orgAdminId, {
          userType: "user",
        });
      }
    }

    const uniqueBranchAdmins = [...new Set(branchAdminIds)];

    for (let adminId of uniqueBranchAdmins) {
      const stillBranchAdmin = await BranchSchema.findOne({
        branchAdmin: adminId,
      });

      if (!stillBranchAdmin) {
        await UserSchema.findByIdAndUpdate(adminId, {
          userType: "user",
        });
      }
    }


    return res.status(200).json({
      success: true,
      message:
        "Organization, branches, users deleted and roles updated successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error deleting organization",
      error: error.message,
    });
  }
};


exports.AddOrganization = AddOrganization
exports.GetOrganizations = GetOrganizations
exports.UpdateOrganization = UpdateOrganization
exports.GetOrganizationById = GetOrganizationById
exports.DeleteOrganization = DeleteOrganization

