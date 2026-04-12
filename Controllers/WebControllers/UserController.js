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
      // ✅ branch optional
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
      profileURL = `${process.env.S3_BASE_URL}/${req.file.key}`;
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
      filter = {};
    } 
    
    else if (loggedUser.userType === "orgAdmin") {
      filter = {
        org: loggedUser.org,
      };
    } 
    
    else if (loggedUser.userType === "branchAdmin") {
      filter = {
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


exports.GetNormalUsers = GetNormalUsers;
exports.AddUser = AddUser;
exports.GetUsers = GetUsers;