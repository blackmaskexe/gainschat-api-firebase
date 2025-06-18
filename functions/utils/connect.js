// functions/utils/connect.js
const mongoose = require("mongoose");
const { defineSecret } = require("firebase-functions/params");

const DB_URI = defineSecret("DB_URI");

let isConnected = false;

async function connectDb() {
  if (isConnected || mongoose.connection.readyState === 1) return;

  const uri = await DB_URI.value();

  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = true;
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    throw err;
  }
}

module.exports = connectDb;
