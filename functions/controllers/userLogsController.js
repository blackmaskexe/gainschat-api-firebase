const UserLogsModel = require("../models/userLogsModel");
const ExercisesModel = require("../models/exercisesModel");
const mongodb = require("mongodb");
const genAIPrompt = require("../utils/genAIPrompt");
const { GoogleGenAI } = require("@google/genai");
const { defineSecret } = require("firebase-functions/params");
const connectDb = require("../utils/connect");

// Firebase Secret
const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");

let ai = null;
async function ensureAI() {
  if (!ai) {
    const key = await GEMINI_API_KEY.value();
    ai = new GoogleGenAI({ apiKey: key });
  }
}

function findUniqueExerciseLogs(result) {
  return result.filter((logItem, index) => {
    return !result
      .slice(0, index)
      .some((prev) =>
        prev.exercise.exerciseId.equals(logItem.exercise.exerciseId)
      );
  });
}

async function getExerciseNameFromId(exerciseId) {
  await connectDb();
  return ExercisesModel.findById(exerciseId)
    .then((exerciseEntry) =>
      exerciseEntry ? exerciseEntry.name : "Null Exercise"
    )
    .catch((err) => console.log(err));
}

async function interpretUserLog(userMessage, oldChatHistory) {
  await connectDb();
  await ensureAI();

  const allExercises = await ExercisesModel.find();

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: genAIPrompt(
      JSON.stringify(allExercises),
      userMessage,
      oldChatHistory
    ),
  });

  const arrayString = response.text
    .replace("```json", "")
    .replace("```", "")
    .trim();

  console.log(arrayString);
  console.log("Parsed version works??", JSON.parse(arrayString));

  return JSON.parse(arrayString);
}

exports.getAllUserLogs = async (req, res) => {
  try {
    await connectDb();

    const allUserLogs = await UserLogsModel.find({
      userId: new mongodb.ObjectId(req.body.userId),
    });

    return allUserLogs || [];
  } catch (err) {
    console.log(err);
  }
};

exports.getUniqueExercises = async (req, res, next) => {
  try {
    await connectDb();

    const allUserLogs = await exports.getAllUserLogs(req, res);
    const uniqueExerciseLogs = findUniqueExerciseLogs(allUserLogs);
    const uniqueExercisesArray = uniqueExerciseLogs.map((log) => log.exercise);
    res.send(uniqueExercisesArray || []);
  } catch (err) {
    console.log(err);
  }
};

exports.getExerciseLogs = async (req, res, next) => {
  try {
    await connectDb();

    const exerciseIdentifier = new mongodb.ObjectId(req.params.exerciseId);
    const allUserLogs = await exports.getAllUserLogs(req, res);

    const relevantExerciseLogs = allUserLogs.filter((log) =>
      log.exercise.exerciseId.equals(exerciseIdentifier)
    );
    res.json(relevantExerciseLogs || []);
  } catch (err) {
    console.log(err);
  }
};

exports.postUserLog = async (req, res, next) => {
  try {
    await connectDb();

    const { logMessage, oldChatHistory, userId, localDate } = req.body;

    // AI interpretation with timeout and retry logic
    let interpretedArray;
    try {
      interpretedArray = await Promise.race([
        interpretUserLog(logMessage, oldChatHistory),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("AI_TIMEOUT")), 30000)
        ),
      ]);
    } catch (aiError) {
      console.error("AI interpretation failed:", aiError);
      return res.json({
        success: false,
        botMessage: "Yo, my brain's having a moment 🧠💀 Try again in a sec!",
      });
    }

    if (interpretedArray && interpretedArray.length === 5) {
      const logData = {
        userId: userId,
        workoutId: new Date().toISOString().split("T")[0],
        exercise: {
          exerciseId: new mongodb.ObjectId(interpretedArray[1]),
          exerciseName: interpretedArray[0],
        },
        exerciseWeight: interpretedArray[2],
        exerciseReps: interpretedArray[3],
        date: new Date(localDate),
      };

      const userLog = await new UserLogsModel(logData).save();

      console.log("The data was added to the database", userLog);
      res.json({
        success: true,
        botMessage: interpretedArray[4],
      });
    } else {
      res.json({
        success: false,
        botMessage: interpretedArray[0] || "Unknown format received from AI.",
      });
    }
  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      botMessage: "Internal server error.",
    });
  }
};

exports.deleteUserLog = async (req, res, next) => {
  try {
    await connectDb();

    await UserLogsModel.findByIdAndDelete(req.body.userLogId);
    res.json({
      success: true,
      message: "The log was deleted successfully",
    });
  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      message: "Failed to delete log",
    });
  }
};
