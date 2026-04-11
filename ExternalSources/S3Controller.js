const { S3Client } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3-v3');
require('dotenv').config();

// S3 client from AWS SDK v3
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});
const generateOtp = () => Math.floor(100000000000 + Math.random() * 900000000000); // 12-digit

const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET_NAME,
    acl: 'public-read',
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {

      console.log(generateOtp());
      const filename = `products/${Date.now()}-${generateOtp()}-${file.originalname.replace(/[^a-zA-Z0-9.]/g, "_")}`;
      cb(null, filename);
    }
  })
});

module.exports = { upload };
