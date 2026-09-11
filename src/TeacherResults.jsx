
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./TeacherResults.css";
import saiquizLogo from "./assets/saiquiz-logo.jpeg";

function TeacherResults() {
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
        "https://saiquiz-backend.onrender.com/api/submissions/teacher",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSubmissions(response.data.submissions || []);
    } catch (error) {
      console.error("Teacher results error:", error);

      alert(
        error.response?.data?.message ||
          "Unable to load student results."
      );
    } finally {
      setLoading(false);
    }
  };

  // Group submissions by quiz
  const groupedResults = submissions.reduce((groups, submission) => {
    const quizId = submission.quizId?._id;

    if (!quizId) return groups;

    if (!groups[quizId]) {
      groups[quizId] = {
        title: submission.quizId?.title || "Quiz",
        quizCode: submission.quizId?.quizCode || "",
        submissions: [],
      };
    }

    groups[quizId].submissions.push(submission);

    return groups;
  }, {});

  return (
    <div className="teacher-results-page">

      {/* HEADER */}
      <header className="teacher-results-header">

        <div className="teacher-results-logo">
          <img
            src={saiquizLogo}
            alt="SimpleQuiz"
          />

          <span>SimpleQuiz</span>
        </div>

        <button
          className="teacher-results-back"
          onClick={() => navigate("/dashboard")}
        >
          ← Dashboard
        </button>

      </header>


      {/* MAIN */}
      <main className="teacher-results-container">

        <div className="teacher-results-heading">

          <div>
            <p className="teacher-results-label">
              TEACHER DASHBOARD
            </p>

            <h1>Student Results</h1>

            <p>
              View results submitted by students for your quizzes.
            </p>
          </div>

          <div className="teacher-results-count">
            <strong>{submissions.length}</strong>
            <span>Submissions</span>
          </div>

        </div>


        {/* LOADING */}
        {loading ? (

          <div className="teacher-results-loading">
            <div className="loading-spinner"></div>
            <p>Loading results...</p>
          </div>

        ) : submissions.length === 0 ? (

          /* EMPTY */
          <div className="teacher-results-empty">

            <div className="teacher-empty-icon">
              📊
            </div>

            <h2>No student submissions yet</h2>

            <p>
              Results will appear here when students complete
              your quizzes.
            </p>

          </div>

        ) : (

          /* QUIZ GROUPS */
          <div className="teacher-results-quizzes">

            {Object.values(groupedResults).map((quiz) => (

              <section
                className="teacher-quiz-section"
                key={quiz.quizCode}
              >

                {/* QUIZ HEADER */}
                <div className="teacher-quiz-header">

                  <div>

                    <p className="teacher-quiz-label">
                      QUIZ
                    </p>

                    <h2>
                      {quiz.title}
                    </h2>

                  </div>

                  <div className="teacher-quiz-code">
                    Code: {quiz.quizCode}
                  </div>

                </div>


                {/* STUDENTS */}
                <div className="teacher-students-list">

                  {quiz.submissions.map((submission) => {

                    const percentage = Math.round(
                      (submission.score /
                        submission.totalQuestions) *
                        100
                    );

                    return (

                      <div
                        className="teacher-student-row"
                        key={submission._id}
                      >

                        <div className="teacher-student-info">

                          <div className="teacher-student-avatar">
                            {submission.studentId?.name
                              ?.charAt(0)
                              ?.toUpperCase() || "S"}
                          </div>

                          <div>

                            <h3>
                              {submission.studentId?.name ||
                                "Student"}
                            </h3>

                            <p>
                              {submission.studentId?.email ||
                                "Student"}
                            </p>

                          </div>

                        </div>


                        <div className="teacher-student-score">

                          <strong>
                            {submission.score}
                            <span>
                              {" / "}
                              {submission.totalQuestions}
                            </span>
                          </strong>

                          <span
                            className={`teacher-percentage ${
                              percentage >= 70
                                ? "good"
                                : percentage >= 40
                                ? "average"
                                : "low"
                            }`}
                          >
                            {percentage}%
                          </span>

                        </div>


                        <div className="teacher-submitted-time">

                          <span>
                            Submitted
                          </span>

                          <p>
                            {new Date(
                              submission.submittedAt
                            ).toLocaleString()}
                          </p>

                        </div>

                      </div>

                    );

                  })}

                </div>

              </section>

            ))}

          </div>

        )}

      </main>

    </div>
  );
}

export default TeacherResults;

