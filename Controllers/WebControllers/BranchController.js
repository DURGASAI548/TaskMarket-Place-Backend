const mongoose = require('mongoose')
const UserSchema = require("../../Models/user")
const BranchSchema = require('../../Models/branch')
const OrganizationSchema = require("../../Models/organization")
const TaskSchema = require("../../Models/task")

const AddBranch = async (req, res) => {
  try {
    const userId = req.user.id;

    const { branchName, orgId, branchDescription } = req.body;

    if (!branchName || !orgId || !branchDescription) {
      return res.status(400).json({
        success: false,
        message: "Branch name , organization and Description are required",
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

    if (user.userType === "superAdmin") {
    } else if (user.userType === "orgAdmin") {
      if (organization.orgAdminUser.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: "You can only add branches to your organization",
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const existingBranch = await BranchSchema.findOne({
      org: orgId,
      branchName: { $regex: `^${branchName}$`, $options: "i" },
    });

    if (existingBranch) {
      return res.status(400).json({
        success: false,
        message: "Branch name already exists in this organization",
      });
    }

    const newBranch = await BranchSchema.create({
      branchName,
      org: orgId,
      branchAdminUser: null,
      branchDescription,
      addedBy: userId,
      updatedBy: userId,
    });

    return res.status(201).json({
      success: true,
      message: "Branch created successfully",
      data: newBranch,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error creating branch",
      error: error.message,
    });
  }
};

const GetBranches = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await UserSchema.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let matchCondition = {};

    if (user.userType === "superAdmin") {
      matchCondition = {};
    } 
    else if (user.userType === "orgAdmin") {
      matchCondition = { org: user.org };
    } 
    else if (user.userType === "branchaAdmin") {
      matchCondition = { branchAdminUser: userId }; 
    } 
    else {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const branches = await BranchSchema.aggregate([
      { $match: matchCondition },

      {
        $lookup: {
          from: "organizations",
          localField: "org",
          foreignField: "_id",
          as: "organization",
        },
      },
      {
        $unwind: {
          path: "$organization",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: "users",
          localField: "branchAdminUser", 
          foreignField: "_id",
          as: "admin",
        },
      },
      {
        $unwind: {
          path: "$admin",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "branch",
          as: "users",
        },
      },

      {
        $lookup: {
          from: "tasks",
          localField: "_id",
          foreignField: "branchScope", 
          as: "tasks",
        },
      },

      {
        $addFields: {
          orgName: "$organization.orgName",
          adminName: { $ifNull: ["$admin.name", null] },
          adminProfileURL: { $ifNull: ["$admin.profileURL", null] },
          userCount: { $size: "$users" },
          taskCount: { $size: "$tasks" },
        },
      },

      {
        $project: {
          _id: 1,
          branchName: 1,
          org: 1,
          orgName: 1,
          branchAdminUser: 1, 
          adminName: 1,
          adminProfileURL: 1,
          userCount: 1,
          taskCount: 1,
          createdAt: 1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      count: branches.length,
      data: branches,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error fetching branches",
      error: error.message,
    });
  }
};

const UpdateBranch = async (req, res) => {
  try {
    const userId = req.user.id;
    const { branchId } = req.params;

    const { branchName, branchDescription, branchAdminUser, org } = req.body;

    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: "Branch ID is required",
      });
    }

    const user = await UserSchema.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const branch = await BranchSchema.findById(branchId);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }


    if (user.userType === "orgAdmin") {
      if (user.org?.toString() !== branch.org.toString()) {
        return res.status(403).json({
          success: false,
          message: "You can only edit branches in your organization",
        });
      }
    }

    else if (user.userType === "branchAdmin") {
      if (user.branch?.toString() !== branchId) {
        return res.status(403).json({
          success: false,
          message: "You can only edit your branch",
        });
      }

      if (branchAdminUser) {
        return res.status(403).json({
          success: false,
          message: "Branch admin cannot change branch admin",
        });
      }

      if (org) {
        return res.status(403).json({
          success: false,
          message: "Branch admin cannot change branch organization",
        });
      }
    }

    else if (user.userType !== "superAdmin") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (org) {
      if (user.userType !== "superAdmin") {
        return res.status(403).json({
          success: false,
          message: "Only superAdmin can change branch organization",
        });
      }

      if (org !== branch.org.toString()) {
        const newOrg = await OrganizationSchema.findById(org);

        if (!newOrg) {
          return res.status(404).json({
            success: false,
            message: "Organization not found",
          });
        }

        branch.org = org;

        await UserSchema.updateMany(
          { branch: branchId },
          { org: org }
        );
      }
    }

    if (branchName) {
      const existingBranch = await BranchSchema.findOne({
        _id: { $ne: branchId },
        org: branch.org,
        branchName: { $regex: `^${branchName}$`, $options: "i" },
      });

      if (existingBranch) {
        return res.status(400).json({
          success: false,
          message: "Branch name already exists in this organization",
        });
      }

      branch.branchName = branchName;
    }

    if (branchDescription !== undefined) {
      branch.branchDescription = branchDescription;
    }

    if (
      branchAdminUser &&
      branchAdminUser !== branch.branchAdminUser?.toString()
    ) {
      const oldAdminId = branch.branchAdminUser;
      const newAdminId = branchAdminUser;

      const newAdmin = await UserSchema.findById(newAdminId);

      if (!newAdmin) {
        return res.status(404).json({
          success: false,
          message: "New admin user not found",
        });
      }


      if (newAdmin.userType !== "user") {
        return res.status(400).json({
          success: false,
          message: "Only normal users can be assigned as branch admin",
        });
      }

      if (
        newAdmin.branch?.toString() !== branchId ||
        newAdmin.org?.toString() !== branch.org.toString()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "User must belong to the same branch and organization",
        });
      }

      branch.branchAdminUser = newAdminId;

      await UserSchema.findByIdAndUpdate(newAdminId, {
        userType: "branchAdmin",
      });

      if (oldAdminId) {
        await UserSchema.findByIdAndUpdate(oldAdminId, {
          userType: "user",
        });
      }
    }

    branch.updatedBy = userId;

    await branch.save();

    return res.status(200).json({
      success: true,
      message: "Branch updated successfully",
      data: branch,
    });

  } catch (error) {
    console.log("Update Branch Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating branch",
      error: error.message,
    });
  }
};

