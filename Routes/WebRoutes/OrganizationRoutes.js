const express = require("express");
const router = express.Router();
const OrganizationController = require("../../Controllers/WebControllers/OrganizationController")
const VerifyToken = require('../../ExternalSource/Jwtcontroller');


router.post('/add-organization', VerifyToken, OrganizationController.AddOrganization)

module.exports = router;