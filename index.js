require("dotenv").config();

const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");

const sequelize = require("./database/sequelize-connect");
const authRoutes = require("./routes/auth.route");
const userRoutes = require("./routes/user.route");
const homeRoutes = require("./routes/home.route");

const app = express();
const port = 2000;

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// app.use(express.static(path.join(__dirname, "statics")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(express.static("public"));
app.set("view engine", "ejs");

app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/home", homeRoutes);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.get("/", async (req, res) => {
  res.redirect("/home");
});

app.listen(port, async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync().then(() => {
      console.log("All models were synchronized successfully.");
    });
    console.log("Connection has been established successfully!✅");
    console.log(`app lintening on ${port}`);
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
});
