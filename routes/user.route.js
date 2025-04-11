const express = require("express");
const User = require("../models/user.model");
const Post = require("../models/post.model");
const { requireAuth } = require("../middlewares/auth.middleware");
const multer = require("multer");
const path = require("path");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random * 1e9);
    cb(null, "file-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = new RegExp("jpeg|jpg|png", "i");
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG and PNG Images are allowed!"));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single("profilePicture");

const uploadPostCover = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single("file");

router.get("/profile", requireAuth, async (req, res) => {
  try {
    const user = await User.findOne({ where: { id: req.userId } });

    if (!user) {
      return res.render("profile", {
        errorMessage: "User not found.",
        successMessage: null,
        user: null,
        posts: [],
      });
    }

    const posts = await user.getPosts();

    res.render("profile", {
      errorMessage: null,
      successMessage: req.query.success || null,
      user: user,
      posts: posts,
    });
  } catch (error) {
    res.render("profile", {
      errorMessage: "An error occurred while fetching your profile.",
      successMessage: null,
      user: null,
      posts: [],
    });
  }
});

router.post("/profile", requireAuth, upload, async (req, res) => {
  const { username, firstName, lastName, email, bio } = req.body;

  if (!username || !firstName || !lastName || !email) {
    return res.render("profile", {
      errorMessage: "All fields except bio are required!",
      successMessage: null,
      user: await User.findOne({ where: { id: req.userId } }),
      posts: [],
    });
  }

  try {
    const user = await User.findOne({ where: { id: req.userId } });
    if (!user) {
      return res.render("profile", {
        errorMessage: "User not found.",
        successMessage: null,
        user: null,
        posts: [],
      });
    }

    if (email !== user.email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        return res.render("profile", {
          errorMessage: "This email is already registered!",
          successMessage: null,
          user: user,
          posts: [],
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
          posts: [],
        });
      }
    }

    if (req.file) {
      user.profilePicture = `/uploads/${req.file.filename}`;
    }

    user.username = username;
    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email;
    user.bio = bio || null; // اگه bio خالی باشه، null ذخیره می‌شه
    await user.save();

    const posts = await user.getPosts();

    res.render("profile", {
      errorMessage: null,
      successMessage: "Profile updated successfully! 🎉",
      user: user,
      posts: posts,
    });
  } catch (error) {
    console.log("Error updating profile:", error);
    res.render("profile", {
      errorMessage: "An error occurred while updating your profile.",
      successMessage: null,
      user: await User.findOne({ where: { id: req.userId } }),
      posts: [],
    });
  }
});

router.post("/change-password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return res.render("profile", {
      errorMessage: "All password fields are required!",
      successMessage: null,
      user: await User.findOne({ where: { id: req.userId } }),
      posts: [],
    });
  }

  try {
    const user = await User.findOne({ where: { id: req.userId } });
    if (!user) {
      return res.render("profile", {
        errorMessage: "User not found.",
        successMessage: null,
        user: null,
        posts: [],
      });
    }

    if (user.password !== currentPassword) {
      return res.render("profile", {
        errorMessage: "Current password is incorrect!",
        successMessage: null,
        user: user,
        posts: [],
      });
    }

    if (newPassword !== confirmNewPassword) {
      return res.render("profile", {
        errorMessage: "New password and confirmation do not match!",
        successMessage: null,
        user: user,
        posts: [],
      });
    }

    user.password = newPassword;
    await user.save();

    res.render("profile", {
      errorMessage: null,
      successMessage: "Password changed successfully! 🎉",
      user: user,
      posts: [],
    });
  } catch (error) {
    console.log("Error changing password:", error);
    res.render("profile", {
      errorMessage: "An error occurred while changing your password.",
      successMessage: null,
      user: await User.findOne({ where: { id: req.userId } }),
      posts: [],
    });
  }
});

