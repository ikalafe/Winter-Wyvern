// middlewares/auth.middleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const requireAuth = async (req, res, next) => {
  const token = req.cookies.token;
  console.log("Cookies:", req.cookies.token);
  console.log("Request path:", req.path); // دیباگ مسیر

  if (!token) {
    console.log("No token found, redirecting to login");
    return res.redirect(
      "/auth/login?error=" +
        encodeURIComponent("Please login to access this page.")
    );
  }

  try {
    const secretKey = process.env.JWT_SECRET_KEY;
    if (!secretKey) {
      throw new Error(
        "JWT_SECRET_KEY is not defined in environment variables."
      );
    }

    const decoded = jwt.verify(token, secretKey);
    console.log("Decoded token:", decoded);

    if (!decoded.id) {
      throw new Error("Invalid token payload");
    }

    const user = await User.findOne({ where: { id: decoded.id } });
    console.log("Found user:", user);

    if (!user) {
      throw new Error("User not found");
    }

    req.userId = decoded.id;
    req.user = user;
    console.log("req.user set to:", req.user);
    console.log("req.user.role:", req.user.role); // دیباگ نقش
    next();
  } catch (error) {
    console.log("Token verification error:", error.message);
    res.clearCookie("token");
    return res.redirect(
      "/auth/login?error=" + encodeURIComponent("Invalid or expired token.")
    );
  }
};

const requireAdmin = (req, res, next) => {
  console.log("req.user in requireAdmin:", req.user);
  console.log("req.user.role:", req.user ? req.user.role : "undefined");

  if (req.user && req.user.role.toString().trim() === "admin") {
    next();
  } else {
    return res.redirect(
      "/home?error=" + encodeURIComponent("Access denied. Admins only.")
    );
  }
};

module.exports = {
  requireAuth,
  requireAdmin,
};
