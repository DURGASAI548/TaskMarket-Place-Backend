const express = require("express");
const router = express.Router();
const UserController = require("../../Controllers/WebControllers/UserController")
const VerifyToken = require('../../ExternalSources/JwtController');

// For Org adding
router.get('/get-normal-users', VerifyToken,UserController.GetNormalUsers)
// For Branch adding

module.exports = router;