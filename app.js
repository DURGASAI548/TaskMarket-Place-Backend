require("dotenv").config();

const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");

const app = express();

const AuthenticationRoutes = require('./Routes/WebRoutes/AuthenticationRoutes');

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");



// const allowedOrigins = [
//   "https://dev.nexstylo.com",
//   "https://admin.nexstylo.com",
//   "https://nexstylo.com",
//   "https://www.nexstylo.com",
// ];
// app.use(cors({
//   origin: function (origin, callback) {
//     if (!origin || allowedOrigins.includes(origin)) {
//       console.log(origin)
//       callback(null, true);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   credentials: true
// }));

const connectDB = require('./db');

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
connectDB();
app.use('/api', AuthenticationRoutes);
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
  });
});

app.use((req, res, next) => {
  next(createError(404, "Route not found"));
});

app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

module.exports = app;