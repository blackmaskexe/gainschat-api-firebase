// functions/index.js
const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");

const { defineSecret } = require("firebase-functions/params");
const app = require("./app");
const { cleanupExpiredRateLimits } = require("./utils/cleanupRateLimits");

const DB_URI = defineSecret("DB_URI");
const JWT_SECRET = defineSecret("JWT_SECRET");
const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");

exports.api = onRequest({ secrets: [DB_URI, JWT_SECRET, GEMINI_API_KEY] }, app);

exports.cleanupRateLimits = onSchedule(
  {
    schedule: "0 2 * * *", // Every day at 2 AM UTC
    timeZone: "UTC",
  },
  async (event) => {
    console.log("Starting scheduled rate limit cleanup...");
    try {
      await cleanupExpiredRateLimits();
      console.log("Rate limit cleanup completed successfully");
    } catch (error) {
      console.error("Rate limit cleanup failed:", error);
    }
  }
);
