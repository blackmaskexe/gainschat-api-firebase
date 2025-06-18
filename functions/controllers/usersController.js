const userLogsModel = require("../models/userLogsModel");
const UsersModel = require("../models/usersModel");
const bcrypt = require("bcrypt");
const mongodb = require("mongodb");
const connectDb = require("../utils/connect");

exports.postAddUser = async (req, res, next) => {
  try {
    await connectDb();

    console.log("not my boss, ", req.body);

    const foundUser = await UsersModel.findOne({
      email: req.body.email.toLowerCase(),
    });

    if (foundUser) {
      res.send({
        success: false,
        message: "This email/username already exists in the database",
      });
    } else {
      bcrypt.hash(req.body.password, 12, async (err, hash) => {
        if (err) {
          console.error("Hashing error:", err);
          return res
            .status(500)
            .send({ success: false, message: "Hashing failed" });
        }

        const userData = {
          name: req.body.name,
          email: req.body.email.toLowerCase(),
          password: hash,
        };

        try {
          await new UsersModel(userData).save();
          res.send({ success: true });
        } catch (err) {
          console.error("User save error:", err);
          res
            .status(500)
            .send({ success: false, message: "Failed to save user" });
        }
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({ success: false, message: "DB connection error" });
  }
};

exports.postAuthenticateUser = async (req, res, next) => {
  try {
    await connectDb();

    const foundUser = await UsersModel.findOne({
      email: req.body.email.toLowerCase(),
    });

    if (!foundUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const passwordsMatch = await bcrypt.compare(
      req.body.password,
      foundUser.password
    );

    if (passwordsMatch) {
      return res.status(200).json({
        success: true,
        isAuthenticated: true,
        userId: foundUser._id,
        name: foundUser.name,
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Incorrect Password",
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Server error: " + err,
    });
  }
};

exports.postDeleteUser = async (req, res, next) => {
  try {
    await connectDb();

    const userId = req.body.userId;
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is required" });
    }

    await UsersModel.findByIdAndDelete(userId);
    console.log(
      "The user's account was deleted successfully. Now initializing deleting all workout logs"
    );

    await userLogsModel.deleteMany({
      userId: new mongodb.ObjectId(userId),
    });

    res.status(204).json({
      success: true,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to delete user and logs",
    });
  }
};