router.post("/create-post", requireAuth, uploadPostCover, async (req, res) => {
  console.log({ body: req.body });

  if (!req.body) {
    return res.render("profile", {
      errorMessage: "Request body is missing!",
      successMessage: null,
      user: await User.findOne({ where: { id: req.userId } }),
      posts: [],
    });
  }

  const { title, content } = req.body;

  if (!title || !content) {
    return res.render("profile", {
      errorMessage: "Title and content are required!",
      successMessage: null,
      user: await User.findOne({ where: { id: req.userId } }),
      posts: [],
    });
  }

  try {
    const user = await User.findOne({ where: { id: req.userId } });

    if (!user) {
      return res.render("profile", {
        errorMessage: "User not found.",
        successMessage: null,
        user: null,
        posts: [],
      });
    }

    const postData = {
      title,
      content,
      userId: req.userId,
    };

    if (req.file) {
      postData.cover = `/uploads/${req.file.filename}`;
    }

    await Post.create(postData);
    const posts = await user.getPosts();

    res.render("profile", {
      errorMessage: null,
      successMessage: "Post created successfully! 🎉",
      user: user,
      posts: posts,
    });
  } catch (error) {
    console.log("Error creating post:", error);
    res.render("profile", {
      errorMessage: "An error occurred while creating your post.",
      successMessage: null,
      user: await User.findOne({ where: { id: req.userId } }),
      posts: [],
    });
  }
});

router.post(
  "/edit-post/:postId",
  requireAuth,
  uploadPostCover,
  async (req, res) => {
    const { postId } = req.params;
    const { title, content } = req.body;

    if (!title || !content) {
      return res.render("profile", {
        errorMessage: "Title and content are required!",
        successMessage: null,
        user: await User.findOne({ where: { id: req.userId } }),
        posts: [],
      });
    }

    try {
      const user = await User.findOne({ where: { id: req.userId } });
      if (!user) {
        return res.render("profile", {
          errorMessage: "User not found.",
          successMessage: null,
          user: null,
          posts: [],
        });
      }

      const post = await Post.findOne({
        where: { id: postId, userId: req.userId },
      });
      if (!post) {
        return res.render("profile", {
          errorMessage:
            "Post not found or you don't have permission to edit it.",
          successMessage: null,
          user: user,
          posts: [],
        });
      }

      post.title = title;
      post.content = content;

      if (req.file) {
        post.cover = `/uploads/${req.file.filename}`;
      }

      await post.save();
      const posts = await user.getPosts();

      res.render("profile", {
        errorMessage: null,
        successMessage: "Post updated successfully! 🎉",
        user: user,
        posts: posts,
      });
    } catch (error) {
      console.log("Error editing post:", error);
      res.render("profile", {
        errorMessage: "An error occurred while editing your post.",
        successMessage: null,
        user: await User.findOne({ where: { id: req.userId } }),
        posts: [],
      });
    }
  }
);

router.post("/delete-post/:postId", requireAuth, async (req, res) => {
  const { postId } = req.params;

  try {
    const user = await User.findOne({ where: { id: req.userId } });
    if (!user) {
      return res.render("profile", {
        errorMessage: "User not found.",
        successMessage: null,
        user: null,
        posts: [],
      });
    }

    const post = await Post.findOne({
      where: { id: postId, userId: req.userId },
    });
    if (!post) {
      return res.render("profile", {
        errorMessage:
          "Post not found or you don't have permission to delete it.",
        successMessage: null,
        user: user,
        posts: [],
      });
    }

    await post.destroy();
    const posts = await user.getPosts();

    res.render("profile", {
      errorMessage: null,
      successMessage: "Post deleted successfully! 🎉",
      user: user,
      posts: posts,
    });
  } catch (error) {
    console.log("Error deleting post:", error);
    res.render("profile", {
      errorMessage: "An error occurred while deleting your post.",
      successMessage: null,
      user: await User.findOne({ where: { id: req.userId } }),
      posts: [],
    });
  }
});

module.exports = router;
