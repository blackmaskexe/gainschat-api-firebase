const express = require("express");
const userLogsController = require("../controllers/userLogsController");
const usersController = require("../controllers/usersController");
const exercisesController = require("../controllers/exercisesController");

const router = express.Router();

router.post("/user/get-exercises", userLogsController.getUniqueExercises); // get their own unique exercises

router.post(
  "/user/get-exercise-logs/:exerciseId",
  userLogsController.getExerciseLogs
); // exercise logs for a particualr exercise by the user

router.post("/user/login", usersController.postAuthenticateUser);
router.post("/user/signup", usersController.postAddUser);
router.post("/user/log-workout", userLogsController.postUserLog);
router.post("/user/remove-workout-log", userLogsController.deleteUserLog);
router.post("/user/delete-account", usersController.postDeleteUser);
router.get("/privacy-policy", (req, res, next) => {
  res.render("privacy-policy");
});

module.exports = router;
