const mongoose = require("mongoose");

const formQuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },

  type: {
    type: String,
    enum: ["text", "mcq"],
    required: true,
  },

  options: {
    type: [String],
    default: [],
  },
});

const quickFormSchema = new mongoose.Schema(
  {
    // Teacher who created the form
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Form title
    title: {
      type: String,
      required: true,
    },

    // Form questions
    questions: {
      type: [formQuestionSchema],
      required: true,
    },

    // Code students use to open the form
    formCode: {
      type: String,
      required: true,
      unique: true,
    },

    // Time window
    availableFrom: {
      type: Date,
      required: true,
    },

    availableUntil: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("QuickForm", quickFormSchema);