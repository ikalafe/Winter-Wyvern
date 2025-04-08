require("dotenv").config();

const express = require("express");
const path = require("path");

const sequelize = require("./database/sequelize-connect");
const authRoutes = require("./routes/auth.route");

const app = express();
const port = 2000;

app.use(express.urlencoded({ extended: true }));
app.use("/auth", authRoutes);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.get("/", async (req, res) => {
  res.send({ message: "Welcome" });
});

app.listen(port, async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
    console.log("Connection has been established successfully!");
    console.log(`app lintening on ${port}`);
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
});
