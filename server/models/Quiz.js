const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },

  options: {
    type: [String],
    required: true,
  },

  correctAnswer: {
    type: String,
    required: true,
  },
});

const quizSchema = new mongoose.Schema(
  {
    // Teacher who created this quiz
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Quiz title
    title: {
      type: String,
      required: true,
    },

    // Questions
    questions: {
      type: [questionSchema],
      required: true,
    },

    // Student joining code
    quizCode: {
      type: String,
      required: true,
      unique: true,
    },

    // Quiz can be attended only during this period
    availableFrom: {
      type: Date,
      required: true,
    },

    availableUntil: {
      type: Date,
      required: true,
    },

    // Time allowed after student starts
    // Example: 20 = 20 minutes
    timeLimit: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Quiz", quizSchema);