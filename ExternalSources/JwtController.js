const jwt = require('jsonwebtoken');
require('dotenv').config();

const VerifyToken = (req, res, next) => {

  const authHeader = req.cookies.token;
  if (!authHeader) return res.status(401).json({ message: 'Unauthorized' });

  const token = authHeader;
  console.log(token)

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    console.log(req.user)
    next();
  } catch (err) {
    res.status(403).json({ message: 'Invalid token' });
  }
};

module.exports = VerifyToken;