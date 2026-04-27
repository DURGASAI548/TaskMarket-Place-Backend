const mongoose = require('mongoose')
const UserSchema = require("../../Models/user")
const OrganizationSchema = require("../../Models/organization")
const BranchSchema = require("../../Models/branch")
const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const csv = require("csv-parser");
const fs = require("fs");

// ✅ S3 Client (same config as your upload)
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

// ✅ S3 Delete Utility
const deleteFromS3 = async (fileKey) => {
  try {
    if (!fileKey) return;

    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileKey, // must be the stored key (profileURL)
    });

    await s3.send(command);

    console.log("✅ File deleted from S3:", fileKey);
  } catch (error) {
    console.error("❌ S3 Delete Error:", error.message);
    // Do NOT throw → don't break main API
  }
};


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

const GetNormalUsersforBranch = async (req, res) => {
  try {
    const { branchId } = req.params;

    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: "Branch ID is required",
      });
    }

    const branch = await BranchSchema.findById(branchId);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    const users = await UserSchema.find({
      userType: "user",
      branch: branchId,
    }).select("name displayName email phoneNo profileURL");

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });

  } catch (error) {
    console.log("Get Normal Users Error:", error);
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
      displayName,
    } = req.body;

    if (!name || !email || !rollNo || !phoneNo || !org) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
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

    let branchData = null;

    if (loggedUser.userType === "superAdmin") {
      if (branch) {
        branchData = await BranchSchema.findById(branch);

        if (!branchData) {
          return res.status(404).json({
            success: false,
            message: "Branch not found",
          });
        }

        if (branchData.org.toString() !== org) {
          return res.status(400).json({
            success: false,
            message: "Branch does not belong to this organization",
          });
        }
      }
    }

    else if (loggedUser.userType === "orgAdmin") {
      if (loggedUser.org?.toString() !== org) {
        return res.status(403).json({
          success: false,
          message: "You can only add users to your organization",
        });
      }

      if (!branch) {
        return res.status(400).json({
          success: false,
          message: "Branch is required for orgAdmin",
        });
      }

      branchData = await BranchSchema.findById(branch);

      if (!branchData) {
        return res.status(404).json({
          success: false,
          message: "Branch not found",
        });
      }

      if (branchData.org.toString() !== org) {
        return res.status(400).json({
          success: false,
          message: "Branch does not belong to this organization",
        });
      }
    }

    else if (loggedUser.userType === "branchAdmin") {
      if (
        loggedUser.org?.toString() !== org ||
        loggedUser.branch?.toString() !== branch
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only add users to your branch",
        });
      }

      branchData = await BranchSchema.findById(branch);

      if (!branchData) {
        return res.status(404).json({
          success: false,
          message: "Branch not found",
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
      $or: [{ email }, { rollNo }],
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
      branch: branch || null,
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
    console.log("Add User Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating user",
      error: error.message,
    });
  }
};

const GetUsers = async (req, res) => {
  try {
    const userId = req.user.id;

    const loggedUser = await UserSchema.findById(userId);

    if (!loggedUser) {
      return res.status(404).json({
        success: false,
        message: "Logged-in user not found",
      });
    }

    let filter = {};

    if (loggedUser.userType === "superAdmin") {
      filter = { userType: { $ne: "superAdmin" } };
    }

    else if (loggedUser.userType === "orgAdmin") {
      filter = {
        userType: { $ne: "superAdmin" },
        org: loggedUser.org,
      };
    }

    else if (loggedUser.userType === "branchAdmin") {
      filter = {
        userType: { $ne: "superAdmin" },
        org: loggedUser.org,
        branch: loggedUser.branch,
      };
    }

    else {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const users = await UserSchema.find(filter)
      .populate({
        path: "org",
        select: "orgName",
      })
      .populate({
        path: "branch",
        select: "branchName",
      })
      .lean();

    const formattedUsers = users.map((user) => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      rollNo: user.rollNo,
      phoneNo: user.phoneNo,
      displayName: user.displayName,
      profileURL: user.profileURL,
      userType: user.userType,

      organizationName: user.org?.orgName || null,
      branchName: user.branch?.branchName || null,

      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      count: formattedUsers.length,
      data: formattedUsers,
    });

  } catch (error) {
    console.log("Get Users Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message,
    });
  }
};

