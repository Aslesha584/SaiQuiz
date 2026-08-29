import { useEffect, useState } from "react";
import axios from "axios";

function TeacherResults() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

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

      setSubmissions(response.data.submissions);
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

  if (loading) {
    return <h2>Loading student results...</h2>;
  }

  return (
    <div style={{ padding: "30px" }}>
      <h1>Student Results</h1>

      <p>
        View results submitted by students for your quizzes.
      </p>

      {submissions.length === 0 ? (
        <h3>No student submissions yet.</h3>
      ) : (
        submissions.map((submission) => (
          <div
            key={submission._id}
            style={{
              border: "1px solid #ddd",
              padding: "20px",
              marginTop: "15px",
              borderRadius: "10px",
            }}
          >
            <h2>
              {submission.studentId?.name || "Student"}
            </h2>

            <p>
              Quiz:{" "}
              {submission.quizId?.title || "Quiz"}
            </p>

            <p>
              Score: {submission.score} /{" "}
              {submission.totalQuestions}
            </p>

            <p>
              Submitted:{" "}
              {new Date(
                submission.submittedAt
              ).toLocaleString()}
            </p>
          </div>
        ))
      )}
    </div>
  );
}

export default TeacherResults;