const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const { requireAuth } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/profile", requireAuth, async (req, res) => {
  try {
    const user = await User.findOne({ where: { id: req.userId } });

    if (!user) {
      return res.render("profile", {
        errorMessage: "User not found.",
        successMessage: null,
        user: null,
      });
    }

    res.render("profile", {
      errorMessage: null,
      successMessage: null,
      user: user,
    });
  } catch (error) {
    res.render("profile", {
      errorMessage: "An error occurred while fetching your profile.",
      successMessage: null,
      user: null,
    });
  }
});

router.post("/profile", requireAuth, async (req, res) => {
  const { username, firstName, lastName, email, bio } = req.body;

  if (!username || !firstName || !lastName || !email) {
    return res.render("profile", {
      errorMessage: "All fields except bio are required!",
      successMessage: null,
      user: await User.findOne({ where: { id: req.userId } }),
    });
  }

  try {
    const user = await User.findOne({ where: { id: req.userId } });
    if (!user) {
      return res.render("profile", {
        errorMessage: "User not found.",
        successMessage: null,
        user: null,
      });
    }

    if (email !== user.email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        return res.render("profile", {
          errorMessage: "This email is already registered!",
          successMessage: null,
          user: user,
        });
      }
    }

    if (username !== user.username) {
      const existingUsername = await User.findOne({ where: { username } });
      if (existingUsername) {
        return res.render("profile", {
          errorMessage: "This username is already taken!",
          successMessage: null,
          user: user,
        });
      }
    }

    user.username = username;
    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email;
    user.bio = bio || null; // اگه bio خالی باشه، null ذخیره می‌شه
    await user.save();

    res.render("profile", {
      errorMessage: null,
      successMessage: "Profile updated successfully! 🎉",
      user: user,
    });
  } catch (error) {
    console.log("Error updating profile:", error);
    res.render("profile", {
      errorMessage: "An error occurred while updating your profile.",
      successMessage: null,
      user: await User.findOne({ where: { id: req.userId } }),
    });
  }
});

module.exports = router;
