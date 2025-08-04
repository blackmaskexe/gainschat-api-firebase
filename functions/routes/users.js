const express = require("express");
const userLogsController = require("../controllers/userLogsController");
const usersController = require("../controllers/usersController");
const { createAIRateLimit } = require("../middleware/aiRateLimit");

const router = express.Router();

const aiRateLimit = createAIRateLimit({
  maxRequestsPerDay: 50,
  maxRequestsPerHour: 10,
  maxMessageLength: 500,
});

router.post("/user/get-exercises", userLogsController.getUniqueExercises); // get their own unique exercises

router.post(
  "/user/get-exercise-logs/:exerciseId",
  userLogsController.getExerciseLogs
); // exercise logs for a particualr exercise by the user

router.post("/user/login", usersController.postAuthenticateUser);
router.post("/user/signup", usersController.postAddUser);
router.post("/user/log-workout", aiRateLimit, userLogsController.postUserLog); // rate limited
router.post("/user/remove-workout-log", userLogsController.deleteUserLog);
router.post("/user/delete-account", usersController.postDeleteUser);
router.get("/privacy-policy", (req, res, next) => {
  res.render("privacy-policy");
});

module.exports = router;
