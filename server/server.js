
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("./models/User");
const Quiz = require("./models/Quiz");
const Submission = require("./models/Submission");
const QuickForm = require("./models/QuickForm");
const FormResponse = require("./models/FormResponse");
const authMiddleware = require("./middleware/authMiddleware");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;


// =========================
// MONGODB CONNECTION
// =========================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((error) => {
    console.log("MongoDB connection error:", error);
  });


// =========================
// HOME ROUTE
// =========================

app.get("/", (req, res) => {
  res.json({
    message: "SaiQuiz backend is running!",
  });
});


// =========================
// REGISTER USER
// =========================

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // Check role
    if (!["student", "teacher"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role",
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already registered",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
    });

    const savedUser = await user.save();

    res.status(201).json({
      message: "Registration successful",
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
      },
    });

  } catch (error) {
    console.error("Registration error:", error);

    res.status(500).json({
      message: "Registration failed",
    });
  }
});


// =========================
// LOGIN USER
// =========================

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check required fields
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // Find user
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Compare password
    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Create JWT
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.json({
      message: "Login successful",

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Login failed",
    });
  }
});


// =========================
// CREATE QUIZ
// =========================



// =========================
// CREATE QUIZ
// =========================

app.post(
  "/api/quizzes",
  authMiddleware,
  async (req, res) => {
    try {
      // Only teachers can create quizzes
      if (req.user.role !== "teacher") {
        return res.status(403).json({
          message: "Only teachers can create quizzes",
        });
      }

      const {
        title,
        questions,
        quizCode,
        availableFrom,
        availableUntil,
        timeLimit,
      } = req.body;

      // Check required fields
      if (
        !title ||
        !questions ||
        !questions.length ||
        !quizCode ||
        !availableFrom ||
        !availableUntil ||
        !timeLimit
      ) {
        return res.status(400).json({
          message: "All quiz fields are required",
        });
      }

      const startTime = new Date(availableFrom);
      const endTime = new Date(availableUntil);

      // Check dates
      if (
        isNaN(startTime.getTime()) ||
        isNaN(endTime.getTime())
      ) {
        return res.status(400).json({
          message: "Invalid quiz dates",
        });
      }

      // End must be after start
      if (endTime <= startTime) {
        return res.status(400).json({
          message: "Quiz end time must be after start time",
        });
      }

      // Timer validation
      if (Number(timeLimit) < 1) {
        return res.status(400).json({
          message: "Time limit must be at least 1 minute",
        });
      }

      const quiz = new Quiz({
        teacherId: req.user.id,
        title: title.trim(),
        questions,
        quizCode: quizCode.toUpperCase(),
        availableFrom: startTime,
        availableUntil: endTime,
        timeLimit: Number(timeLimit),
      });

      const savedQuiz = await quiz.save();

      res.status(201).json({
        message: "Quiz created successfully",
        quiz: savedQuiz,
      });

    } catch (error) {
      console.error("Error creating quiz:", error);

      res.status(500).json({
        message: "Failed to create quiz",
        error: error.message,
      });
    }
  }
);


// =========================
// GET QUIZ BY CODE
// =========================

app.get("/api/quizzes/:quizCode", async (req, res) => {
  try {
    const quizCode = req.params.quizCode.toUpperCase();

    const quiz = await Quiz.findOne({
      quizCode: quizCode,
    });

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found",
      });
    }

    res.json(quiz);

  } catch (error) {
    console.error("Error fetching quiz:", error);

    res.status(500).json({
      message: "Failed to fetch quiz",
    });
  }
});

// =========================
// SUBMIT QUIZ
// =========================

