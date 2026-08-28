import saiquizLogo from "./assets/saiquiz-logo.jpeg";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("user")
  );

  if (!user) {
    navigate("/login");
    return null;
  }

  const isTeacher = user.role === "teacher";

  return (
    <div className="dashboard-page">

      <header className="dashboard-header">

       <div className="dashboard-logo">
  <img
    src={saiquizLogo}
    alt="SaiQuiz"
    className="dashboard-logo-image"
  />

  <span>SaiQuiz</span>
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

      <main className="dashboard-container">

        <p className="dashboard-label">
          {isTeacher ? "TEACHER DASHBOARD" : "STUDENT DASHBOARD"}
        </p>

        <h1>
          Welcome, {user.name} 
        </h1>

        <p className="dashboard-description">
          {isTeacher
            ? "Create quizzes and manage your students."
            : "Join quizzes and view your results."}
        </p>

        <div className="dashboard-grid">

          {isTeacher ? (
            <>
              <div
                className="dashboard-card"
                onClick={() => navigate("/create")}
              >
                <div className="dashboard-icon">+</div>

                <h2>Create Quiz</h2>

                <p>
                  Create a new quiz and share the code
                  with your students.
                </p>

                <span>Create →</span>
              </div>

            <div
  className="dashboard-card"
  onClick={() => navigate("/student-results")}
>
  <div className="dashboard-icon">📊</div>

  <h2>Student Results</h2>

  <p>
    View student submissions and marks.
  </p>

  <span>View Results →</span>
</div>
            </>
          ) : (
            <>
              <div
                className="dashboard-card"
                onClick={() => navigate("/join")}
              >
                <div className="dashboard-icon">→</div>

                <h2>Join Quiz</h2>

                <p>
                  Enter your teacher's quiz code
                  and start answering.
                </p>

                <span>Join →</span>
              </div>

             <div
  className="dashboard-card"
  onClick={() => navigate("/results")}
>
                <div className="dashboard-icon">📈</div>

                <h2>My Results</h2>

                <p>
                  View the quizzes you have attended
                  and your marks.
                </p>

                <span>Coming next →</span>
              </div>
            </>
          )}

        </div>

      </main>

    </div>
  );
}

export default Dashboard;

