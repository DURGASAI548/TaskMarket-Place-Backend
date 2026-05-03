const mongoose = require('mongoose')
const OrganizationSchema = require("../../Models/organization")
const UserSchema = require("../../Models/user")
const BranchSchema = require("../../Models/branch")
const RegistrationSchema = require("../../Models/registration")
const TaskSchema = require("../../Models/task")

const RegisterForTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const { taskId } = req.params;
  
    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(taskId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId or taskId",
      });
    }

    // ✅ 2. Get user & task
    const [user, task] = await Promise.all([
      UserSchema.findById(userId),
      TaskSchema.findById(taskId),
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (!task.isLive) {
      return res.status(400).json({
        success: false,
        message: "Task is not live",
      });
    }

    if (user.org.toString() !== task.orgScope.toString()) {
      return res.status(403).json({
        success: false,
        message: "User does not belong to this organization",
      });
    }

    if (task.branchScope) {
      if (user.branch.toString() !== task.branchScope.toString()) {
        return res.status(403).json({
          success: false,
          message: "User does not belong to this branch",
        });
      }
    }

    const alreadyRegistered = await RegistrationSchema.findOne({
      user: userId,
      task: taskId,
    });

    if (alreadyRegistered) {
      return res.status(400).json({
        success: false,
        message: "User already registered for this task",
      });
    }

    const registration = await RegistrationSchema.create({
      UserID: userId,
      TaskID: taskId,
      RegisteredAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: "Registered successfully",
      data: registration,
    });

  } catch (error) {
    console.error("Registration Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

exports.RegisterForTask=RegisterForTask





