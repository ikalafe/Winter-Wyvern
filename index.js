require("dotenv").config();

const express = require("express");
const sequelize = require("./database/sequelize-connect");
const User = require("./models/user.model");
const app = express();
const port = 2000;

app.use(express.json());

app.get("/", async (req, res) => {
  const users = await User.findAll();
  res.send(users);
});

app.post("/login", async (req, res) => {
  const { password, email } = req.body;

  console.log({ email });

  const user = await User.findOne({
    where: {
      email,
    },
  });

  console.log({ user });

  if (user) {
    if (user.password == password) {
      res.send("Hi to pannel");
    } else {
      res.send("The password is incorrect!");
    }
  } else {
    res.send("User Not Found!!!");
  }
});

app.get("/create-user", async (req, res) => {
  const user = await User.create({
    firstName: "Daniyal",
    lastName: "Dehghan",
    password: "danikalafe",
    email: "imkalafe@gmail.com",
  });
  res.send({ user });
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
