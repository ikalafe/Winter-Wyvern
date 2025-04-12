const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const User = require("../models/user.model");
const Post = require("../models/post.model");
const { requireAuth } = require("../middlewares/auth.middleware");

router.get("/", requireAuth, async (req, res) => {
  try {
    if (!req.userId) {
      throw new Error("User ID is not defined in request.");
    }

    const loggedInUser = req.user;
    const isAdmin = loggedInUser.role == "admin";

    const posts = await Post.findAll({
      limit: 10,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: User,
          attributes: ["firstName", "lastName"],
        },
      ],
    });

    const summarizeContent = (content, wordList = 10) => {
      const words = content.split(/\s+/);
      if (words.length <= wordList) return content;
      return words.slice(0, wordList).join(" ") + "...";
    };

    const summarizedPosts = posts.map((post) => ({
      ...post.toJSON(),
      summarizedContent: summarizeContent(post.content, 10),
    }));

    let users = [];
    if (isAdmin) {
      users = await User.findAll();
    }

    const successMessage = req.query.success || null;
    const errorMessage = req.query.error || null;

    res.render("home", {
      posts: summarizedPosts,
      users: users,
      isAdmin: isAdmin,
      user: loggedInUser,
      errorMessage: errorMessage,
      successMessage: successMessage,
      searchQuery: "",
    });
  } catch (error) {
    console.log(error);

    res.render("home", {
      posts: [],
      users: [],
      isAdmin: false,
      user: null,
      errorMessage: "An error occurred while fetching data.",
      successMessage: null,
      searchQuery: "",
    });
  }
});

router.get("/search", requireAuth, async (req, res) => {
  try {
    if (!req.userId) {
      throw new Error("User ID is not defined in request.");
    }

    const loggedInUser = req.user;
    const isAdmin = loggedInUser.role == "admin";

    const searchQuery = req.query.search || "";
    console.log("Search Query:", searchQuery);

    let users = [];
    if (isAdmin) {
      users = await User.findAll({
        where: {
          [Op.or]: [
            { firstName: { [Op.like]: `%${searchQuery}%` } },
            { lastName: { [Op.like]: `%${searchQuery}%` } },
            { email: { [Op.like]: `%${searchQuery}%` } },
          ],
        },
      });
    }

    const posts = await Post.findAll({
      limit: 10,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: User,
          attributes: ["firstName", "lastName"],
        },
      ],
    });

    const summarizeContent = (content, wordLimit = 10) => {
      const words = content.split(/\s+/);
      if (words.length <= wordLimit) return content;
      return words.slice(0, wordLimit).join(" ") + "...";
    };

    const summarizedPosts = posts.map((post) => ({
      ...post.toJSON(),
      summarizedContent: summarizeContent(post.content, 10),
    }));

    const successMessage = req.query.success || null;
    const errorMessage = req.query.error || null;

    res.render("home", {
      posts: summarizedPosts,
      users: users,
      isAdmin: isAdmin,
      user: loggedInUser,
      errorMessage: errorMessage,
      successMessage: successMessage,
      searchQuery: searchQuery,
    });
  } catch (error) {
    console.log("Error in /home/search route:", error.message);
    res.render("home", {
      posts: [],
      users: [],
      isAdmin: false,
      user: null,
      errorMessage: "An error occurred while searching: " + error.message,
      successMessage: null,
      searchQuery: req.query.search || "",
    });
  }
});

module.exports = router;
