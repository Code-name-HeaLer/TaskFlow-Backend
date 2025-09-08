// --- START OF FILE authMiddleware.js ---
import jwt from "jsonwebtoken";

export const authenticateJWT = (req, res, next) => {
  const token = req.cookies.authToken; // <--- Read from cookie

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Add decoded payload to request object
    next();
  } catch (err) {
    // If token is invalid or expired
    console.error("JWT verification error:", err.message);
    // Optionally clear the bad cookie
    res.cookie("authToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "None",
      expires: new Date(0),
      path: "/",
    });
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};
