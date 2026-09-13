import saiquizLogo from "./assets/saiquiz-logo.jpeg";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("user")
  );

  const [quizzes, setQuizzes] = useState([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);

  if (!user) {
    navigate("/login");
    return null;
  }

  const isTeacher = user.role === "teacher";

  // =========================
  // LOAD TEACHER QUIZZES
  // =========================

  useEffect(() => {
    if (!isTeacher) return;

    const fetchMyQuizzes = async () => {
      try {
        setLoadingQuizzes(true);

        const token = localStorage.getItem("token");

       const response = await fetch(
  "https://saiquiz-backend.onrender.com/api/teacher/quizzes",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load quizzes"
          );
        }

        setQuizzes(data.quizzes || []);
      } catch (error) {
        console.error("Error loading quizzes:", error);
      } finally {
        setLoadingQuizzes(false);
      }
    };

    fetchMyQuizzes();
  }, [isTeacher]);

  // =========================
  // COPY QUIZ CODE
  // =========================

  const copyQuizCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      alert("Quiz code copied!");
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  // =========================
  // DELETE QUIZ
  // =========================

  const deleteQuiz = async (quizId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this quiz?"
    );

    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `https://saiquiz-backend.onrender.com/api/quizzes/${quizId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete quiz"
        );
      }

      // Remove quiz from screen immediately
      setQuizzes((prev) =>
        prev.filter((quiz) => quiz._id !== quizId)
      );

      alert("Quiz deleted successfully!");
    } catch (error) {
      console.error("Delete error:", error);
      alert(error.message);
    }
  };

  // =========================
  // QUIZ STATUS
  // =========================

  const getQuizStatus = (quiz) => {
    const now = new Date();

    const start = new Date(quiz.availableFrom);
    const end = new Date(quiz.availableUntil);

    if (now < start) {
      return {
        text: "Upcoming",
        className: "quiz-status upcoming",
      };
    }

    if (now >= start && now <= end) {
      return {
        text: "Active",
        className: "quiz-status active",
      };
    }

    return {
      text: "Expired",
      className: "quiz-status expired",
    };
  };

  return (
    <div className="dashboard-page">

      {/* =========================
          HEADER
      ========================= */}

      <header className="dashboard-header">

        <div className="dashboard-logo">
          <img
            src={saiquizLogo}
            alt="SimpleQuiz"
            className="dashboard-logo-image"
          />

          <span>SimpleQuiz</span>
        </div>

        <button
          className="logout-button"
          onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            navigate("/login");
          }}
        >
          Logout
        </button>

      </header>


      {/* =========================
          MAIN
      ========================= */}

      <main className="dashboard-container">

        <p className="dashboard-label">
          {isTeacher
            ? "TEACHER DASHBOARD"
            : "STUDENT DASHBOARD"}
        </p>

        <h1>
          Welcome, {user.name}
        </h1>

        <p className="dashboard-description">
          {isTeacher
            ? "Create quizzes and manage your students."
            : "Join quizzes and view your results."}
        </p>


        {/* =========================
            MAIN DASHBOARD CARDS
        ========================= */}

        <div className="dashboard-grid">

          {isTeacher ? (
            <>
              <div
                className="dashboard-card"
                onClick={() => navigate("/create")}
              >
                <div className="dashboard-icon">
                  +
                </div>

                <h2>Create Quiz</h2>

                <p>
                  Create a new quiz and share the code
                  with your students.
                </p>

                <span>
                  Create →
                </span>
              </div>


              <div
                className="dashboard-card"
                onClick={() =>
                  navigate("/student-results")
                }
              >
                <div className="dashboard-icon">
                  📊
                </div>

                <h2>Student Results</h2>

                <p>
                  View student submissions and marks.
                </p>

                <span>
                  View Results →
                </span>
              </div>
            </>
          ) : (
            <>
              <div
                className="dashboard-card"
                onClick={() => navigate("/join")}
              >
                <div className="dashboard-icon">
                  →
                </div>

                <h2>Join Quiz</h2>

                <p>
                  Enter your teacher's quiz code
                  and start answering.
                </p>

                <span>
                  Join →
                </span>
              </div>


              <div
                className="dashboard-card"
                onClick={() => navigate("/results")}
              >
                <div className="dashboard-icon">
                  📈
                </div>

                <h2>My Results</h2>

                <p>
                  View the quizzes you have attended
                  and your marks.
                </p>

                <span>
                  View Results →
                </span>
              </div>
            </>
          )}

        </div>


        {/* =========================
            MY QUIZZES
        ========================= */}

        {isTeacher && (
          <section className="my-quizzes-section">

            <div className="my-quizzes-header">
              <div>
                <p className="dashboard-label">
                  QUIZ MANAGEMENT
                </p>

                <h2>
                  My Quizzes
                </h2>
              </div>

              <span className="quiz-count">
                {quizzes.length} quiz
                {quizzes.length !== 1 ? "zes" : ""}
              </span>
            </div>


            {loadingQuizzes ? (
              <p className="quiz-loading">
                Loading your quizzes...
              </p>
            ) : quizzes.length === 0 ? (
              <div className="empty-quizzes">
                <h3>
                  No quizzes yet
                </h3>

                <p>
                  Create your first quiz to see it here.
                </p>

                <button
                  onClick={() => navigate("/create")}
                >
                  Create Quiz
                </button>
              </div>
            ) : (
              <div className="my-quizzes-list">

                {quizzes.map((quiz) => {
                  const status =
                    getQuizStatus(quiz);

                  return (
                    <div
                      className="my-quiz-card"
                      key={quiz._id}
                    >

                      <div className="my-quiz-main">

                        <div>
                          <div className="quiz-title-row">

                            <h3>
                              {quiz.title}
                            </h3>

                            <span
                              className={status.className}
                            >
                              {status.text}
                            </span>

                          </div>

                          <p className="quiz-meta">
                            {quiz.questionCount} questions
                            {" • "}
                            {quiz.timeLimit} min
                          </p>
                        </div>


                        <div className="quiz-code-box">

                          <span>
                            Quiz Code
                          </span>

                          <strong>
                            {quiz.quizCode}
                          </strong>

                          <button
                            onClick={() =>
                              copyQuizCode(
                                quiz.quizCode
                              )
                            }
                          >
                            Copy
                          </button>

                        </div>

                      </div>


                      <div className="my-quiz-bottom">

                        <div className="quiz-stat">

                          <strong>
                            {quiz.submissionCount}
                          </strong>

                          <span>
                            Students submitted
                          </span>

                        </div>


                        <div className="quiz-actions">

                          <button
                            className="view-results-button"
                            onClick={() =>
                              navigate(
                                "/student-results"
                              )
                            }
                          >
                            View Results
                          </button>

                          <button
                            className="delete-quiz-button"
                            onClick={() =>
                              deleteQuiz(
                                quiz._id
                              )
                            }
                          >
                            Delete
                          </button>

                        </div>

                      </div>

                    </div>
                  );
                })}

              </div>
            )}

          </section>
        )}

      </main>

    </div>
  );
}

export default Dashboard;
