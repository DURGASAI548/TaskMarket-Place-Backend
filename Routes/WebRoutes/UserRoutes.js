const express = require("express");
const router = express.Router();
const UserController = require("../../Controllers/WebControllers/UserController")
const VerifyToken = require('../../ExternalSources/JwtController');
const {upload} = require("../../ExternalSources/S3Controller")
const multer = require("multer");
const Upload = multer({ dest: "uploads/" });
// For Org adding
router.get('/get-normal-users', VerifyToken,UserController.GetNormalUsers)
router.get('/get-normal-users-for-branch/:branchId', VerifyToken,UserController.GetNormalUsersforBranch)
router.post('/add-user',upload.single("profile"),VerifyToken,UserController.AddUser);
router.post('/get-user-by-id/:userId',VerifyToken,UserController.GetUserById);
router.post('/edit-user/:userId',upload.single("profile"),VerifyToken,UserController.EditUser);
router.get('/get-users',VerifyToken,UserController.GetUsers);
router.post(
  "/add-users-bulk-upload",
  VerifyToken,
  Upload.single("file"),
  UserController.BulkUploadUsers
);
router.delete('/delete-user/:userId',VerifyToken,UserController.DeleteUser);


module.exports = router;