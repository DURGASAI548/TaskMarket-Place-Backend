const express = require("express");
const router = express.Router();
const TaskController = require("../../Controllers/WebControllers/TaskController")
const VerifyToken = require('../../ExternalSources/JwtController');
const {upload} = require("../../ExternalSources/S3Controller")
const multer = require("multer");
const Upload = multer({ dest: "uploads/" });

router.post("/add-task",upload.single("taskDocument"),VerifyToken,TaskController.AddTask)
router.get("/get-task-credentials",VerifyToken,TaskController.GenerateTaskCredentials)

module.exports = router