require("dotenv").config();

const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");

const app = express();

const AuthenticationRoutes = require('./Routes/WebRoutes/AuthenticationRoutes');
const UserRoutes = require("./Routes/WebRoutes/UserRoutes")
const OrganizationRoutes = require("./Routes/WebRoutes/OrganizationRoutes")
const BranchRoutes = require("./Routes/WebRoutes/BranchRoutes")

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

const connectDB = require('./db');

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
connectDB();

const allowedOrigins = [
  "https://task-market-place-frontend-ashen.vercel.app",
  "http://localhost:3000"
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));


app.use('/api', AuthenticationRoutes);
app.use('/api', UserRoutes);
app.use('/api', OrganizationRoutes);
app.use('/api', BranchRoutes);
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