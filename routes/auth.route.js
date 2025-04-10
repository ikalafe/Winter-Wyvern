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
  res.render("login", { errorMessage: null, successMessage: null, user: null });
});

router.get("/register", (req, res) => {
  res.render("register", { errorMessage: null, successMessage: null });
});

router.get("/forget-password", (req, res) => {
  res.render("forget-password", { errorMessage: null, successMessage: null });
});

router.get("/forget-password/:token", (req, res) => {
  res.render("password-change", {
    errorMessage: null,
    successMessage: null,
    token: req.params.token,
  });
});

router.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/auth/login");
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

      res.redirect("/home");
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

    // res.render("register", {
    //   errorMessage: null,
    //   successMessage: `Welcome, ${user.firstName}! Your account has been created successfully. 🎉`,
    // });
    res.redirect("/auth/login");
  } catch (error) {
    res.render("register", {
      errorMessage: "An error occurred while registering. Please try again.",
      successMessage: null,
    });
  }
});

router.post("/forget-password", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.render("forget-password", {
      errorMessage: "Please enter your email!",
      successMessage: null,
    });
  }

  const user = await User.findOne({
    where: {
      email,
    },
  });

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
      });
    }

    // ساخت توکن ریست رمز
    const token = await generateResetToken();
    console.log("Generated Token:", token);

    // ذخیره توکن در دیتابیس
    await ResetPassword.create({
      email,
      token,
    });

    // نمایش پیام موفقیت
    return res.render("forget-password", {
      errorMessage: null,
      successMessage: "A password reset link has been sent to your email! 📧",
    });
  } catch (error) {
    console.log("Error:", error);
    return res.render("forget-password", {
      errorMessage: "An error occurred. Please try again.",
      successMessage: null,
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
    });
  }

  // چک کردن تطابق رمزها
  if (password !== confirmPassword) {
    return res.render("password-change", {
      errorMessage: "Passwords do not match!",
      successMessage: null,
      token,
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
      });
    }

    // تغییر رمز
    user.password = password;
    await user.save();

    // حذف توکن بعد از استفاده
    await resetPassword.destroy();

    // نمایش پیام موفقیت
    res.render("password-change", {
      errorMessage: null,
      successMessage:
        "Password changed successfully! You will be redirected to login.",
      token,
    });
  } catch (error) {
    res.render("password-change", {
      errorMessage: "An error occurred. Please try again.",
      successMessage: null,
      token,
    });
  }
});
module.exports = router;
