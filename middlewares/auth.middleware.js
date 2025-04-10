const jwt = require("jsonwebtoken");

const requireAuth = (req, res, next) => {
  const token = req.cookies.token;
  console.log("Cookies:", req.cookies.token);
  const secretKey = process.env.JWT_SECRET_KEY;
  
  if (!token) {
    return res.redirect(
      "/auth/login?error=" +
        encodeURIComponent("Please login to access this page.")
    );
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    if (!decoded.id) {
      throw new Error("Invalid token payload");
    }
    req.userId = decoded.id;
    next();
  } catch (error) {
    console.log("Token verification error:", error);
    res.clearCookie("token"); // پاک کردن توکن نامعتبر
    return res.redirect("/auth/login");
  }
};

module.exports = {
  requireAuth,
};
