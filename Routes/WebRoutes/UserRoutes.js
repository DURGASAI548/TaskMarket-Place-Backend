const express = require("express");
const router = express.Router();
const UserController = require("../../Controllers/WebControllers/UserController")
const VerifyToken = require('../../ExternalSources/JwtController');
const {Upload} = require("../../ExternalSources/S3Controller")
// For Org adding
router.get('/get-normal-users', VerifyToken,UserController.GetNormalUsers)
router.post('/add-user',Upload.single("profile"),VerifyToken,UserController.AddUser);

module.exports = router;