const BulkUploadUsers = async (req, res) => {
  try {
    const userId = req.user.id;
    const { org, branch } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "CSV file is required",
      });
    }

    const loggedUser = await UserSchema.findById(userId);
    if (!loggedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const organization = await OrganizationSchema.findById(org);
    const branchData = await BranchSchema.findById(branch);

    if (!organization || !branchData) {
      return res.status(404).json({
        success: false,
        message: "Invalid org or branch",
      });
    }

    if (loggedUser.userType === "superAdmin") {
    }
    else if (loggedUser.userType === "orgAdmin") {
      if (loggedUser.org.toString() !== org) {
        return res.status(403).json({
          success: false,
          message: "You can only upload users to your organization",
        });
      }
    }
    else if (loggedUser.userType === "branchaAdmin") {
      if (
        loggedUser.org.toString() !== org ||
        loggedUser.branch.toString() !== branch
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only upload users to your branch",
        });
      }
    }
    else {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }


    const users = [];

    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(
          csv({
            mapHeaders: ({ header }) =>
              header.trim().replace(/^\uFEFF/, "")
          })
        )
        .on("data", (row) => users.push(row))
        .on("end", resolve)
        .on("error", reject);
    });

    let successCount = 0;
    let failedCount = 0;
    const failedData = [];

    for (let row of users) {
      console.log("Row Keys:", Object.keys(row));

      const name = row.name?.trim();
      const email = row.email?.trim();
      const displayName = row.displayName?.trim();
      const rollNo = row.rollNo?.trim();
      const phoneNo = row.phoneNo?.trim();
      console.log(name, email, displayName, rollNo, phoneNo)

      if (!name || !email || !rollNo || !phoneNo) {
        failedCount++;
        failedData.push({
          row,
          reason: "Missing required fields",
        });
        continue;
      }

      const existingUser = await UserSchema.findOne({
        $or: [{ email }, { rollNo }],
      });

      if (existingUser) {
        failedCount++;
        failedData.push({
          row,
          reason:
            existingUser.email === email
              ? "Email already exists"
              : "RollNo already exists",
        });
        continue;
      }

      await UserSchema.create({
        name,
        email,
        displayName,
        rollNo,
        phoneNo,
        org,
        branch,
        password: null,
        isEmailVerified: null,
        userType: "user",
        addedBy: userId,
        updatedBy: userId,
      });

      successCount++;
    }

    fs.unlinkSync(req.file.path);


    return res.status(200).json({
      success: true,
      message: "Bulk upload completed",
      stats: {
        total: users.length,
        uploaded: successCount,
        failed: failedCount,
      },
      failedData,
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error uploading users",
      error: error.message,
    });
  }
};

const DeleteUser = async (req, res) => {
  try {
    const loggedInUserId = req.user.id;
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // 🔍 Fetch users
    const loggedUser = await UserSchema.findById(loggedInUserId);
    const userToDelete = await UserSchema.findById(userId);

    if (!loggedUser) {
      return res.status(404).json({
        success: false,
        message: "Logged-in user not found",
      });
    }

    if (!userToDelete) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ❌ Prevent self delete
    if (userId === loggedInUserId) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete yourself",
      });
    }

    // 🔒 Role-based access
    if (loggedUser.userType === "superAdmin") {
      // full access
    }

    else if (loggedUser.userType === "orgAdmin") {
      if (
        userToDelete.org?.toString() !== loggedUser.org?.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only delete users in your organization",
        });
      }
    }

    else if (loggedUser.userType === "branchAdmin") {
      if (
        userToDelete.org?.toString() !== loggedUser.org?.toString() ||
        userToDelete.branch?.toString() !== loggedUser.branch?.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only delete users in your branch",
        });
      }
    }

    else {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // 🧠 IMPORTANT: Clean references before deleting user

    // 1️⃣ Remove from Organization if orgAdmin
    await OrganizationSchema.updateMany(
      { orgAdminUser: userId },
      { $set: { orgAdminUser: null } }
    );

    // 2️⃣ Remove from Branch if branchAdmin
    await BranchSchema.updateMany(
      { branchAdminUser: userId },
      { $set: { branchAdminUser: null } }
    );

    // 🔥 Delete profile image from S3
    if (userToDelete.profileURL) {
      await deleteFromS3(userToDelete.profileURL);
    }

    // 🗑️ Delete user
    await UserSchema.findByIdAndDelete(userId);

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });

  } catch (error) {
    console.log("Delete User Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting user",
      error: error.message,
    });
  }
};

