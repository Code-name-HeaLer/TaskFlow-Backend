import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import session from "express-session";
import cookieParser from "cookie-parser";
import passport from "passport";
// Security middleware
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import xss from "xss-clean";
import mongoSanitize from "express-mongo-sanitize";

import todoRoutes from "./routes/todoRoutes.js";
import authRoutes from "./routes/authRoutes.js"; // <- add your auth route
import "./config/passport.js";

const app = express();
const PORT = process.env.PORT || 5000;

// ------------------
// Security Middleware
// ------------------
app.use(helmet()); // Set security headers
app.use(xss()); // Prevent XSS attacks

app.set("trust proxy", 1);

// ------------------
// Middleware
// ------------------

app.use(
  cors({
    origin: process.env.CLIENT_URL, // e.g., http://localhost:5173
    credentials: true, // allow cookies across origins
  })
);
app.use(express.json());
app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(cookieParser());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// ------------------
// Rate Limiting
// ------------------
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// ------------------
// Routes
// ------------------

app.use("/api/auth", authRoutes); // Google OAuth routes
app.use("/api/todos", todoRoutes); // Todo routes (should be after auth)

// ------------------
// DB Connection
// ------------------

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
  });
