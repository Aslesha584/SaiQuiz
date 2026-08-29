import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./JoinQuiz.css";
import saiquizLogo from "../assets/saiquiz-logo.jpeg";
function JoinQuiz() {
  const [quizCode, setQuizCode] = useState("");
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [totalQuestions, setTotalQuestions] = useState(0);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [startedAt, setStartedAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [timeUpHandled, setTimeUpHandled] = useState(false);
  const navigate = useNavigate();

  // =========================
  // JOIN QUIZ
  // =========================

  const handleJoinQuiz = async () => {
    if (!quizCode.trim()) {
      alert("Please enter a quiz code.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login as a student first.");
      window.location.href = "/login";
      return;
    }

    const user = JSON.parse(
      localStorage.getItem("user")
    );

    // Teacher cannot attend quiz
    if (!user || user.role !== "student") {
      alert("Only students can attend quizzes.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.get(
        `https://saiquiz-backend.onrender.com/api/quizzes/${quizCode
          .trim()
          .toUpperCase()}`
      );

      const quizData = response.data;

      // Check availability
      const now = new Date();
      const startTime = new Date(
        quizData.availableFrom
      );
      const endTime = new Date(
        quizData.availableUntil
      );

      if (now < startTime) {
        alert(
          `This quiz starts at ${startTime.toLocaleString()}.`
        );
        return;
      }

      if (now > endTime) {
        alert("This quiz has already ended.");
        return;
      }

      // Start quiz
      const start = new Date();

      setQuiz(quizData);
      setScore(null);
      setAnswers({});
      setTimeUpHandled(false);
      setTotalQuestions(
        quizData.questions.length
      );

      setStartedAt(start.toISOString());

      // Teacher-defined timer
      const timerSeconds =
        Number(quizData.timeLimit) * 60;

      setTimeLeft(timerSeconds);

    } catch (error) {
      console.error("Error joining quiz:", error);

      if (error.response?.status === 404) {
        alert(
          "Quiz not found. Please check the code."
        );
      } else if (error.response?.status === 401) {
        alert("Please login again.");
      } else {
        alert(
          error.response?.data?.message ||
            "Unable to join quiz."
        );
      }
    } finally {
      setLoading(false);
    }
  };
  //timer
  useEffect(() => {
  if (
    !quiz ||
    timeLeft === null ||
    submitting ||
    timeUpHandled
  ) {
    return;
  }

  if (timeLeft === 0) {
    setTimeUpHandled(true);
    handleSubmitQuiz(true);
    return;
  }

  const timer = setTimeout(() => {
    setTimeLeft(
      (previousTime) => previousTime - 1
    );
  }, 1000);

  return () => clearTimeout(timer);
}, [
  quiz,
  timeLeft,
  submitting,
  timeUpHandled
]);

  // =========================
  // FORMAT TIMER
  // =========================

  const formatTime = (seconds) => {
    if (seconds === null) {
      return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(
      2,
      "0"
    )}:${String(remainingSeconds).padStart(
      2,
      "0"
    )}`;
  };

  // =========================
  // SELECT ANSWER
  // =========================

  const handleAnswerChange = (
    questionIndex,
    answer
  ) => {
    setAnswers((previousAnswers) => ({
      ...previousAnswers,
      [questionIndex]: answer,
    }));
  };
// =========================
// SUBMIT QUIZ
// =========================

const handleSubmitQuiz = async (automatic = false) => {
  if (!quiz || submitting) {
    return;
  }

  const token = localStorage.getItem("token");

  if (!token) {
    alert("Please login again.");
    return;
  }

  try {
    setSubmitting(true);

    const submittedAnswers = quiz.questions.map(
      (question, index) => ({
        questionId: question._id,
        answer: answers[index] || "",
      })
    );

    const response = await axios.post(
      `https://saiquiz-backend.onrender.com/api/quizzes/${quiz._id}/submit`,
      {
        answers: submittedAnswers,
        startedAt: startedAt,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // Save result
    setScore(response.data.result.score);
    setTotalQuestions(
      response.data.result.totalQuestions
    );

    // Stop timer
    setTimeLeft(0);

    // =========================
    // AUTOMATIC SUBMISSION
    // =========================

    if (automatic) {
      alert(
        "Time is up! Your quiz has been submitted successfully."
      );

      // Go directly to dashboard after OK
      navigate("/dashboard");

      return;
    }

    // =========================
    // MANUAL SUBMISSION
    // =========================

    alert("Quiz submitted successfully.");

    navigate("/dashboard");

  } catch (error) {
    console.error(
      "Error submitting quiz:",
      error
    );

    if (error.response?.status === 401) {
      alert("Please login again.");
    } else if (error.response?.status === 403) {
      alert("Only students can submit quizzes.");
    } else if (error.response?.status === 400) {
      alert(
        error.response?.data?.message ||
          "Unable to submit quiz."
      );
    } else {
      alert(
        error.response?.data?.message ||
          "Failed to submit quiz."
      );
    }

    setSubmitting(false);
  }
};
  // =========================
  // RESULT PAGE
  // =========================

  if (score !== null) {
    return (
      <div className="join-page">

        <div className="result-card">

          <div className="result-icon">
            ✓
          </div>

          <p className="result-label">
            QUIZ COMPLETED
          </p>

          <h1>
            {score} / {totalQuestions}
          </h1>

          <p className="result-text">
            Your result has been submitted successfully.
          </p>

          <button
            className="join-button"
            onClick={() => {
              setQuiz(null);
              setScore(null);
              setQuizCode("");
              setAnswers({});
              setStartedAt(null);
              setTotalQuestions(0);
              setTimeLeft(null);
              setSubmitting(false);
              setTimeUpHandled(false);
            }}
          >
            Join Another Quiz
          </button>

        </div>

      </div>
    );
  }

  // =========================
  // QUIZ PAGE
  // =========================

  if (quiz) {
    return (
      <div className="join-page">

        <header className="quiz-header">

          <div className="logo">
  <img
    src={saiquizLogo}
    alt="SaiQuiz"
    className="logo-image"
  />
</div>

          <div className="quiz-header-right">

            <div className="quiz-code-display">
              {quiz.quizCode}
            </div>

            <div
              className={`quiz-timer ${
                timeLeft <= 60
                  ? "timer-warning"
                  : ""
              }`}
            >
              ⏱ {formatTime(timeLeft)}
            </div>

          </div>

        </header>

        <main className="student-quiz-container">

          <div className="quiz-title-section">

            <p>
              QUIZ
            </p>

            <h1>
              {quiz.title}
            </h1>

            <span>
              {quiz.questions.length} questions
            </span>

          </div>

          {quiz.questions.map(
            (question, index) => (

              <div
                className="student-question-card"
                key={
                  question._id || index
                }
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

                <div className="student-options">

                  {question.options.map(
                    (option, optionIndex) => {

                      const letter =
                        String.fromCharCode(
                          65 + optionIndex
                        );

                      return (
                        <label
                          className={`student-option ${
                            answers[index] ===
                            letter
                              ? "selected"
                              : ""
                          }`}
                          key={optionIndex}
                        >

                          <input
                            type="radio"
                            name={`question-${index}`}
                            value={letter}
                            checked={
                              answers[index] ===
                              letter
                            }
                            onChange={() =>
                              handleAnswerChange(
                                index,
                                letter
                              )
                            }
                          />

                          <span className="option-letter">
                            {letter}
                          </span>

                          <span>
                            {option}
                          </span>

                        </label>
                      );
                    }
                  )}

                </div>

              </div>
            )
          )}

          <button
            className="submit-quiz-button"
            onClick={() =>
              handleSubmitQuiz(false)
            }
            disabled={submitting}
          >
            {submitting
              ? "Submitting..."
              : "Submit Quiz →"}
          </button>

        </main>

      </div>
    );
  }

  // =========================
  // JOIN PAGE
  // =========================

  return (
    <div className="join-page">

      <header className="quiz-header">

        <div className="logo">
  <img
    src={saiquizLogo}
    alt="SaiQuiz"
    className="logo-image"
  />
</div>

      </header>

      <main className="join-container">

        <div className="join-card">

          

          <p className="join-label">
            STUDENT ACCESS
          </p>

          <h1>
            Join a Quiz
          </h1>

          <p className="join-description">
            Enter the quiz code shared by your
            teacher to get started.
          </p>

          <input
            className="quiz-code-input"
            type="text"
            placeholder="Enter quiz code"
            value={quizCode}
            maxLength={6}
            onChange={(e) =>
              setQuizCode(
                e.target.value.toUpperCase()
              )
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleJoinQuiz();
              }
            }}
          />

          <button
            className="join-button"
            onClick={handleJoinQuiz}
            disabled={loading}
          >
            {loading
              ? "Joining..."
              : "Join Quiz →"}
          </button>

          <p className="join-note">
            Example: SQ4188
          </p>

        </div>

      </main>

    </div>
  );
}

export default JoinQuiz;
