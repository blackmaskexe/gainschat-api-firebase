// functions/app.js
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");

const DB_URI = defineSecret("DB_URI"); // matches your secret name

const adminRoutes = require("./routes/admin");
const userRoutes = require("./routes/users");

if (!admin.apps.length) {
  admin.initializeApp();
}

const app = express();

app.set("view engine", "ejs");
app.set("views", "views");

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(adminRoutes);
app.use(userRoutes);

app.get("/", (req, res) => {
  res.json("API up and running");
});

async function connectDb() {
  if (mongoose.connection.readyState === 1) return;
  const uri = await DB_URI.value();
  return mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}

app.use(async (req, res, next) => {
  try {
    await connectDb();
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = app;
