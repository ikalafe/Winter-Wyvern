const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const User = require("../models/user.model");
const jwt = require("jsonwebtoken");

const checkAuth = (req, res, next) => {
  const token = req.cookies.token;
  const secretKey = process.env.JWT_SECRET_KEY;

  if (!token) {
    return res.redirect("/auth/login");
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.redirect("/auth/login");
  }
};

router.get("/", checkAuth, async (req, res) => {
  try {
    const users = await User.findAll();
    const loggedInUser = await User.findOne({ where: { id: req.userId } });

    res.render("home", {
      users: users,
      errorMessage: null,
      searchQuery: "",
      user: loggedInUser,
    });
  } catch (error) {
    console.log(error);

    res.render("home", {
      users: null,
      errorMessage: "An error occurred while fetching users.",
      searchQuery: "",
      user: null,
    });
  }
});

router.get("/search", async (req, res) => {
  try {
    const searchQuery = req.query.search || "";
    console.log("Search Query:", searchQuery);
    const users = await User.findAll({
      where: {
        [Op.or]: [
          { firstName: { [Op.like]: `%${searchQuery}%` } },
          { lastName: { [Op.like]: `%${searchQuery}%` } },
          { email: { [Op.like]: `%${searchQuery}%` } },
        ],
      },
    });

    console.log("Found Users:", users);
    const loggedInUser = await User.findOne({ where: { id: req.userId } });

    res.render("home", {
      users: users,
      errorMessage: null,
      searchQuery: searchQuery,
      user: loggedInUser,
    });
  } catch (error) {
    console.log(error);
    res.render("home", {
      users: null,
      errorMessage: "An error occurred while searching users.",
      searchQuery: req.query.search || "",
      user: null,
    });
  }
});

module.exports = router;
