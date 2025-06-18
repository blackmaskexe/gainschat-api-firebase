const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const UserLogsSchema = new Schema({
  userId: Schema.Types.ObjectId,
  workoutId: String,
  exercise: {
    exerciseId: Schema.Types.ObjectId,
    exerciseName: String,
  },
  exerciseWeight: Number,
  exerciseReps: Number,
  date: String,
});

module.exports = mongoose.model("UserLogs", UserLogsSchema);
