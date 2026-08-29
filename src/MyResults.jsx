import saiquizLogo from "./assets/saiquiz-logo.jpeg";
import { useEffect, useState } from "react";
import axios from "axios";
import "./MyResults.css";

function MyResults() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

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
      alert("Unable to load your results.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="results-page">

      <header className="results-header">

        <div className="logo">
  <div className="results-logo">
  <img
    src={saiquizLogo}
    alt="SaiQuiz"
    className="results-logo-image"
  />

  <span>SaiQuiz</span>
</div>
</div>

      </header>

      <main className="results-container">

        <p className="results-label">
          STUDENT
        </p>

        <h1>
          My Results
        </h1>

        <p className="results-description">
          View the quizzes you have attended and your scores.
        </p>

        {loading ? (
          <div className="results-message">
            Loading results...
          </div>
        ) : submissions.length === 0 ? (
          <div className="results-empty">
            <h2>No quizzes yet</h2>

            <p>
              Your completed quizzes will appear here.
            </p>
          </div>
        ) : (
          <div className="results-list">

            {submissions.map((submission) => {

              const percentage = Math.round(
                (submission.score /
                  submission.totalQuestions) *
                  100
              );

              return (
                <div
                  className="result-item"
                  key={submission._id}
                >

                  <div className="result-info">

                    <h2>
                      {submission.quizId?.title ||
                        "Quiz"}
                    </h2>

                    <p>
                      Code:{" "}
                      {submission.quizId?.quizCode ||
                        "—"}
                    </p>

                    <small>
                      Submitted:{" "}
                      {new Date(
                        submission.submittedAt
                      ).toLocaleString()}
                    </small>

                  </div>

                  <div className="result-score">

                    <strong>
                      {submission.score}
                      {" / "}
                      {submission.totalQuestions}
                    </strong>

                    <span>
                      {percentage}%
                    </span>

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

export default MyResults;

