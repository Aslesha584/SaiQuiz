const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { GoogleGenAI, Type } = require("@google/genai");

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
// GEMINI AI
// =========================

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});


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
    message: "SimpleQuiz backend is running!",
  });
});


// =========================
// REGISTER USER
// =========================

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    if (!["student", "teacher"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role",
      });
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

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

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

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
// AI QUIZ GENERATION
// =========================

app.post(
  "/api/ai/generate-questions",
  authMiddleware,
  async (req, res) => {
    try {
      // Only teachers can generate questions
      if (req.user.role !== "teacher") {
        return res.status(403).json({
          message: "Only teachers can generate questions",
        });
      }

      const {
        subject,
        topic,
        language,
        difficulty,
        questionCount,
        questionType,
      } = req.body;

      // Validate required fields
      if (!subject || !topic || !questionCount) {
        return res.status(400).json({
          message:
            "Subject, topic and question count are required",
        });
      }

      const count = Number(questionCount);

      if (!Number.isInteger(count) || count < 1 || count > 20) {
        return res.status(400).json({
          message:
            "Question count must be between 1 and 20",
        });
      }

      // =========================
      // AI PROMPT
      // =========================

      const prompt = `
Create exactly ${count} multiple-choice quiz questions.

Teacher requirements:

Subject: ${subject}
Topic: ${topic}
Programming Language: ${language || "Not applicable"}
Difficulty: ${difficulty || "Medium"}
Question Type: ${questionType || "Multiple choice"}

IMPORTANT:

1. Create exactly ${count} questions.

2. Every question must have exactly four options:
A, B, C and D.

3. Exactly one option must be correct.

4. The correct answer must be represented by:
A, B, C or D.

5. Questions must genuinely test the requested subject and topic.

6. Do not add introductions, explanations, headings, conclusions or extra questions.

PROGRAMMING RULES:

7. If the teacher requests programming questions, use actual executable-looking code.

8. Programming questions must test understanding THROUGH CODE.

9. Prefer questions such as:
- What is the output?
- What value is printed?
- Which method executes?
- Which constructor executes?
- What is the final value?
- What is returned?
- What happens when the program runs?

10. Do NOT turn programming questions into definition-only questions.

11. Avoid extremely tiny or trivial programs.

12. Prefer meaningful multi-line programs that require the student to trace the execution.

13. Preserve valid syntax for the requested programming language.

14. If Java OOP is requested, questions may combine concepts such as:
inheritance, constructors, constructor chaining, method overriding,
method overloading, this, super, static members,
polymorphism, dynamic method dispatch, abstract classes,
interfaces and object references.

15. Do not force Java or OOP unless the teacher requested it.

16. For programming questions, put the complete program in the "code"
field.

17. For non-programming questions, the "code" field must be an empty string.

18. Verify the output or result of every programming question before
selecting the correct answer.

19. Make incorrect options plausible.

20. Do not create ambiguous questions.

21. Do not create questions where multiple options are correct.

Return ONLY the requested JSON structure.
`;

      // =========================
      // GEMINI REQUEST
      // =========================

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",

        contents: prompt,

        config: {
          responseMimeType: "application/json",

          responseSchema: {
            type: Type.OBJECT,

            properties: {
              questions: {
                type: Type.ARRAY,

                items: {
                  type: Type.OBJECT,

                  properties: {
                    question: {
                      type: Type.STRING,
                    },

                    code: {
                      type: Type.STRING,
                    },

                    options: {
                      type: Type.OBJECT,

                      properties: {
                        A: {
                          type: Type.STRING,
                        },

                        B: {
                          type: Type.STRING,
                        },

                        C: {
                          type: Type.STRING,
                        },

                        D: {
                          type: Type.STRING,
                        },
                      },

                      required: [
                        "A",
                        "B",
                        "C",
                        "D",
                      ],
                    },

                    answer: {
                      type: Type.STRING,
                    },
                  },

                  required: [
                    "question",
                    "code",
                    "options",
                    "answer",
                  ],
                },
              },
            },

            required: ["questions"],
          },
        },
      });

      // =========================
      // PARSE AI RESPONSE
      // =========================

      const result = JSON.parse(response.text);

      // =========================
      // BASIC VALIDATION
      // =========================

      if (
        !result.questions ||
        !Array.isArray(result.questions)
      ) {
        return res.status(500).json({
          message: "AI returned an invalid question format",
        });
      }

      if (result.questions.length !== count) {
        return res.status(500).json({
          message:
            "AI did not generate the requested number of questions",
        });
      }

      for (const question of result.questions) {
        if (
          !question.question ||
          !question.options ||
          !["A", "B", "C", "D"].includes(
            question.answer
          )
        ) {
          return res.status(500).json({
            message:
              "AI returned an invalid question",
          });
        }

        const {
          A,
          B,
          C,
          D,
        } = question.options;

        if (!A || !B || !C || !D) {
          return res.status(500).json({
            message:
              "AI returned incomplete answer options",
          });
        }
      }

      // =========================
      // SEND RESULT
      // =========================

      res.json(result);

    } catch (error) {
      console.error(
        "AI generation error:",
        error
      );

      res.status(500).json({
        message: "Failed to generate questions",
        error: error.message,
      });
    }
  }
);


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

      if (
        isNaN(startTime.getTime()) ||
        isNaN(endTime.getTime())
      ) {
        return res.status(400).json({
          message: "Invalid quiz dates",
        });
      }

      if (endTime <= startTime) {
        return res.status(400).json({
          message: "Quiz end time must be after start time",
        });
      }

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
      console.error(
        "Error creating quiz:",
        error
      );

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

