const { DataTypes } = require("sequelize");
const sequelize = require("../database/sequelize-connect");
const Post = require("./post.model");

const User = sequelize.define("User", {
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    require: true,
    set(value) {
      this.setDataValue("email", value ? value.toLowerCase() : "");
    },
    validate: {
      isEmail: true,
    },
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    require: true,
    set(value) {
      this.setDataValue("username", value ? value.toLowerCase() : "");
    },
  },
  bio: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  profilePicture: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  role: {
    type: DataTypes.ENUM,
    values: ["user", "admin"],
    defaultValue: "user",
  },
});

User.hasMany(Post, { foreignKey: "userId" });
Post.belongsTo(User, { foreignKey: "userId" });

module.exports = User;
