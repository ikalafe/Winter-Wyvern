const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const router = express.Router();

const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;
  console.log("Cookies:", req.cookies.token);
  const secretKey = process.env.JWT_SECRET_KEY;

  if (!token) {
    return res.render("profile", {
      errorMessage: "Please login to view your profile.",
      user: null,
    });
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    req.userId = decoded.id;
    next();
  } catch (error) {
    console.log(error);

    return res.render("profile", {
      errorMessage: "Invalid or expired token. Please login again.",
      user: null,
    });
  }
};

router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ where: { id: req.userId } });

    if (!user) {
      return res.render("profile", {
        errorMessage: "User not found.",
        user: null,
      });
    }

    res.render("profile", {
      errorMessage: null,
      user: user,
    });
  } catch (error) {
    res.render("profile", {
      errorMessage: "An error occurred while fetching your profile.",
      user: null,
    });
  }
});

module.exports = router;
