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

  const navigate = useNavigate();

  // =========================
  // PARSE QUESTIONS
  // =========================

 
const parseQuestions = () => {
  if (!title.trim()) {
    alert("Please enter a quiz title.");
    return;
  }

  if (!content.trim()) {
    alert("Please paste your questions.");
    return;
  }

  // Remove Markdown formatting
  const cleanedContent = content
    .replace(/\*\*/g, "")
    .replace(/^#+\s*/gm, "")
    .trim();

  // =====================================================
  // SPLIT QUESTIONS
  // Supports:
  // 1. Question
  // 2. Question
  // 3. Question
  //
  // Also supports:
  // Q1. Question
  // Q2. Question
  // =====================================================

  const blocks = cleanedContent
    .split(/(?=^(?:Q\d+|\d+)\s*[.):\-]\s*)/im)
    .map((block) => block.trim())
    .filter(Boolean);

  const parsedQuestions = blocks.map((block) => {
    const lines = block
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    // =====================================================
    // QUESTION
    // =====================================================

    const question = lines[0]
      .replace(/^(?:Q\d+|\d+)\s*[.):\-]\s*/i, "")
      .trim();

    // =====================================================
    // OPTIONS
    // Supports:
    // A Monitor
    // A) Monitor
    // A. Monitor
    // A: Monitor
    // A - Monitor
    // =====================================================
const optionLines = lines.filter((line) =>
  /^[A-D](?:[.):\-]\s+|\s+)(?!nswer\b).+/i.test(line)
);

    const options = optionLines.map((line) =>
      line
        .replace(/^[A-D]\s*(?:[.):\-])?\s*/i, "")
        .trim()
    );

    // =====================================================
    // CORRECT ANSWER
    // Supports:
    // Answer: B
    // Correct Answer: B
    // Correct: B
    // ✓ Correct Answer: B
    // =====================================================

    const answerLine = lines.find((line) =>
      /^(?:✓\s*)?(?:answer|correct answer|correct)\s*:/i.test(line)
    );

    const correctAnswer = answerLine
      ? answerLine
          .replace(
            /^(?:✓\s*)?(?:answer|correct answer|correct)\s*:\s*/i,
            ""
          )
          .trim()
      : "";

    return {
      question,
      options,
      correctAnswer,
    };
  });

  // =====================================================
  // CHECK QUESTIONS
  // =====================================================

  if (parsedQuestions.length === 0) {
    alert(
      "No questions detected. Please use 1., 2., 3. or Q1., Q2., Q3. format."
    );
    return;
  }

  // =====================================================
  // CHECK ANSWERS
  // =====================================================

  const questionsWithoutAnswers = parsedQuestions.filter(
    (question) => !question.correctAnswer.trim()
  );

  if (questionsWithoutAnswers.length > 0) {
    alert(
      "Every quiz question must have a correct answer. Please add answers and preview again."
    );
    return;
  }

  // =====================================================
  // CHECK OPTIONS
  // =====================================================

  const questionsWithoutOptions = parsedQuestions.filter(
    (question) => question.options.length < 2
  );

  if (questionsWithoutOptions.length > 0) {
    alert(
      "Every quiz question must have at least 2 options."
    );
    return;
  }

  // =====================================================
  // SAVE QUESTIONS
  // =====================================================

  setQuestions(parsedQuestions);
  setShowPreview(true);
};


  // =========================
  // CREATE QUIZ
  // =========================

  const handleCreateQuiz = async () => {
    try {
      // =========================
      // CHECK LOGIN
      // =========================

      const token = localStorage.getItem("token");

      if (!token) {
        alert("Please login first.");
        return;
      }

      // =========================
      // CHECK SETTINGS
      // =========================

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

      // =========================
      // CHECK TIME LIMIT
      // =========================

      if (Number(timeLimit) < 1) {
        alert("Time limit must be at least 1 minute.");
        return;
      }

      // =========================
      // CHECK DATE/TIME
      // =========================

      const startTime = new Date(
  `${availableFromDate}T${availableFromTime}`
);

const endTime = new Date(
  `${availableUntilDate}T${availableUntilTime}`
);

// Check date and time
if (
  !availableFromDate ||
  !availableFromTime ||
  !availableUntilDate ||
  !availableUntilTime
) {
  alert("Please select both date and time.");
  return;
}

if (endTime <= startTime) {
  alert("Quiz end time must be after start time.");
  return;
}

      // =========================
      // GENERATE QUIZ CODE
      // =========================

      const code =
        "SQ" + Math.floor(1000 + Math.random() * 9000);

      // =========================
      // QUIZ DATA
      // =========================

      const quizData = {
        title: title.trim(),
        questions,
        quizCode: code,

        availableFrom: startTime.toISOString(),
        availableUntil: endTime.toISOString(),

        timeLimit: Number(timeLimit),
      };

      // =========================
      // SEND TO BACKEND
      // =========================

      await axios.post(
        "https://saiquiz-backend.onrender.com/api/quizzes",
        quizData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // =========================
      // SUCCESS
      // =========================

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
        alert(
          "Only teachers can create quizzes."
        );
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

  // =========================
  // FORMAT DATE & TIME
  // =========================

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

  // =========================
  // MESSAGE TO SEND
  // =========================

  const quizMessage = `Students, please attend the quiz.

Quiz Name: ${title}
Quiz Code: ${quizCode}

Available From: ${formattedStart}
Available Until: ${formattedEnd}
Time Limit: ${timeLimit} minutes

Attend Quiz: https://saiquiz.vercel.app/join`;

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

          {/* SUCCESS ICON */}

          <div className="success-icon">
            ✓
          </div>


          {/* TITLE */}

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


          {/* =========================
              QUIZ CODE
          ========================= */}

          <div className="code-card">

            <span>
              QUIZ CODE
            </span>

            <strong>
              {quizCode}
            </strong>

          </div>


          {/* =========================
              MESSAGE PREVIEW
          ========================= */}

          <div className="message-preview">

            <div className="message-preview-header">

              <span>
                MESSAGE PREVIEW
              </span>

              <small>
                Preview
              </small>

            </div>


            <div className="message-preview-content">

              <p>
                Students, please attend the quiz.
              </p>

              <div className="message-details">

                <div>
                  <span>
                    Quiz Name
                  </span>

                  <strong>
                    {title}
                  </strong>
                </div>


                <div>
                  <span>
                    Quiz Code
                  </span>

                  <strong>
                    {quizCode}
                  </strong>
                </div>


                <div>
                  <span>
                    Available From
                  </span>

                  <strong>
                    {formattedStart}
                  </strong>
                </div>


                <div>
                  <span>
                    Available Until
                  </span>

                  <strong>
                    {formattedEnd}
                  </strong>
                </div>


                <div>
                  <span>
                    Time Limit
                  </span>

                  <strong>
                    {timeLimit} minutes
                  </strong>
                </div>

              </div>


              <div className="message-link">

                <span>
                  Attend Quiz
                </span>

                <strong>
    https://saiquiz.vercel.app/join
  </strong>

              </div>

            </div>

          </div>


          {/* =========================
              COPY MESSAGE
          ========================= */}

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

            <p>
              CREATE QUIZ
            </p>

            <h1>
              Build your quiz
              <span> in seconds.</span>
            </h1>

            <div className="create-description">
              Paste your questions all at once.
              SimpleQuiz will organize them into
              individual questions.
            </div>

          </div>

          <div className="quiz-form">

            {/* =========================
                TITLE
            ========================= */}

            <div className="input-section">

              <label>
                Quiz Title
              </label>

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
                QUESTIONS
            ========================= */}

            <div className="input-section">

              <div className="label-row">

                <label>
                  Questions
                </label>

                <span>
                  Bulk import
                </span>

              </div>
              
<div className="question-help">

  <strong>
    Need help formatting your questions?
  </strong>

  <p>
    Copy the prompt below, paste it into ChatGPT,
    and then paste the formatted questions here.
  </p>

  <button
    type="button"
    onClick={() => {
      navigator.clipboard.writeText(`Create quiz questions for SimpleQuiz.

IMPORTANT: The output format MUST be followed STRICTLY.

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
1. Start every question with Q1., Q2., Q3., Q4., etc.
2. Use exactly four options for every question.
3. Options MUST be written as A., B., C., D.
4. EACH option MUST be on its OWN separate line.
5. There MUST be a line break after A. option, B. option, and C. option.
6. NEVER place two or more options on the same line.
7. NEVER write options continuously on one line such as:
   A. Option 1 B. Option 2 C. Option 3 D. Option 4
8. The correct answer MUST be written exactly as Answer: A, Answer: B, Answer: C, or Answer: D.
9. Leave ONE blank line between the last option and the Answer line.
10. Leave ONE blank line between the Answer line and the next question.
11. Do NOT use other formats such as 1), a), i), I), (A), etc.
12. Do NOT add explanations, solutions, headings, or extra text.
13. Every question MUST have one correct answer.
14. The final output MUST contain only the quiz questions in this exact format.
15. Preserve the exact line-by-line structure shown in the example above.
16. Do NOT combine, merge, or rearrange any question or option lines.

FINAL CHECK BEFORE RESPONDING:
Make sure every question has exactly four options, each option is on a separate line, and the Answer line is separated by a blank line. Output ONLY the quiz in the required format.`);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }}
  >
    {copied ? "✓ Copied!" : "Copy ChatGPT Prompt"}
  </button>

</div>


<label className="questions-paste-label">
  Paste your formatted questions here
</label>
              <textarea
                placeholder={`Paste your questions here...

Example:

Q1. What is Java?

A. Programming Language
B. Database
C. Browser
D. Operating System

Answer: A

Q2. What is React?

A. Library
B. Database
C. Programming Language
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
                <p>
                  QUIZ SETTINGS
                </p>

                <span>
                  Set when students can attend
                </span>
              </div>
{/* START TIME */}

<div className="input-section">

  <label>
    Available From
  </label>

  <input
    type="date"
    value={availableFromDate}
    onChange={(e) =>
      setAvailableFromDate(e.target.value)
    }
  />

  <select
  value={availableFromTime}
  onChange={(e) =>
    setAvailableFromTime(e.target.value)
  }
>
  <option value="">Select time</option>

  {Array.from({ length: 24 }, (_, hour) => {
    const value = `${String(hour).padStart(2, "0")}:00`;

    const displayHour =
      hour === 0
        ? 12
        : hour > 12
        ? hour - 12
        : hour;

    const period = hour < 12 ? "AM" : "PM";

    return (
      <option key={value} value={value}>
        {displayHour}:00 {period}
      </option>
    );
  })}
</select>

</div>


{/* END TIME */}

<div className="input-section">

  <label>
    Available Until
  </label>

  <input
    type="date"
    value={availableUntilDate}
    onChange={(e) =>
      setAvailableUntilDate(e.target.value)
    }
  />
<select
  value={availableUntilTime}
  onChange={(e) =>
    setAvailableUntilTime(e.target.value)
  }
>
  <option value="">Select time</option>

  {Array.from({ length: 24 }, (_, hour) => {
    const value = `${String(hour).padStart(2, "0")}:00`;

    const displayHour =
      hour === 0
        ? 12
        : hour > 12
        ? hour - 12
        : hour;

    const period = hour < 12 ? "AM" : "PM";

    return (
      <option key={value} value={value}>
        {displayHour}:00 {period}
      </option>
    );
  })}
</select>

</div>

              {/* TIMER */}

              <div className="input-section">

                <label>
                  Time Limit
                </label>

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

                  <span>
                    minutes
                  </span>

                </div>

              </div>

            </div>

            {/* =========================
                TIP
            ========================= */}

            <div className="tip-box">

              <span>💡</span>

              <div>

                <strong>
                  Quick tip
                </strong>

                <p>
                  Copy an entire question set
                  from ChatGPT and paste it here.
                </p>

              </div>

            </div>

            {/* =========================
                PREVIEW BUTTON
            ========================= */}

            <button
              className="preview-button"
              onClick={parseQuestions}
            >
              Preview Questions

              <span>
                →
              </span>

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

              <p>
                QUIZ PREVIEW
              </p>

              <h1>
                {title}
              </h1>

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

          {/* =========================
              SETTINGS PREVIEW
          ========================= */}

          <div className="quiz-settings-preview">

            <div>
              <span>
                STARTS
              </span>

              <strong>
  {new Date(
    `${availableFromDate}T${availableFromTime}`
  ).toLocaleString()}
</strong>
            </div>

            <div>
              <span>
                ENDS
              </span>

              <strong>
  {new Date(
    `${availableUntilDate}T${availableUntilTime}`
  ).toLocaleString()}
</strong>
            </div>

            <div>
              <span>
                TIME LIMIT
              </span>

              <strong>
                {timeLimit} minutes
              </strong>
            </div>

          </div>

          {/* =========================
              QUESTIONS
          ========================= */}

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

                <h2>
                  {question.question}
                </h2>

                <div className="options">

                  {question.options.map(
                    (option, optionIndex) => (

                      <div
                        key={optionIndex}
                      >

                        <span className="option-letter">
                          {String.fromCharCode(
                            65 + optionIndex
                          )}
                        </span>

                        {option}

                      </div>

                    )
                  )}

                </div>

                {/* CORRECT ANSWER */}

                <div className="answer-preview">

                  ✓ Correct Answer:{" "}
                  {question.correctAnswer}

                </div>

              </div>

            )
          )}

          {/* =========================
              CREATE QUIZ
          ========================= */}

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

