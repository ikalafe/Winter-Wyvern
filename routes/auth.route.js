const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Mailgun = require("mailgun.js");
const FormData = require("form-data");

const User = require("../models/user.model");
const ResetPassword = require("../models/reset-password.model");

const router = express.Router();

function generateResetToken() {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(32, (err, buffer) => {
      if (err) {
        reject(err);
      } else {
        const token = buffer.toString("hex");
        resolve(token);
      }
    });
  });
}

router.get("/login", (req, res) => {
  const errorMessage = req.query.error || null;
  res.render("login", {
    errorMessage: errorMessage,
    successMessage: null,
    user: null,
  });
});

router.get("/register", (req, res) => {
  res.render("register", {
    errorMessage: null,
    successMessage: null,
    user: null,
  });
});

router.get("/forget-password", (req, res) => {
  res.render("forget-password", {
    errorMessage: null,
    successMessage: null,
    user: null,
  });
});

router.get("/forget-password/:token", (req, res) => {
  res.render("password-change", {
    errorMessage: null,
    successMessage: null,
    user: null,
    token: req.params.token,
  });
});

router.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect(
    "/auth/login?success=" +
      encodeURIComponent("You have been logged out successfully.")
  );
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const secretKey = process.env.JWT_SECRET_KEY;
  const user = await User.findOne({
    where: {
      email,
    },
  });

  if (user) {
    if (user.password == password) {
      const payload = {
        id: user.id,
        email: user.email,
      };

      const token = jwt.sign(payload, secretKey, {
        expiresIn: "3h",
      });

      res.cookie("token", token, {
        maxAge: 3 * 60 * 60 * 1 * 1000,
        path: "/",
      });

      res.redirect(
        "/home?success=" +
          encodeURIComponent(
            "Login successful! Welcome back, " + user.firstName + "!"
          )
      );
    } else {
      res.render("login", {
        errorMessage: "The password is incorrect!",
        successMessage: null,
        user: null,
      });
    }
  } else {
    res.render("login", {
      errorMessage: "User Not Found!!!",
      successMessage: null,
      user: null,
    });
  }
});

router.post("/register", async (req, res) => {
  const { firstName, lastName, email, password, username } = req.body;

  if (!firstName || !lastName || !email || !password || !username) {
    return res.render("register", {
      errorMessage: "All fields are required!",
      successMessage: null,
      user: null,
    });
  }

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.render("register", {
        errorMessage: "This email is already registered!",
        successMessage: null,
        user: null,
      });
    }

    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      return res.render("register", {
        errorMessage: "This Username is already registered!",
        successMessage: null,
        user: null,
      });
    }

    const user = await User.create({
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: password,
      username: username,
    });

    res.redirect(
      "/auth/login?success=" +
        encodeURIComponent("Registration successful! Please login to continue.")
    );
  } catch (error) {
    console.log("Error during registration:", error); // لاگ کردن خطا برای دیباگ
    res.render("register", {
      errorMessage: "An error occurred while registering. Please try again.",
      successMessage: null,
      user: null,
    });
  }
});

router.post("/forget-password", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.render("forget-password", {
      errorMessage: "Please enter your email!",
      successMessage: null,
      user: null,
    });
  }

  try {
    const user = await User.findOne({
      where: {
        email,
      },
    });

    if (!user) {
      return res.render("forget-password", {
        errorMessage: "No user found with this email!",
        successMessage: null,
        user: null,
      });
    }

    const token = await generateResetToken();
    console.log("Generated Token:", token);

    await ResetPassword.create({
      email,
      token,
    });

    return res.render("forget-password", {
      errorMessage: null,
      successMessage: "A password reset link has been sent to your email! 📧",
      user: null,
    });
  } catch (error) {
    console.log("Error:", error);
    return res.render("forget-password", {
      errorMessage: "An error occurred. Please try again.",
      successMessage: null,
      user: null,
    });
  }
});

router.post("/forget-password/:token", async (req, res) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  // چک کردن اینکه فیلدها پر شدن
  if (!password || !confirmPassword) {
    return res.render("password-change", {
      errorMessage: "Please fill in all fields!",
      successMessage: null,
      token,
      user: null,
    });
  }

  // چک کردن تطابق رمزها
  if (password !== confirmPassword) {
    return res.render("password-change", {
      errorMessage: "Passwords do not match!",
      successMessage: null,
      token,
      user: null,
    });
  }

  try {
    // پیدا کردن توکن
    const resetPassword = await ResetPassword.findOne({
      where: { token },
    });

    if (!resetPassword) {
      return res.render("password-change", {
        errorMessage: "Invalid token. Please request a new link.",
        successMessage: null,
        token,
        user: null,
      });
    }

    // پیدا کردن کاربر
    const user = await User.findOne({
      where: { email: resetPassword.email },
    });

    if (!user) {
      await resetPassword.destroy();
      return res.render("password-change", {
        errorMessage: "User not found. Please request a new link.",
        successMessage: null,
        token,
        user: null,
      });
    }
    user.password = password;
    await user.save();
    await resetPassword.destroy();

    res.render("password-change", {
      errorMessage: null,
      successMessage:
        "Password changed successfully! You will be redirected to login.",
      token,
      user: null,
    });
  } catch (error) {
    res.render("password-change", {
      errorMessage: "An error occurred. Please try again.",
      successMessage: null,
      token,
      user: null,
    });
  }
});
module.exports = router;
