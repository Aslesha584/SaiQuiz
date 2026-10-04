
import saiquizLogo from "../assets/saiquiz-logo.jpeg";
import { useState } from "react";
import "./CreateQuiz.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function CreateQuiz() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [questions, setQuestions] = useState([]);

  const [showPreview, setShowPreview] = useState(false);
  const [quizCreated, setQuizCreated] = useState(false);
  const [quizCode, setQuizCode] = useState("");
  const [copied, setCopied] = useState(false);

  // =========================
  // QUIZ SETTINGS
  // =========================

  const [availableFromDate, setAvailableFromDate] = useState("");
  const [availableFromTime, setAvailableFromTime] = useState("");

  const [availableUntilDate, setAvailableUntilDate] = useState("");
  const [availableUntilTime, setAvailableUntilTime] = useState("");

  const [timeLimit, setTimeLimit] = useState("");

  // =========================
  // AI QUESTION GENERATOR
  // =========================

  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [language, setLanguage] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [questionCount, setQuestionCount] = useState(5);
  const [questionType, setQuestionType] = useState("Multiple Choice");
  const [generatingQuestions, setGeneratingQuestions] = useState(false);

  const navigate = useNavigate();

  // =========================
  // CHATGPT / MANUAL PROMPT
  // =========================

  const chatGPTPrompt = `Create quiz questions for SimpleQuiz.

IMPORTANT:
You MUST follow the output format EXACTLY.
Do NOT change, simplify, rearrange, or modify the format.

Use EXACTLY this format:

Q1. What is the brain of a computer called?

A. Monitor
B. CPU
C. Keyboard
D. Mouse

Answer: B

Q2. What does CSS stand for?

A. Computer Style Sheets
B. Creative Style System
C. Cascading Style Sheets
D. Colorful Style Sheets

Answer: C

STRICT RULES:

1. Generate only quiz questions.

2. Every question MUST start exactly like:
Q1.
Q2.
Q3.
Q4.
and so on.

3. Question numbers MUST be sequential.

4. Every question MUST contain EXACTLY FOUR options.

5. The four options MUST be:
A.
B.
C.
D.

6. EACH option MUST be on its OWN separate line.

7. The correct answer MUST be written exactly as:
Answer: A
OR
Answer: B
OR
Answer: C
OR
Answer: D

8. Every question MUST have exactly ONE correct answer.

9. The other three options MUST be incorrect but plausible.

10. Do not create ambiguous questions.

11. Verify the factual correctness of every question and answer.

12. Do not add explanations.

13. Do not add headings or extra text.

14. For programming questions, use meaningful multiline code.

15. Programming code must be placed between $$ markers.

Example:

Q1. What is the output of the following Java program?

$$
class Main {
    public static void main(String[] args) {
        int a = 10;
        int b = 20;
        int sum = a + b;

        System.out.println(sum);
    }
}
$$

A. 10
B. 20
C. 30
D. 40

Answer: C

OUTPUT ONLY THE FINAL QUIZ.`;

  // =========================
  // FORMAT AI QUESTIONS
  // =========================

  const formatAIQuestions = (aiQuestions) => {
    return aiQuestions
      .map((item, index) => {
        let formattedQuestion = `Q${index + 1}. ${item.question.trim()}\n\n`;

        // Add $$ automatically around programming code
        if (item.code && item.code.trim()) {
          formattedQuestion += `$$\n${item.code.trim()}\n$$\n\n`;
        }

        formattedQuestion +=
          `A. ${item.options.A.trim()}\n` +
          `B. ${item.options.B.trim()}\n` +
          `C. ${item.options.C.trim()}\n` +
          `D. ${item.options.D.trim()}\n\n` +
          `Answer: ${item.answer.toUpperCase()}`;

        return formattedQuestion;
      })
      .join("\n\n");
  };

  // =========================
  // PARSE CONTENT
  // =========================

  const parseQuestions = (contentToParse = content) => {
    if (!title.trim()) {
      alert("Please enter a quiz title.");
      return false;
    }

    if (!contentToParse.trim()) {
      alert("Please add your questions.");
      return false;
    }

    const cleanedContent = contentToParse
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/\*\*/g, "")
      .replace(/^#+\s*/gm, "")
      .trim();

    const blocks = cleanedContent
      .split(/(?=^Q\d+\.\s+)/gim)
      .map((block) => block.trim())
      .filter(Boolean);

    if (blocks.length === 0) {
      alert(
        "No questions detected. Please use the exact Q1., Q2., Q3. format."
      );
      return false;
    }

    const parsedQuestions = [];

    for (let index = 0; index < blocks.length; index++) {
      const block = blocks[index];

      // -----------------------------------
      // SUPPORT NORMAL + MULTILINE CODE
      // -----------------------------------

      const normalizedBlock = block
        .replace(/\$\$\s*\n?/g, "$$\n")
        .replace(/\n?\s*\$\$/g, "\n$$");

      const lines = normalizedBlock
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      // -----------------------------------
      // FIND QUESTION
      // -----------------------------------

      const questionMatch = lines[0]?.match(
        /^Q(\d+)\.\s+(.+)$/i
      );

      if (!questionMatch) {
        alert(
          `Question ${index + 1} must start exactly with Q${index + 1}.`
        );
        return false;
      }

      const questionNumber = Number(questionMatch[1]);

      if (questionNumber !== index + 1) {
        alert(
          `Question numbering is incorrect.\n\nExpected Q${index + 1}. but found Q${questionNumber}.`
        );
        return false;
      }

      // -----------------------------------
      // FIND ANSWER LINE
      // -----------------------------------

      const answerIndex = lines.findIndex((line) =>
        /^Answer:\s*[ABCD]$/i.test(line)
      );

      if (answerIndex === -1) {
        alert(
          `Question ${index + 1} is missing a valid Answer line.`
        );
        return false;
      }

      const correctAnswer = lines[answerIndex]
        .match(/^Answer:\s*([ABCD])$/i)[1]
        .toUpperCase();

      // -----------------------------------
      // FIND OPTIONS
      // -----------------------------------

      const optionLines = lines.slice(1, answerIndex);

      const options = [];
      const optionLabels = ["A", "B", "C", "D"];

      for (let optionIndex = 0; optionIndex < 4; optionIndex++) {
        const expectedLetter = optionLabels[optionIndex];

        const optionPosition = optionLines.findIndex((line) =>
          new RegExp(`^${expectedLetter}\\.\\s+(.+)$`, "i").test(line)
        );

        if (optionPosition === -1) {
          alert(
            `Question ${index + 1} is missing option ${expectedLetter}.`
          );
          return false;
        }

        const optionMatch = optionLines[optionPosition].match(
          new RegExp(`^${expectedLetter}\\.\\s+(.+)$`, "i")
        );

        const optionText = optionMatch[1].trim();

        if (!optionText) {
          alert(
            `Question ${index + 1} has an empty ${expectedLetter} option.`
          );
          return false;
        }

        options.push(optionText);
      }

      // -----------------------------------
      // DUPLICATE OPTION CHECK
      // -----------------------------------

      const normalizedOptions = options.map((option) =>
        option.toLowerCase().replace(/\s+/g, " ").trim()
      );

      if (new Set(normalizedOptions).size !== 4) {
        alert(
          `Question ${index + 1} contains duplicate options.`
        );
        return false;
      }

      // -----------------------------------
      // BUILD QUESTION TEXT
      // -----------------------------------

      const questionLines = lines.slice(0, answerIndex);

      const firstLine = questionLines[0];

      let questionText = firstLine.replace(
        /^Q\d+\.\s+/i,
        ""
      );

      // Find code blocks
      const codeStart = questionLines.indexOf("$$");

      if (codeStart !== -1) {
        const codeEnd = questionLines.indexOf(
          "$$",
          codeStart + 1
        );

        if (codeEnd === -1) {
          alert(
            `Question ${index + 1} has an incomplete $$ code block.`
          );
          return false;
        }

        const code = questionLines
          .slice(codeStart + 1, codeEnd)
          .join("\n")
          .trim();

        if (!code) {
          alert(
            `Question ${index + 1} contains an empty code block.`
          );
          return false;
        }

        questionText += `\n\n$$\n${code}\n$$`;
      }

      // -----------------------------------
      // SAVE QUESTION
      // -----------------------------------

      parsedQuestions.push({
        question: questionText.trim(),
        options,
        correctAnswer,
      });
    }

    if (parsedQuestions.length === 0) {
      alert("No valid questions detected.");
      return false;
    }

    setQuestions(parsedQuestions);
    setShowPreview(true);

    return true;
  };

  // =========================
  // GENERATE QUESTIONS WITH AI
  // =========================

  const handleGenerateQuestions = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Please login first.");
        return;
      }

      if (!title.trim()) {
        alert("Please enter a quiz title first.");
        return;
      }

      if (!subject.trim()) {
        alert("Please enter the subject.");
        return;
      }

      if (!topic.trim()) {
        alert("Please enter the topic.");
        return;
      }

      if (
        questionCount < 1 ||
        questionCount > 20
      ) {
        alert("Question count must be between 1 and 20.");
        return;
      }

      setGeneratingQuestions(true);

      const response = await axios.post(
        "https://saiquiz-backend.onrender.com/api/ai/generate-questions",
        {
          subject: subject.trim(),
          topic: topic.trim(),
          language: language.trim(),
          difficulty,
          questionCount: Number(questionCount),
          questionType,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const generatedQuestions = response.data?.questions;

      if (
        !Array.isArray(generatedQuestions) ||
        generatedQuestions.length === 0
      ) {
        alert("AI did not return valid questions.");
        return;
      }

      // -----------------------------------
      // FORMAT AI RESPONSE
      // -----------------------------------

      const formattedContent =
        formatAIQuestions(generatedQuestions);

      // Put the generated questions into the
      // existing question textarea.
      setContent(formattedContent);

      // -----------------------------------
      // PARSE USING EXISTING VALIDATION
      // -----------------------------------

      const success = parseQuestions(formattedContent);

      if (!success) {
        setShowPreview(false);
        return;
      }

      alert(
        `${generatedQuestions.length} questions generated successfully!`
      );
    } catch (error) {
      console.error(
        "AI question generation error:",
        error
      );

      if (error.response?.status === 401) {
        alert("Please login again.");
      } else if (error.response?.status === 403) {
        alert("Only teachers can generate quiz questions.");
      } else if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert(
          "Failed to generate questions. Please try again."
        );
      }
    } finally {
      setGeneratingQuestions(false);
    }
  };

  // =========================
  // CREATE QUIZ
  // =========================

  const handleCreateQuiz = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Please login first.");
        return;
      }

      if (!availableFromDate || !availableFromTime) {
        alert("Please select the quiz start date and time.");
        return;
      }

      if (!availableUntilDate || !availableUntilTime) {
        alert("Please select the quiz end date and time.");
        return;
      }

      if (!timeLimit) {
        alert("Please enter the quiz time limit.");
        return;
      }

      if (Number(timeLimit) < 1) {
        alert("Time limit must be at least 1 minute.");
        return;
      }

      const startTime = new Date(
        `${availableFromDate}T${availableFromTime}`
      );

      const endTime = new Date(
        `${availableUntilDate}T${availableUntilTime}`
      );

      if (
        isNaN(startTime.getTime()) ||
        isNaN(endTime.getTime())
      ) {
        alert("Please select valid dates and times.");
        return;
      }

      if (endTime <= startTime) {
        alert("Quiz end time must be after start time.");
        return;
      }

      if (questions.length === 0) {
        alert("Please add at least one question.");
        return;
      }

      const invalidQuestion = questions.find(
        (question) =>
          !question.question.trim() ||
          question.options.length !== 4 ||
          question.options.some(
            (option) => !option.trim()
          ) ||
          !["A", "B", "C", "D"].includes(
            question.correctAnswer
          )
      );

      if (invalidQuestion) {
        alert(
          "One or more questions are invalid. Please go back and fix them."
        );
        return;
      }

      const code =
        "SQ" +
        Math.floor(1000 + Math.random() * 9000);

      const quizData = {
        title: title.trim(),
        questions,
        quizCode: code,
        availableFrom: startTime.toISOString(),
        availableUntil: endTime.toISOString(),
        timeLimit: Number(timeLimit),
      };

      await axios.post(
        "https://saiquiz-backend.onrender.com/api/quizzes",
        quizData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setQuizCode(code);
      setQuizCreated(true);
    } catch (error) {
      console.error(
        "Error creating quiz:",
        error
      );

      if (error.response?.status === 401) {
        alert("Please login again.");
      } else if (error.response?.status === 403) {
        alert("Only teachers can create quizzes.");
      } else if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert("Failed to create quiz.");
      }
    }
  };

  // =========================
  // SUCCESS PAGE
  // =========================

  if (quizCreated) {
    const formatDateTime = (date, time) => {
      return new Date(
        `${date}T${time}`
      ).toLocaleString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    };

    const formattedStart = formatDateTime(
      availableFromDate,
      availableFromTime
    );

    const formattedEnd = formatDateTime(
      availableUntilDate,
      availableUntilTime
    );

    const quizMessage = `Students, please attend the quiz.

Quiz Name: ${title}
Quiz Code: ${quizCode}

Available From: ${formattedStart}
Available Until: ${formattedEnd}
Time Limit: ${timeLimit} minutes

Attend Quiz: https://simple-quiz-black.vercel.app/join`;

    return (
      <div className="create-page">
        <header className="create-header">
          <div className="logo">
            <img
              src={saiquizLogo}
              alt="SimpleQuiz"
              className="logo-image"
            />
          </div>

          <button
            className="back-button"
            onClick={() => navigate("/")}
          >
            ← Home
          </button>
        </header>

        <main className="create-container">
          <div className="success-page">
            <div className="success-icon">✓</div>

            <p className="success-label">
              QUIZ CREATED
            </p>

            <h1>
              Your quiz is ready! 🎉
            </h1>

            <p className="success-description">
              Copy the message below and send it
              directly to your students.
            </p>

            <div className="code-card">
              <span>QUIZ CODE</span>
              <strong>{quizCode}</strong>
            </div>

            <div className="message-preview">
              <div className="message-preview-header">
                <span>MESSAGE PREVIEW</span>
                <small>Preview</small>
              </div>

              <div className="message-preview-content">
                <p>
                  Students, please attend the quiz.
                </p>

                <div className="message-details">
                  <div>
                    <span>Quiz Name</span>
                    <strong>{title}</strong>
                  </div>

                  <div>
                    <span>Quiz Code</span>
                    <strong>{quizCode}</strong>
                  </div>

                  <div>
                    <span>Available From</span>
                    <strong>{formattedStart}</strong>
                  </div>

                  <div>
                    <span>Available Until</span>
                    <strong>{formattedEnd}</strong>
                  </div>

                  <div>
                    <span>Time Limit</span>
                    <strong>
                      {timeLimit} minutes
                    </strong>
                  </div>
                </div>

                <div className="message-link">
                  <span>Attend Quiz</span>

                  <strong>
                    https://simple-quiz-black.vercel.app/join
                  </strong>
                </div>
              </div>
            </div>

            <button
              className="create-final-button"
              onClick={() => {
                navigator.clipboard.writeText(
                  quizMessage
                );

                setCopied(true);

                setTimeout(() => {
                  setCopied(false);
                }, 2000);
              }}
            >
              {copied
                ? "✓ Message Copied!"
                : "📋 Copy Message"}
            </button>
          </div>
        </main>
      </div>
    );
  }

  // =========================
  // INPUT PAGE
  // =========================

  if (!showPreview) {
    return (
      <div className="create-page">
        <header className="create-header">
          <div className="logo">
            <img
              src={saiquizLogo}
              alt="SimpleQuiz"
              className="logo-image"
            />
          </div>

          <button
            className="back-button"
            onClick={() => navigate("/")}
          >
            ← Back
          </button>
        </header>

        <main className="create-container">
          <div className="create-heading">
            <p>CREATE QUIZ</p>

            <h1>
              Build your quiz
              <span> in seconds.</span>
            </h1>

            <div className="create-description">
              Create questions manually or generate them
              instantly with AI.
            </div>
          </div>

          <div className="quiz-form">
            {/* TITLE */}

            <div className="input-section">
              <label>Quiz Title</label>

              <input
                type="text"
                placeholder="Example: Java Basics Quiz"
                value={title}
                onChange={(e) =>
                  setTitle(e.target.value)
                }
              />
            </div>

            {/* =========================
                AI GENERATOR
            ========================= */}

            <div className="ai-generator">
              <div className="ai-generator-heading">
                <div>
                  <p>AI QUESTION GENERATOR</p>

                  <h2>
                    Generate your questions automatically
                  </h2>

                  <span>
                    Choose the topic and difficulty.
                    SimpleQuiz will create the questions
                    for you.
                  </span>
                </div>

                <div className="ai-badge">
                  AI
                </div>
              </div>

              <div className="ai-generator-grid">
                <div className="input-section">
                  <label>Subject</label>

                  <input
                    type="text"
                    placeholder="Example: Computer Science"
                    value={subject}
                    onChange={(e) =>
                      setSubject(e.target.value)
                    }
                  />
                </div>

                <div className="input-section">
                  <label>Topic</label>

                  <input
                    type="text"
                    placeholder="Example: Java OOP"
                    value={topic}
                    onChange={(e) =>
                      setTopic(e.target.value)
                    }
                  />
                </div>

                <div className="input-section">
                  <label>
                    Programming Language
                    <span className="optional-label">
                      Optional
                    </span>
                  </label>

                  <input
                    type="text"
                    placeholder="Example: Java"
                    value={language}
                    onChange={(e) =>
                      setLanguage(e.target.value)
                    }
                  />
                </div>

                <div className="input-section">
                  <label>Difficulty</label>

                  <select
                    value={difficulty}
                    onChange={(e) =>
                      setDifficulty(e.target.value)
                    }
                  >
                    <option value="Easy">
                      Easy
                    </option>

                    <option value="Medium">
                      Medium
                    </option>

                    <option value="Hard">
                      Hard
                    </option>
                  </select>
                </div>

                <div className="input-section">
                  <label>Number of Questions</label>

                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={questionCount}
                    onChange={(e) =>
                      setQuestionCount(
                        Number(e.target.value)
                      )
                    }
                  />
                </div>

                <div className="input-section">
                  <label>Question Type</label>

                  <select
                    value={questionType}
                    onChange={(e) =>
                      setQuestionType(e.target.value)
                    }
                  >
                    <option value="Multiple Choice">
                      Multiple Choice
                    </option>

                    <option value="Output Based">
                      Output Based
                    </option>

                    <option value="Conceptual">
                      Conceptual
                    </option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                className="ai-generate-button"
                onClick={handleGenerateQuestions}
                disabled={generatingQuestions}
              >
                {generatingQuestions
                  ? "Generating Questions..."
                  : "✨ Generate Questions with AI"}
              </button>
            </div>

            {/* =========================
                MANUAL QUESTIONS
            ========================= */}

            <div className="input-section">
              <div className="label-row">
                <label>Questions</label>

                <span>Manual / Bulk import</span>
              </div>

              <div className="question-help">
                <strong>
                  Want to create questions manually?
                </strong>

                <p>
                  Copy the prompt below and use it with
                  ChatGPT or another AI tool.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      chatGPTPrompt
                    );

                    setCopied(true);

                    setTimeout(() => {
                      setCopied(false);
                    }, 2000);
                  }}
                >
                  {copied
                    ? "✓ Copied!"
                    : "Copy Prompt"}
                </button>
              </div>

              <label className="questions-paste-label">
                Generated or formatted questions
              </label>

              <textarea
                placeholder={`Generated questions will appear here...

You can also paste questions manually.

Example:

Q1. What is Java?

A. Programming Language
B. Database
C. Browser
D. Operating System

Answer: A`}
                value={content}
                onChange={(e) =>
                  setContent(e.target.value)
                }
              />
            </div>

            {/* =========================
                QUIZ SETTINGS
            ========================= */}

            <div className="quiz-settings">
              <div className="settings-heading">
                <p>QUIZ SETTINGS</p>

                <span>
                  Set when students can attend
                </span>
              </div>

              <div className="input-section">
                <label>Available From</label>

                <input
                  type="date"
                  value={availableFromDate}
                  onChange={(e) =>
                    setAvailableFromDate(
                      e.target.value
                    )
                  }
                />

                <select
                  value={availableFromTime}
                  onChange={(e) =>
                    setAvailableFromTime(
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    Select time
                  </option>

                  {Array.from(
                    { length: 24 },
                    (_, hour) => {
                      const value = `${String(
                        hour
                      ).padStart(
                        2,
                        "0"
                      )}:00`;

                      const displayHour =
                        hour === 0
                          ? 12
                          : hour > 12
                          ? hour - 12
                          : hour;

                      const period =
                        hour < 12
                          ? "AM"
                          : "PM";

                      return (
                        <option
                          key={value}
                          value={value}
                        >
                          {displayHour}:00{" "}
                          {period}
                        </option>
                      );
                    }
                  )}
                </select>
              </div>

              <div className="input-section">
                <label>Available Until</label>

                <input
                  type="date"
                  value={availableUntilDate}
                  onChange={(e) =>
                    setAvailableUntilDate(
                      e.target.value
                    )
                  }
                />

                <select
                  value={availableUntilTime}
                  onChange={(e) =>
                    setAvailableUntilTime(
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    Select time
                  </option>

                  {Array.from(
                    { length: 24 },
                    (_, hour) => {
                      const value = `${String(
                        hour
                      ).padStart(
                        2,
                        "0"
                      )}:00`;

                      const displayHour =
                        hour === 0
                          ? 12
                          : hour > 12
                          ? hour - 12
                          : hour;

                      const period =
                        hour < 12
                          ? "AM"
                          : "PM";

                      return (
                        <option
                          key={value}
                          value={value}
                        >
                          {displayHour}:00{" "}
                          {period}
                        </option>
                      );
                    }
                  )}
                </select>
              </div>

              <div className="input-section">
                <label>Time Limit</label>

                <div className="time-input-wrapper">
                  <input
                    type="number"
                    min="1"
                    placeholder="30"
                    value={timeLimit}
                    onChange={(e) =>
                      setTimeLimit(
                        e.target.value
                      )
                    }
                  />

                  <span>minutes</span>
                </div>
              </div>
            </div>

            {/* TIP */}

            <div className="tip-box">
              <span>💡</span>

              <div>
                <strong>Quick tip</strong>

                <p>
                  Use AI generation for quick quizzes,
                  or paste your own formatted questions.
                </p>
              </div>
            </div>

            {/* PREVIEW */}

            <button
              className="preview-button"
              onClick={() => parseQuestions()}
            >
              Preview Questions

              <span>→</span>
            </button>
          </div>
        </main>
      </div>
    );
  }

  // =========================
  // PREVIEW PAGE
  // =========================

  return (
    <div className="create-page">
      <header className="create-header">
        <div className="logo">
          <img
            src={saiquizLogo}
            alt="SimpleQuiz"
            className="logo-image"
          />
        </div>

        <button
          className="back-button"
          onClick={() => navigate("/")}
        >
          ← Home
        </button>
      </header>

      <main className="create-container">
        <div className="preview-page">
          <div className="preview-top">
            <div>
              <p>QUIZ PREVIEW</p>

              <h1>{title}</h1>

              <small className="question-count">
                {questions.length} questions detected
              </small>
            </div>

            <button
              className="edit-button"
              onClick={() =>
                setShowPreview(false)
              }
            >
              ← Edit
            </button>
          </div>

          <div className="quiz-settings-preview">
            <div>
              <span>STARTS</span>

              <strong>
                {new Date(
                  `${availableFromDate}T${availableFromTime}`
                ).toLocaleString()}
              </strong>
            </div>

            <div>
              <span>ENDS</span>

              <strong>
                {new Date(
                  `${availableUntilDate}T${availableUntilTime}`
                ).toLocaleString()}
              </strong>
            </div>

            <div>
              <span>TIME LIMIT</span>

              <strong>
                {timeLimit} minutes
              </strong>
            </div>
          </div>

          {questions.map(
            (question, index) => (
              <div
                className="question-card"
                key={index}
              >
                <div className="question-number">
                  QUESTION{" "}
                  {String(index + 1).padStart(
                    2,
                    "0"
                  )}
                </div>

                <div className="question-text-preview">
                  {question.question
                    .split(/(\$\$[\s\S]*?\$\$)/g)
                    .map((part, partIndex) => {
                      const isCodeBlock =
                        /^\$\$[\s\S]*\$\$$/.test(
                          part
                        );

                      if (isCodeBlock) {
                        return (
                          <pre
                            key={partIndex}
                            className="quiz-code-block"
                          >
                            <code>
                              {part
                                .slice(2, -2)
                                .trim()}
                            </code>
                          </pre>
                        );
                      }

                      return (
                        <span
                          key={partIndex}
                          style={{
                            whiteSpace:
                              "pre-wrap",
                          }}
                        >
                          {part}
                        </span>
                      );
                    })}
                </div>

                <div className="options">
                  {question.options.map(
                    (
                      option,
                      optionIndex
                    ) => (
                      <div
                        key={optionIndex}
                      >
                        <span className="option-letter">
                          {String.fromCharCode(
                            65 +
                              optionIndex
                          )}
                        </span>

                        {option}
                      </div>
                    )
                  )}
                </div>

                <div className="answer-preview">
                  ✓ Correct Answer:{" "}
                  {question.correctAnswer}
                </div>
              </div>
            )
          )}

          <button
            className="create-final-button"
            onClick={handleCreateQuiz}
          >
            Create Quiz →
          </button>
        </div>
      </main>
    </div>
  );
}

export default CreateQuiz;
