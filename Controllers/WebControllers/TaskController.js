const mongoose = require('mongoose')
const UserSchema = require("../../Models/user")
const OrganizationSchema = require("../../Models/organization")
const BranchSchema = require("../../Models/branch")
const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');