const mongoose = require("mongoose");

const responseSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },

  answer: {
    type: String,
    default: "",
  },
});

const formResponseSchema = new mongoose.Schema(
  {
    // Student who submitted the form
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Quick Form that was answered
    formId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QuickForm",
      required: true,
    },

    // Student's responses
    responses: {
      type: [responseSchema],
      required: true,
    },

    // When the form was submitted
    submittedAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("FormResponse", formResponseSchema);