const GetBranchById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { branchId } = req.params;

    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: "Branch ID is required",
      });
    }

    const user = await UserSchema.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const branch = await BranchSchema.findById(branchId);

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    const isSuperAdmin = user.userType === "superAdmin";
    const isBranchAdmin =
      branch.branchAdminUser?.toString() === userId;
    const isOrgAdmin =
      user.userType === "orgAdmin" &&
      user.org?.toString() === branch.org.toString();

    if (!isSuperAdmin && !isOrgAdmin && !isBranchAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    return res.status(200).json({
      success: true,
      data: branch,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error fetching branch",
      error: error.message,
    });
  }
};

const DeleteBranch = async (req, res) => {
  try {
    const userId = req.user.id;
    const { branchId } = req.params;

    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: "Branch ID is required",
      });
    }

    const user = await UserSchema.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const branch = await BranchSchema.findById(branchId);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    if (
      user.userType !== "superAdmin" &&
      branch.addedBy?.toString() !== userId
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this branch",
      });
    }

    const branchAdminId = branch.branchAdminUser;

    await UserSchema.deleteMany({ branch: branchId });

    await TaskSchema.deleteMany({ branchScope: branchId });

    await BranchSchema.findByIdAndDelete(branchId);

   

    if (branchAdminId) {
      const stillAdmin = await BranchSchema.findOne({
        branchAdminUser: branchAdminId,
      });

      if (!stillAdmin) {
        await UserSchema.findByIdAndUpdate(branchAdminId, {
          userType: "user",
          branch: null,
        });
      }
    }


    return res.status(200).json({
      success: true,
      message:
        "Branch, users, tasks deleted and admin role updated successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error deleting branch",
      error: error.message,
    });
  }
};


exports.AddBranch = AddBranch
exports.GetBranches = GetBranches
exports.UpdateBranch = UpdateBranch
exports.GetBranchById = GetBranchById
exports.DeleteBranch = DeleteBranch