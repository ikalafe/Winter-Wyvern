const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const User = require("../models/user.model");
const { requireAuth } = require("../middlewares/auth.middleware");

router.get("/", requireAuth, async (req, res) => {
  try {
    const users = await User.findAll();
    const loggedInUser = await User.findOne({ where: { id: req.userId } });

    const successMessage = req.query.success || null;
    const errorMessage = req.query.error || null;

    res.render("home", {
      users: users,
      errorMessage: errorMessage,
      successMessage: successMessage,
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

router.get("/search", requireAuth, async (req, res) => {
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

    const successMessage = req.query.success || null;
    const errorMessage = req.query.error || null;

    res.render("home", {
      users: users,
      errorMessage: errorMessage,
      successMessage: successMessage,
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
