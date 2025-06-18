// functions/controllers/adminAuthController.js
const AdminUserModel = require("../models/adminUserModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { defineSecret } = require("firebase-functions/params");

// Firebase Secret Manager
const JWT_SECRET = defineSecret("JWT_SECRET");

exports.generateToken = async (req, res) => {
  const jwtSecretValue = await JWT_SECRET.value();

  // Find admin user by username
  const adminUser = await AdminUserModel.findOne({
    username: req.body.username.toLowerCase(),
  });

  if (!adminUser) {
    return res.render("admin-login", {
      error: "The admin user does not exist",
    });
  }

  // Compare hashed passwords
  const passwordsMatch = await bcrypt.compare(
    req.body.password,
    adminUser.password
  );

  if (!passwordsMatch) {
    return res.render("admin-login", {
      error: "Incorrect Password",
    });
  }

  // Generate JWT token
  const token = jwt.sign({ userId: adminUser._id }, jwtSecretValue, {
    expiresIn: "1h",
  });

  // Set cookie
  res.cookie("authToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Safe to keep this check
    sameSite: "strict",
    maxAge: 3600000,
    path: "/",
  });

  res.render("admin-menu");
};

exports.authenticateUserToken = async (req, res, next) => {
  const token = req.cookies.authToken;

  if (!token) {
    return res.render("admin-login", {
      error: "Unauthorized, no token present",
    });
  }

  try {
    const jwtSecretValue = await JWT_SECRET.value();

    const decoded = jwt.verify(token, jwtSecretValue);
    const user = await AdminUserModel.findById(decoded.userId);

    if (!user) {
      return res.render("admin-login", {
        error: "Invalid Credentials",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.render("admin-login", {
      error: "Invalid token",
    });
  }
};
