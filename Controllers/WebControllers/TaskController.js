const mongoose = require('mongoose')
const UserSchema = require("../../Models/user")
const OrganizationSchema = require("../../Models/organization")
const BranchSchema = require("../../Models/branch")
const TaskSchema = require("../../Models/task")
const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const AddTask = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await UserSchema.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.userType === "user") {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to create tasks",
      });
    }
    console.log(req.body)

    const {
      taskNo,
      taskTitle,
      taskDescription,
      taskSubmissionDeadline,
      taskRegistrationDeadline,
      taskRegistrationLiveFrom,
      taskRewardType,
      taskRewardNo,
      taskRewards,
      taskTags,
      taskConstraints,
      fileAcceptType,
      evaluators,
      isLive,
      acceptGithubLink,
      acceptLiveLink,
      branchScope,
      orgScope,
      passKey,
      taskResultDeadline,
    } = req.body;

    if (!taskNo || !taskTitle || !orgScope || !passKey) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }

    const existingTaskNo = await TaskSchema.findOne({ taskNo });
    if (existingTaskNo) {
      return res.status(409).json({
        success: false,
        message: "Task number already exists",
      });
    }

    // 🔁 Check duplicate taskTitle (case-insensitive)
    const existingTitle = await Task.findOne({
      taskTitle: { $regex: `^${taskTitle}$`, $options: "i" },
    });

    if (existingTitle) {
      return res.status(409).json({
        success: false,
        message: "Task title already exists",
      });
    }

    // 🔐 Role-based validation
    if (user.userType === "orgAdmin") {
      if (String(user.org) !== String(orgScope)) {
        return res.status(403).json({
          success: false,
          message: "You can only create tasks in your organization",
        });
      }
    }

    if (user.userType === "branchAdmin") {
      if (
        String(user.branch) !== String(branchScope) ||
        String(user.org) !== String(orgScope)
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only create tasks in your branch",
        });
      }
    }

    // 🧩 Parse JSON fields
    const parsedTaskTags = JSON.parse(taskTags || "[]");
    const parsedConstraints = JSON.parse(taskConstraints || "[]");
    const parsedFileTypes = JSON.parse(fileAcceptType || "[]");
    const parsedEvaluators = JSON.parse(evaluators || "[]");
    const parsedRewards = JSON.parse(taskRewards || "[]");
    // 📄 File upload (S3)
    let taskDocumentURL = null;
    if (req.file) {
      taskDocumentURL = req.file.location; // multer-s3 gives this
    }

    // 💾 Create task
    const newTask = await Task.create({
      taskNo: Number(taskNo),
      taskTitle: taskTitle.trim(),
      taskDescription: taskDescription?.trim(),
      taskSubmissionDeadline: new Date(taskSubmissionDeadline),
      taskRegistrationDeadline: new Date(taskRegistrationDeadline),
      taskRegistrationLiveFrom: new Date(taskRegistrationLiveFrom),
      taskRewardType,
      taskRewardNo: Number(taskRewardNo),
      taskRewards: JSON.stringify(parsedRewards), // schema expects string
      isLive: isLive === "true" || isLive === true,
      taskDocument: taskDocumentURL,
      taskTags: parsedTaskTags,
      taskConstraints: parsedConstraints,
      fileAcceptType: parsedFileTypes,
      acceptGithubLink: acceptGithubLink === "true" || acceptGithubLink === true,
      acceptLiveLink: acceptLiveLink === "true" || acceptLiveLink === true,
      branchScope: branchScope || null,
      orgScope,
      passKey: passKey.trim(),
      evaluators: parsedEvaluators,
      taskResultDeadline: new Date(taskResultDeadline),
      addedBy: userId,
    });

    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: newTask,
    });

  } catch (error) {
    console.error("Error in addTask:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.AddTask = AddTask