const express = require("express");
const User = require("../models/user.model");

const router = express.Router();

router.get("/login", (req, res) => {
  res.render("login", { errorMessage: null, successMessage: null });
});

router.get("/register", (req, res) => {
  res.render("register", { errorMessage: null, successMessage: null });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({
    where: {
      email,
    },
  });

  if (user) {
    if (user.password == password) {
      res.render("login", {
        errorMessage: null,
        successMessage: `Welcome back, ${user.firstName}! You're now logged in. 🎉`,
      });
    } else {
      res.render("login", {
        errorMessage: "The password is incorrect!",
        successMessage: null,
      });
    }
  } else {
    res.render("login", {
      errorMessage: "User Not Found!!!",
      successMessage: null,
    });
  }
});

router.post("/register", async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  if (!firstName || !lastName || !email || !password) {
    return res.render("register", {
      errorMessage: "All fields are required!",
      successMessage: null,
    });
  }

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.render("register", {
        errorMessage: "This email is already registered!",
        successMessage: null,
      });
    }

    const user = await User.create({
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: password,
    });

    res.render("register", {
      errorMessage: null,
      successMessage: `Welcome, ${user.firstName}! Your account has been created successfully. 🎉`,
    });
  } catch (error) {
    res.render("register", {
      errorMessage: "An error occurred while registering. Please try again.",
      successMessage: null,
    });
  }
});

module.exports = router;
