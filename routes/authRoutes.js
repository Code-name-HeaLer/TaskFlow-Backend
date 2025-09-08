// --- START OF FILE authRoutes.js ---
import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import { authenticateJWT } from "../middleware/authMiddleware.js";
// import User from "../models/User.js"; // You might need this for the /me route if you fetch fresh data

const router = express.Router();

// Start Google OAuth
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    prompt: "select_account", // Force Google to show account selection screen
    accessType: "offline", // Request refresh token
  })
);

// Callback route
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth_failed`, // Redirect to frontend login on failure
    session: false, // Don't create a server-side session for this
  }),
  (req, res) => {
    // req.user is the Mongoose user object from passport's GoogleStrategy callback
    const payload = {
      id: req.user.id,
      name: req.user.displayName,
      email: req.user.email,
      picture: req.user.picture,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    // Set JWT in an HttpOnly cookie
    res.cookie("authToken", token, {
      httpOnly: true, // Crucial for security
      secure: process.env.NODE_ENV === "production", // Send only over HTTPS in production
      sameSite: "None", // Or "Strict" depending on your needs. "Lax" is a good default.
      maxAge: 24 * 60 * 60 * 1000, // 1 day, should match JWT expiry
      path: "/", // Cookie accessible for all paths
    });

    // Redirect to a frontend page that indicates success
    // No need to pass token in URL anymore
    res.redirect(`${process.env.CLIENT_URL}/oauth-success`);
  }
);

// Route to verify token (from cookie) and get user data
// The authenticateJWT middleware will handle extracting the token from the cookie if we modify it
router.get("/me", authenticateJWT, (req, res) => {
  // req.user is the decoded JWT payload from authenticateJWT
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  res.json(req.user);
});

// Logout route
router.post("/logout", (req, res) => {
  res.cookie("authToken", "", {
    // Clear the cookie
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    expires: new Date(0), // Set expiry to a past date
    path: "/",
  });
  res.status(200).json({ message: "Logged out successfully" });
});

export default router;
