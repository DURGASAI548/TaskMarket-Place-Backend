const express = require("express");
const router = express.Router();
const TaskController = require("../../Controllers/WebControllers/TaskController")
const VerifyToken = require('../../ExternalSources/JwtController');
const {upload} = require("../../ExternalSources/S3Controller");
const multer = require("multer");
const Upload = multer({ dest: "uploads/" });

router.post("/add-task",upload.single("taskDocument"),VerifyToken,TaskController.AddTask)
router.get("/get-task-credentials",VerifyToken,TaskController.GenerateTaskCredentials)
router.get("/get-tasks",VerifyToken,TaskController.GetAllTasks)
router.get("/get-task-by-id/:id",VerifyToken,TaskController.GetTaskById)
router.get("/get-task-by-for-edit-id/:id",VerifyToken,TaskController.GetTaskByIdForEditTask)
router.put('/edit-task/:id',upload.single("taskDocument"),VerifyToken,TaskController.EditTask);
router.delete("/delete-task/:id", VerifyToken, TaskController.DeleteTask);
module.exports = router