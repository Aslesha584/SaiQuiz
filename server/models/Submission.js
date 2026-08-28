const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },

  answer: {
  type: String,
  default: "",
},
});

const submissionSchema = new mongoose.Schema(
  {
    // Student who attempted the quiz
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Quiz that was attempted
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },

    // Student's answers
    answers: {
      type: [answerSchema],
      required: true,
    },

    // Final score
    score: {
      type: Number,
      required: true,
      min: 0,
    },

    // Total number of questions
    totalQuestions: {
      type: Number,
      required: true,
      min: 1,
    },

    // When the student started
    startedAt: {
      type: Date,
      required: true,
    },

    // When the student submitted
    submittedAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Submission", submissionSchema);