const mongoose = require('mongoose')
const UserSchema = require("../../Models/user")
const OrganizationSchema = require("../../Models/organization")
const BranchSchema = require("../../Models/branch")
const csv = require("csv-parser");
const fs = require("fs");


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
        .pipe(csv())
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
      console.log(name, email, displayName, rollNo, phoneNo )

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


exports.GetNormalUsersforBranch = GetNormalUsersforBranch;
exports.GetNormalUsers = GetNormalUsers;
exports.AddUser = AddUser;
exports.GetUsers = GetUsers;
exports.BulkUploadUsers = BulkUploadUsers;