app.post(
  "/api/quizzes/:quizId/submit",
  authMiddleware,
  async (req, res) => {
    try {
      // Only students can submit quizzes
      if (req.user.role !== "student") {
        return res.status(403).json({
          message: "Only students can submit quizzes",
        });
      }

      const { quizId } = req.params;
      const { answers, startedAt } = req.body;

      // Check answers
      if (!Array.isArray(answers)) {
        return res.status(400).json({
          message: "Answers are required",
        });
      }

      // Find quiz
      const quiz = await Quiz.findById(quizId);

      if (!quiz) {
        return res.status(404).json({
          message: "Quiz not found",
        });
      }

      // Prevent multiple submissions
      const existingSubmission =
        await Submission.findOne({
          quizId: quiz._id,
          studentId: req.user.id,
        });

      if (existingSubmission) {
        return res.status(400).json({
          message: "You have already submitted this quiz",
        });
      }

      // =========================
      // CHECK QUIZ AVAILABILITY
      // =========================

      const now = new Date();

      if (now < quiz.availableFrom) {
        return res.status(400).json({
          message: "Quiz has not started yet",
        });
      }

      if (now > quiz.availableUntil) {
        return res.status(400).json({
          message: "Quiz has already ended",
        });
      }

      // =========================
      // CALCULATE SCORE
      // =========================

      let score = 0;

      const submittedAnswers = [];

      quiz.questions.forEach((question) => {
        const submitted = answers.find(
          (item) =>
            item.questionId === question._id.toString()
        );

        const studentAnswer =
          submitted?.answer?.trim() || "";

        if (
          studentAnswer.toLowerCase() ===
          question.correctAnswer.trim().toLowerCase()
        ) {
          score++;
        }

        submittedAnswers.push({
          questionId: question._id,
          answer: studentAnswer,
        });
      });

      // =========================
      // SAVE SUBMISSION
      // =========================

      const submission = new Submission({
        studentId: req.user.id,
        quizId: quiz._id,
        answers: submittedAnswers,
        score,
        totalQuestions: quiz.questions.length,
        startedAt: startedAt
          ? new Date(startedAt)
          : now,
        submittedAt: now,
      });

      const savedSubmission =
        await submission.save();

      // =========================
      // RESPONSE
      // =========================

      res.status(201).json({
        message: "Quiz submitted successfully",

        result: {
          score: savedSubmission.score,
          totalQuestions:
            savedSubmission.totalQuestions,
          submissionId: savedSubmission._id,
        },
      });

    } catch (error) {
      console.error(
        "Error submitting quiz:",
        error
      );

      res.status(500).json({
        message: "Failed to submit quiz",
        error: error.message,
      });
    }
  }
);
// =========================
// GET STUDENT'S OWN RESULTS
// =========================

app.get(
  "/api/submissions/student",
  authMiddleware,
  async (req, res) => {
    try {
      console.log("LOGGED USER:", req.user);
      // Only students can view their own results
      if (req.user.role !== "student") {
        return res.status(403).json({
          message: "Only students can view their results",
        });
      }

      // Find only this student's submissions
      const submissions = await Submission.find({
        studentId: req.user.id,
      })
        .populate("quizId", "title quizCode")
        .sort({ submittedAt: -1 });

      res.json({
        submissions,
      });

    } catch (error) {
      console.error(
        "Error fetching student results:",
        error
      );

      res.status(500).json({
        message: "Failed to fetch student results",
      });
    }
  }
);
// =========================
// GET RESULTS FOR TEACHER'S OWN QUIZZES
// =========================

app.get(
  "/api/submissions/teacher",
  authMiddleware,
  async (req, res) => {
    try {
      // Only teachers can access this
      if (req.user.role !== "teacher") {
        return res.status(403).json({
          message: "Only teachers can view student results",
        });
      }

      // Find only quizzes created by this teacher
      const quizzes = await Quiz.find({
        teacherId: req.user.id,
      }).select("title quizCode");

      const quizIds = quizzes.map((quiz) => quiz._id);

      // Find submissions only for those quizzes
      const submissions = await Submission.find({
        quizId: { $in: quizIds },
      })
        .populate("studentId", "name email")
        .populate("quizId", "title quizCode")
        .sort({ submittedAt: -1 });

      res.json({
        quizzes,
        submissions,
      });

    } catch (error) {
      console.error(
        "Error fetching teacher results:",
        error
      );

      res.status(500).json({
        message: "Failed to fetch student results",
      });
    }
  }
);
// =========================
// START SERVER
// =========================

app.listen(PORT, () => {
  console.log(`SaiQuiz server running on port ${PORT}`);
});

