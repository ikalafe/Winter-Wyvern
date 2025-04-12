// routes/admin.route.js
const express = require("express");
const router = express.Router();
const User = require("../models/user.model");
const Post = require("../models/post.model");
const bcrypt = require("bcrypt");
const { requireAdmin } = require("../middlewares/auth.middleware");

router.post("/promote/:userId", requireAdmin, async (req, res) => {
  console.log("Promote route accessed by user:", req.user); // دیباگ
  try {
    const user = await User.findByPk(req.params.userId);
    if (!user) {
      return res.redirect(
        "/home?error=" + encodeURIComponent("User not found.")
      );
    }
    user.role = "admin";
    await user.save();
    res.redirect(
      "/home?success=" +
        encodeURIComponent("User promoted to admin successfully.")
    );
  } catch (error) {
    console.log(error);
    res.redirect(
      "/home?error=" +
        encodeURIComponent("An error occurred while promoting user.")
    );
  }
});

router.post("/demote/:userId", requireAdmin, async (req, res) => {
  console.log("Demote route accessed by user:", req.user); // دیباگ
  try {
    const user = await User.findByPk(req.params.userId);
    if (!user) {
      return res.redirect(
        "/home?error=" + encodeURIComponent("User not found.")
      );
    }
    user.role = "user";
    await user.save();
    res.redirect(
      "/home?success=" +
        encodeURIComponent("User demoted to user successfully.")
    );
  } catch (error) {
    console.log(error);
    res.redirect(
      "/home?error=" +
        encodeURIComponent("An error occurred while demoting user.")
    );
  }
});

router.get("/edit-post/:postId", requireAdmin, async (req, res) => {
  console.log("Edit post route accessed by user:", req.user); // دیباگ
  try {
    const post = await Post.findByPk(req.params.postId);
    if (!post) {
      return res.redirect(
        "/home?error=" + encodeURIComponent("Post not found.")
      );
    }
    res.render("edit-post", { post, errorMessage: null });
  } catch (error) {
    console.log(error);
    res.redirect(
      "/home?error=" +
        encodeURIComponent("An error occurred while loading post.")
    );
  }
});

router.post("/edit-post/:postId", requireAdmin, async (req, res) => {
  console.log("Edit post POST route accessed by user:", req.user); // دیباگ
  try {
    const post = await Post.findByPk(req.params.postId);
    if (!post) {
      return res.redirect(
        "/home?error=" + encodeURIComponent("Post not found.")
      );
    }
    post.title = req.body.title;
    post.content = req.body.content;
    await post.save();
    res.redirect(
      "/home?success=" + encodeURIComponent("Post updated successfully.")
    );
  } catch (error) {
    console.log(error);
    res.redirect(
      "/home?error=" +
        encodeURIComponent("An error occurred while updating post.")
    );
  }
});

router.post("/delete-post/:postId", requireAdmin, async (req, res) => {
  console.log("Delete post route accessed by user:", req.user); // دیباگ
  try {
    const post = await Post.findByPk(req.params.postId);
    if (!post) {
      return res.redirect(
        "/home?error=" + encodeURIComponent("Post not found.")
      );
    }
    await post.destroy();
    res.redirect(
      "/home?success=" + encodeURIComponent("Post deleted successfully.")
    );
  } catch (error) {
    console.log(error);
    res.redirect(
      "/home?error=" +
        encodeURIComponent("An error occurred while deleting post.")
    );
  }
});

router.get("/create-user", requireAdmin, (req, res) => {
  console.log("Create user route accessed by user:", req.user); // دیباگ
  res.render("create-user", { errorMessage: null });
});

router.post("/create-user", requireAdmin, async (req, res) => {
  console.log("Create user POST route accessed by user:", req.user); // دیباگ
  try {
    const { firstName, lastName, email, username, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      firstName,
      lastName,
      email,
      username,
      password: hashedPassword,
      role: role || "user",
    });
    res.redirect(
      "/home?success=" + encodeURIComponent("User created successfully.")
    );
  } catch (error) {
    console.log(error);
    res.render("create-user", {
      errorMessage: "Error creating user: " + error.message,
    });
  }
});

module.exports = router;
