const mongoose = require('mongoose')
const OrganizationSchema = require("../../Models/organization")
const UserSchema = require("../../Models/user")
const BranchSchema = require("../../Models/branch")
const TagSchema = require("../../Models/tag")


const CreateTag = async (req, res) => {
  try {
    const { TagName } = req.body;
    const userId = req.user?.id; 
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await UserSchema.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.userType === "user") {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to create tags",
      });
    }

    if (!TagName || typeof TagName !== "string") {
      return res.status(400).json({
        success: false,
        message: "TagName is required and must be a string",
      });
    }

    const trimmedTag = TagName.trim();

    if (trimmedTag.length < 2 || trimmedTag.length > 50) {
      return res.status(400).json({
        success: false,
        message: "TagName must be between 2 and 50 characters",
      });
    }

    const existingTag = await TagSchema.findOne({
      TagName: { $regex: `^${trimmedTag}$`, $options: "i" },
    });

    if (existingTag) {
      return res.status(409).json({
        success: false,
        message: "Tag already exists",
      });
    }

    const newTag = await TagSchema.create({
      TagName: trimmedTag,
      AddedBy: userId,
    });

    return res.status(201).json({
      success: true,
      message: "Tag created successfully",
      data: newTag,
    });

  } catch (error) {
    console.error("Error in createTag:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const GetAllTags = async (req, res) => {
  try {
    const tags = await TagSchema.find(
      {},
      { _id: 1, TagName: 1 } 
    ).sort({ TagName: 1 });

    return res.status(200).json({
      success: true,
      count: tags.length,
      data: tags,
    });
  } catch (error) {
    console.error("Error in getAllTags:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.CreateTag = CreateTag
exports.GetAllTags = GetAllTags
