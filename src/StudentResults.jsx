import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./StudentResults.css";
import saiquizLogo from "./assets/saiquiz-logo.jpeg";
function StudentResults() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.get(
        "https://saiquiz-backend.onrender.com/api/submissions/student",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSubmissions(response.data.submissions);

    } catch (error) {
      console.error("Error loading results:", error);
      alert("Unable to load student results.");

    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="student-results-page">

    <header className="student-results-header">

      <div className="logo">
  <img
    src={saiquizLogo}
    alt="SaiQuiz"
    className="logo-image"
  />
</div>

      <button
        className="results-back-button"
        onClick={() => navigate("/dashboard")}
      >
        ← Dashboard
      </button>

    </header>

    <main className="student-results-container">

      <div className="results-heading">
        <div>
          <p className="results-label">
  STUDENT DASHBOARD
</p>

          <h1>My Results</h1>

          <p>
           View your quiz submissions and performance.
          </p>
        </div>

        <div className="submission-count">
          <strong>{submissions.length}</strong>
          <span>Submissions</span>
        </div>
      </div>


      {loading ? (
        <div className="results-message">
          Loading results...
        </div>
      ) : submissions.length === 0 ? (

        <div className="results-empty">
          <div className="empty-icon">📊</div>

          <h2>No submissions yet</h2>

          <p>
            Student results will appear here after they complete a quiz.
          </p>
        </div>

      ) : (

        <div className="student-results-list">

          {submissions.map((submission) => {

            const percentage = Math.round(
              (submission.score /
                submission.totalQuestions) *
                100
            );

            return (

              <div
                className="student-result-card"
                key={submission._id}
              >

                <div className="student-result-main">

                  <div className="student-avatar">
                    {submission.studentId?.name
                      ?.charAt(0)
                      ?.toUpperCase() || "S"}
                  </div>

                  <div className="student-info">

                    <h2>
                      {submission.studentId?.name ||
                        "Student"}
                    </h2>

                    <p>
                      {submission.quizId?.title ||
                        "Quiz"}
                    </p>

                    <small>
                      Submitted{" "}
                      {new Date(
                        submission.submittedAt
                      ).toLocaleString()}
                    </small>

                  </div>

                </div>


                <div className="student-result-score">

                  <strong>
                    {submission.score}
                    <span>
                      {" / "}
                      {submission.totalQuestions}
                    </span>
                  </strong>

                  <div
                    className={`percentage ${
                      percentage >= 70
                        ? "good"
                        : percentage >= 40
                        ? "average"
                        : "low"
                    }`}
                  >
                    {percentage}%
                  </div>

                </div>

              </div>

            );

          })}

        </div>

      )}

    </main>

  </div>
);
}

export default StudentResults;