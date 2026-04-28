const mongoose = require('mongoose')
const UserSchema = require("../../Models/user")
const OrganizationSchema = require("../../Models/organization")
const BranchSchema = require("../../Models/branch")
const TaskSchema = require("../../Models/task")
const RegistrationSchema = require("../../Models/registration")
const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require("crypto");
const generateTaskNo = () => {
  return Math.floor(100000 + Math.random() * 900000);
};

const generatePassKey = (length = 16) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = crypto.randomBytes(length);

  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
};

const GenerateTaskCredentials = async (req, res) => {
  try {
    let taskNo;
    let passKey;

    let taskExists = true;
    let passKeyExists = true;

    while (taskExists) {
      taskNo = generateTaskNo();
      taskExists = await TaskSchema.exists({ taskNo });
    }

    while (passKeyExists) {
      passKey = generatePassKey(16);
      passKeyExists = await TaskSchema.exists({ passKey });
    }

    return res.status(200).json({
      success: true,
      message: "Generated successfully",
      data: {
        taskNo,
        passKey,
      },
    });

  } catch (error) {
    console.error("Error generating credentials:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

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

    if (!mongoose.Types.ObjectId.isValid(orgScope)) {
      return res.status(400).json({
        success: false,
        message: "Invalid orgScope",
      });
    }

    if (branchScope && !mongoose.Types.ObjectId.isValid(branchScope)) {
      return res.status(400).json({
        success: false,
        message: "Invalid branchScope",
      });
    }

    const regLiveFrom = new Date(taskRegistrationLiveFrom);
    const regDeadline = new Date(taskRegistrationDeadline);
    const submissionDeadline = new Date(taskSubmissionDeadline);
    const resultDeadline = new Date(taskResultDeadline);

    if (
      isNaN(regLiveFrom) ||
      isNaN(regDeadline) ||
      isNaN(submissionDeadline) ||
      isNaN(resultDeadline)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format",
      });
    }

    if (!(regLiveFrom < regDeadline && regDeadline < submissionDeadline && submissionDeadline < resultDeadline)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date sequence. Ensure: Live < Registration < Submission < Result",
      });
    }

    const existingTaskNo = await TaskSchema.findOne({ taskNo });
    if (existingTaskNo) {
      return res.status(409).json({
        success: false,
        message: "Task number already exists",
      });
    }

    const existingTitle = await TaskSchema.findOne({
      taskTitle: { $regex: `^${taskTitle}$`, $options: "i" },
    });

    if (existingTitle) {
      return res.status(409).json({
        success: false,
        message: "Task title already exists",
      });
    }

    const existingPassKey = await TaskSchema.findOne({ passKey });
    if (existingPassKey) {
      return res.status(409).json({
        success: false,
        message: "PassKey already exists",
      });
    }

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
        !branchScope ||
        String(user.branch) !== String(branchScope) ||
        String(user.org) !== String(orgScope)
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only create tasks in your branch",
        });
      }
    }

    let parsedTaskTags = [];
    let parsedConstraints = [];
    let parsedFileTypes = [];
    let parsedEvaluators = [];
    let parsedRewards = [];

    try {
      parsedTaskTags = JSON.parse(taskTags || "[]");
      parsedConstraints = JSON.parse(taskConstraints || "[]");
      parsedFileTypes = JSON.parse(fileAcceptType || "[]");
      parsedEvaluators = JSON.parse(evaluators || "[]");
      parsedRewards = JSON.parse(taskRewards || "[]");
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "Invalid JSON format in arrays",
      });
    }

    let taskDocumentURL = null;
    if (req.file) {
      taskDocumentURL = req.file.key; 
    }

    const newTask = await TaskSchema.create({
      taskNo: Number(taskNo),
      taskTitle: taskTitle.trim(),
      taskDescription: taskDescription?.trim(),
      taskSubmissionDeadline: submissionDeadline,
      taskRegistrationDeadline: regDeadline,
      taskRegistrationLiveFrom: regLiveFrom,
      taskRewardType,
      taskRewardNo: Number(taskRewardNo),
      taskRewards: parsedRewards,
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
      taskResultDeadline: resultDeadline,
      addedBy: userId,
    });

    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: newTask,
    });

  } catch (error) {
    console.error("Error in AddTask:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const GetAllTasks = async (req, res) => {
  try {
    const tasks = await TaskSchema.aggregate([

      {
        $lookup: {
          from: "organizations",
          localField: "orgScope",
          foreignField: "_id",
          as: "orgData",
        },
      },
      { $unwind: { path: "$orgData", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "branches",
          localField: "branchScope",
          foreignField: "_id",
          as: "branchData",
        },
      },
      { $unwind: { path: "$branchData", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "tags",
          localField: "taskTags",
          foreignField: "_id",
          as: "tagData",
        },
      },

      {
        $lookup: {
          from: "registrations",
          localField: "_id",
          foreignField: "TaskID",
          as: "registrations",
        },
      },

      {
        $addFields: {
          registeredCount: { $size: "$registrations" },
        },
      },

      {
        $lookup: {
          from: "users",
          let: {
            orgId: "$orgScope",
            branchId: "$branchScope",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$org", "$$orgId"] },
                    {
                      $cond: [
                        { $ifNull: ["$$branchId", false] },
                        { $eq: ["$branch", "$$branchId"] },
                        true,
                      ],
                    },
                  ],
                },
              },
            },
          ],
          as: "eligibleUsers",
        },
      },

      {
        $addFields: {
          eligibleCount: { $size: "$eligibleUsers" },
        },
      },

      {
        $project: {
          _id: 1,
          taskNo: 1,
          taskTitle: 1,
          isLive: 1,
          taskRegistrationLiveFrom: 1,
          taskRegistrationDeadline: 1,
          taskSubmissionDeadline: 1,
          taskResultDeadline: 1,
          taskRewardType: 1,
          orgScopeName: "$orgData.orgName",
          branchScopeName: "$branchData.branchName",
          taskDescription:1,
          taskTags: {
            $map: {
              input: "$tagData",
              as: "tag",
              in: "$$tag.TagName",
            },
          },

          registeredCount: 1,
          eligibleCount: 1,
        },
      },

      { $sort: { createdAt: -1 } }

    ]);

    return res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });

  } catch (error) {
    console.error("Error in getAllTasks:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};





exports.AddTask = AddTask
exports.GenerateTaskCredentials = GenerateTaskCredentials
exports.GetAllTasks = GetAllTasks