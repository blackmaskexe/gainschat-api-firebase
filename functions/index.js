// functions/index.js
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const app = require("./app");

const DB_URI = defineSecret("DB_URI");
const JWT_SECRET = defineSecret("JWT_SECRET");
const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");

exports.api = onRequest({ secrets: [DB_URI, JWT_SECRET, GEMINI_API_KEY] }, app);