app.get(
  "/api/quizzes/:quizCode",
  async (req, res) => {
    try {
      const quizCode =
        req.params.quizCode.toUpperCase();

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
      console.error(
        "Error fetching quiz:",
        error
      );

      res.status(500).json({
        message: "Failed to fetch quiz",
      });
    }
  }
);


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
          message:
            "Only students can submit quizzes",
        });
      }

      const { quizId } = req.params;
      const { answers, startedAt } = req.body;

      if (!Array.isArray(answers)) {
        return res.status(400).json({
          message: "Answers are required",
        });
      }

      const quiz = await Quiz.findById(quizId);

      if (!quiz) {
        return res.status(404).json({
          message: "Quiz not found",
        });
      }

      const existingSubmission =
        await Submission.findOne({
          quizId: quiz._id,
          studentId: req.user.id,
        });

      if (existingSubmission) {
        return res.status(400).json({
          message:
            "You have already submitted this quiz",
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
            item.questionId ===
            question._id.toString()
        );

        const studentAnswer =
          submitted?.answer?.trim() || "";

        if (
          studentAnswer.toLowerCase() ===
          question.correctAnswer
            .trim()
            .toLowerCase()
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
        totalQuestions:
          quiz.questions.length,
        startedAt: startedAt
          ? new Date(startedAt)
          : now,
        submittedAt: now,
      });

      const savedSubmission =
        await submission.save();

      res.status(201).json({
        message:
          "Quiz submitted successfully",

        result: {
          score: savedSubmission.score,

          totalQuestions:
            savedSubmission.totalQuestions,

          submissionId:
            savedSubmission._id,
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
      console.log(
        "LOGGED USER:",
        req.user
      );

      if (req.user.role !== "student") {
        return res.status(403).json({
          message:
            "Only students can view their results",
        });
      }

      const submissions =
        await Submission.find({
          studentId: req.user.id,
        })
          .populate(
            "quizId",
            "title quizCode"
          )
          .sort({
            submittedAt: -1,
          });

      res.json({
        submissions,
      });

    } catch (error) {
      console.error(
        "Error fetching student results:",
        error
      );

      res.status(500).json({
        message:
          "Failed to fetch student results",
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
      if (req.user.role !== "teacher") {
        return res.status(403).json({
          message:
            "Only teachers can view student results",
        });
      }

      const quizzes = await Quiz.find({
        teacherId: req.user.id,
      }).select(
        "title quizCode"
      );

      const quizIds = quizzes.map(
        (quiz) => quiz._id
      );

      const submissions =
        await Submission.find({
          quizId: {
            $in: quizIds,
          },
        })
          .populate(
            "studentId",
            "name email"
          )
          .populate(
            "quizId",
            "title quizCode"
          )
          .sort({
            submittedAt: -1,
          });

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
        message:
          "Failed to fetch student results",
      });
    }
  }
);


// =========================
// GET TEACHER'S OWN QUIZZES
// =========================

app.get(
  "/api/teacher/quizzes",
  authMiddleware,
  async (req, res) => {
    try {
      if (req.user.role !== "teacher") {
        return res.status(403).json({
          message:
            "Only teachers can view their quizzes",
        });
      }

      const quizzes = await Quiz.find({
        teacherId: req.user.id,
      }).sort({
        createdAt: -1,
      });

      const quizzesWithStats =
        await Promise.all(
          quizzes.map(async (quiz) => {
            const submissionCount =
              await Submission.countDocuments({
                quizId: quiz._id,
              });

            return {
              _id: quiz._id,
              title: quiz.title,
              quizCode: quiz.quizCode,
              questionCount:
                quiz.questions.length,
              availableFrom:
                quiz.availableFrom,
              availableUntil:
                quiz.availableUntil,
              timeLimit:
                quiz.timeLimit,
              submissionCount,
              createdAt:
                quiz.createdAt,
            };
          })
        );

      res.json({
        quizzes: quizzesWithStats,
      });

    } catch (error) {
      console.error(
        "Error fetching teacher quizzes:",
        error
      );

      res.status(500).json({
        message:
          "Failed to fetch teacher quizzes",
      });
    }
  }
);


// =========================
// DELETE TEACHER'S QUIZ
// =========================

app.delete(
  "/api/quizzes/:quizId",
  authMiddleware,
  async (req, res) => {
    try {
      if (req.user.role !== "teacher") {
        return res.status(403).json({
          message:
            "Only teachers can delete quizzes",
        });
      }

      const { quizId } = req.params;

      const quiz = await Quiz.findOne({
        _id: quizId,
        teacherId: req.user.id,
      });

      if (!quiz) {
        return res.status(404).json({
          message:
            "Quiz not found or you are not allowed to delete it",
        });
      }

      await Quiz.deleteOne({
        _id: quizId,
      });

      await Submission.deleteMany({
        quizId: quizId,
      });

      res.json({
        message:
          "Quiz deleted successfully",
      });

    } catch (error) {
      console.error(
        "Error deleting quiz:",
        error
      );

      res.status(500).json({
        message:
          "Failed to delete quiz",
      });
    }
  }
);


// =========================
// START SERVER
// =========================

app.listen(PORT, () => {
  console.log(
    `SimpleQuiz server running on port ${PORT}`
  );
});