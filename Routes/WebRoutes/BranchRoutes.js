const express = require("express");
const router = express.Router();
const BranchController = require("../../Controllers/WebControllers/BranchController")
const VerifyToken = require('../../ExternalSources/JwtController');

router.post('/add-branch', VerifyToken, BranchController.AddBranch)


module.exports = router;