const EditUser = async (req, res) => {
  try {
    const loggedInUserId = req.user.id;
    const { userId } = req.params;

    const {
      name,
      email,
      rollNo,
      phoneNo,
      org,
      branch,
      displayName,
    } = req.body;

    // 🔍 logged user
    const loggedUser = await UserSchema.findById(loggedInUserId);
    if (!loggedUser) {
      return res.status(404).json({
        success: false,
        message: "Logged-in user not found",
      });
    }

    // 🔍 target user
    const user = await UserSchema.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 🔒 ROLE CHECKS

    // ✅ superAdmin → full control
    if (loggedUser.userType === "superAdmin") {
      // no restriction
    }

    // ✅ orgAdmin
    else if (loggedUser.userType === "orgAdmin") {
      if (user.org?.toString() !== loggedUser.org?.toString()) {
        return res.status(403).json({
          success: false,
          message: "You can only edit users in your organization",
        });
      }

      // ❌ cannot move user outside org
      if (org && org !== loggedUser.org.toString()) {
        return res.status(403).json({
          success: false,
          message: "Cannot change organization",
        });
      }

      // ✅ branch must belong to same org
      if (branch) {
        const branchData = await BranchSchema.findById(branch);
        if (!branchData) {
          return res.status(404).json({
            success: false,
            message: "Branch not found",
          });
        }

        if (branchData.org.toString() !== loggedUser.org.toString()) {
          return res.status(400).json({
            success: false,
            message: "Branch does not belong to your organization",
          });
        }
      }
    }

    // ✅ branchAdmin
    else if (loggedUser.userType === "branchAdmin") {
      if (
        user.org?.toString() !== loggedUser.org?.toString() ||
        user.branch?.toString() !== loggedUser.branch?.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only edit users in your branch",
        });
      }

      // ❌ cannot change org
      if (org && org !== user.org.toString()) {
        return res.status(403).json({
          success: false,
          message: "Cannot change organization",
        });
      }

      // ⚠️ branch change allowed ONLY if he is admin of that branch
      if (branch && branch !== loggedUser.branch.toString()) {
        return res.status(403).json({
          success: false,
          message: "You can only assign users to your branch",
        });
      }
    }

    else {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // 🔍 Duplicate check (email / rollNo)
    if (email || rollNo) {
      const existingUser = await UserSchema.findOne({
        _id: { $ne: userId },
        $or: [
          ...(email ? [{ email }] : []),
          ...(rollNo ? [{ rollNo }] : []),
        ],
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
    }

    // 🔥 IMAGE REPLACEMENT (IMPORTANT PART)
    let profileURL = user.profileURL;

    if (req.file) {
      // delete old image
      if (user.profileURL) {
        await deleteFromS3(user.profileURL);
      }

      // save new image key
      profileURL = req.file.key;
    }

    // ✅ update fields (only if provided)
    if (name) user.name = name;
    if (email) user.email = email;
    if (rollNo) user.rollNo = rollNo;
    if (phoneNo) user.phoneNo = phoneNo;
    if (displayName) user.displayName = displayName;
    if (org) user.org = org;
    if (branch !== undefined) user.branch = branch;
    user.profileURL = profileURL;

    user.updatedBy = loggedInUserId;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user,
    });

  } catch (error) {
    console.log("Edit User Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating user",
      error: error.message,
    });
  }
};

const GetUserById = async (req, res) => {
  try {
    const loggedInUserId = req.user.id;
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const loggedUser = await UserSchema.findById(loggedInUserId);
    if (!loggedUser) {
      return res.status(404).json({
        success: false,
        message: "Logged-in user not found",
      });
    }

    const user = await UserSchema.findById(userId)
      .select("name email displayName rollNo phoneNo org branch profileURL")
      .populate("org", "orgName")
      .populate("branch", "branchName");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }


    if (loggedUser.userType === "superAdmin") {
      // no restriction
    }

    else if (loggedUser.userType === "orgAdmin") {
      if (
        user.org?._id.toString() !== loggedUser.org?.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only view users in your organization",
        });
      }
    }

    else if (loggedUser.userType === "branchAdmin") {
      if (
        user.org?._id.toString() !== loggedUser.org?.toString() ||
        user.branch?._id.toString() !== loggedUser.branch?.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only view users in your branch",
        });
      }
    }

    else {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const responseData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      displayName: user.displayName,
      rollNo: user.rollNo,
      phoneNo: user.phoneNo,
      org: user.org,
      branch: user.branch,
      profile: user.profileURL,
    };

    return res.status(200).json({
      success: true,
      data: responseData,
    });

  } catch (error) {
    console.log("Get User Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching user",
      error: error.message,
    });
  }
};

const getUsersByOrg = async (req, res) => {
  try {
    const { orgId } = req.params;

    if (!orgId) {
      return res.status(400).json({
        success: false,
        message: "Organization ID is required",
      });
    }

    const users = await UserSchema.find(
      { org: orgId },
      { _id: 1, name: 1, profileURL: 1 }
    );

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });

  } catch (error) {
    console.log("Error in getUsersByOrg:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};




exports.GetNormalUsersforBranch = GetNormalUsersforBranch;
exports.GetNormalUsers = GetNormalUsers;
exports.AddUser = AddUser;
exports.EditUser = EditUser;
exports.GetUsers = GetUsers;
exports.GetUserById = GetUserById;
exports.BulkUploadUsers = BulkUploadUsers;
exports.DeleteUser = DeleteUser;
exports.getUsersByOrg = getUsersByOrg;