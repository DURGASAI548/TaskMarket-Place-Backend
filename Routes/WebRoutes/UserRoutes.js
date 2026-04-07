const express = require("express");
const router = express.Router();
const UserController = require("../../Controllers/WebControllers/UserController")
const VerifyToken = require('../../ExternalSources/JwtController');


router.get('/get-normal-users', VerifyToken,UserController.GetNormalUsers)

module.exports = router;