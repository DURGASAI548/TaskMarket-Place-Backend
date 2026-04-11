const express = require("express");
const router = express.Router();
const UserController = require("../../Controllers/WebControllers/UserController")
const VerifyToken = require('../../ExternalSources/JwtController');
const {upload} = require("../../ExternalSources/S3Controller")
// For Org adding
router.get('/get-normal-users', VerifyToken,UserController.GetNormalUsers)
router.post('/add-user',upload.single("profile"),VerifyToken,UserController.AddUser);
router.get('/get-user',VerifyToken,UserController.GetUsers);

module.exports = router;