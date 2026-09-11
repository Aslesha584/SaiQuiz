import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
} from "react-router-dom";
import TeacherResults from "./TeacherResults";
import CreateQuiz from "./pages/CreateQuiz";
import JoinQuiz from "./pages/JoinQuiz";
import "./App.css";
import Register from "./Register";
import Login from "./Login";
import Dashboard from "./Dashboard";
import MyResults from "./MyResults";
import saiquizLogo from "./assets/saiquiz-logo.jpeg";


// =========================
// AUTH HELPERS
// =========================

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}


// =========================
// PROTECTED ROUTE
// =========================

function ProtectedRoute({ children }) {
  const user = getUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}


// =========================
// TEACHER ONLY ROUTE
// =========================

function TeacherRoute({ children }) {
  const user = getUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "teacher") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}


// =========================
// STUDENT ONLY ROUTE
// =========================

function StudentRoute({ children }) {
  const user = getUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "student") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function Home() {
  const token = localStorage.getItem("token");
  const user = getUser();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  // Decide where the main buttons should go
  const createPath =
    token && user?.role === "teacher"
      ? "/create"
      : "/login";

  const joinPath =
    token && user?.role === "student"
      ? "/join"
      : "/login";

  return (
    <div className="app">

      {/* =========================
          NAVBAR
      ========================= */}

      <nav className="navbar">

        <div className="logo">
          <img
            src={saiquizLogo}
            alt="SimpleQuiz"
            className="logo-image"
          />
        </div>


        <div className="nav-actions">

          {/* LOGGED IN */}
          {token && user ? (
            <>
              <Link
                to="/dashboard"
                className="nav-link"
              >
                Dashboard
              </Link>

              <button
                className="nav-button"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (

            /* NOT LOGGED IN */
            <Link
              to="/login"
              className="nav-button"
            >
              Login
            </Link>

          )}

        </div>

      </nav>


      {/* =========================
          HERO
      ========================= */}

      <main>

        <section className="hero">

          <div className="hero-badge">
            ⚡ Smarter way to create quizzes
          </div>


          <h1>
            Turn your questions into
            <span> quizzes in seconds.</span>
          </h1>


          <p className="hero-text">
  Stop entering questions one by one. Paste your entire question
  set and let SimpleQuiz organize it for you.
</p>


          <div className="hero-actions">

            <Link
              to={createPath}
              className="primary-button"
            >
              Create a Quiz
              <span>→</span>
            </Link>


            <Link
              to={joinPath}
              className="secondary-button"
            >
              Join with Code
            </Link>

          </div>


          <p className="hero-note">
            Built for teachers. Simple for students.
          </p>

        </section>


        {/* =========================
            BULK IMPORT PREVIEW
        ========================= */}

        <section className="feature-preview">

          <div className="preview-header">

            <div>

              <p className="preview-label">
                BULK QUIZ CREATION
              </p>

              <h2>
                From a wall of questions to a ready quiz.
              </h2>

            </div>


            <div className="window-dots">

              <span></span>
              <span></span>
              <span></span>

            </div>

          </div>


          <div className="preview-content">

            {/* LEFT */}

            <div className="paste-card">

              <div className="card-title">

                <span>
                  Paste your questions
                </span>

                <span className="small-tag">
                  Bulk
                </span>

              </div>


              <div className="question-text">

                <p>
                  Q1. What does HTML stand for?
                </p>

                <p>
                  A. Hyper Text Markup Language
                </p>

                <p>
                  B. High Text Machine Language
                </p>

                <br />

                <p>
                  Q2. Which language is used for styling web pages?
                </p>

                <p>
                  A. HTML
                </p>

                <p>
                  B. CSS
                </p>

              </div>

            </div>


            {/* ARROW */}

            <div className="arrow">
              →
            </div>


            {/* RIGHT */}

            <div className="organized-card">

              <div className="card-title">

                <span>
                  Your quiz
                </span>

                <span className="success-tag">
                  Ready
                </span>

              </div>


              <div className="quiz-item">

                <span>
                  01
                </span>

                <p>
                  What does HTML stand for?
                </p>

              </div>


              <div className="quiz-item">

                <span>
                  02
                </span>

                <p>
                  Which language is used for styling?
                </p>

              </div>


              <div className="quiz-item">

                <span>
                  03
                </span>

                <p>
                  More questions organized...
                </p>

              </div>

            </div>

          </div>

        </section>


        {/* =========================
            FEATURES
        ========================= */}

        <section className="features">

          <div className="section-heading">

            <p className="preview-label">
              Why SimpleQuiz?
            </p>

            <h2>
              Built around the way teachers actually work.
            </h2>

          </div>


          <div className="feature-grid">

            <div className="feature-card">

              <div className="feature-icon">
                📋
              </div>

              <h3>
                Bulk Import
              </h3>

              <p>
                Paste questions from ChatGPT, notes, or documents
                instead of entering them one by one.
              </p>

            </div>


            <div className="feature-card">

              <div className="feature-icon">
                ⚡
              </div>

              <h3>
                Fast Setup
              </h3>

              <p>
                Turn your question set into a ready-to-use quiz
                with minimal effort.
              </p>

            </div>


            <div className="feature-card">

              <div className="feature-icon">
                🎯
              </div>

              <h3>
                Simple for Students
              </h3>

              <p>
                Students simply enter a quiz code and start answering.
              </p>

            </div>

          </div>

        </section>

      </main>


      {/* =========================
          FOOTER
      ========================= */}

      <footer>

        <div className="logo">

          <img
            src={saiquizLogo}
            alt="Simplequiz"
            className="logo-image"
          />

        </div>

        <p>
          Simple quizzes. Smarter creation.
        </p>

      </footer>

    </div>
  );
}
// =========================
// APP
// =========================

function App() {

  return (

    <BrowserRouter>

      <Routes>


        {/* HOME */}

        <Route
          path="/"
          element={<Home />}
        />


        {/* LOGIN */}

        <Route
          path="/login"
          element={<Login />}
        />


        {/* REGISTER */}

        <Route
          path="/register"
          element={<Register />}
        />


        {/* DASHBOARD */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />


        {/* CREATE QUIZ - TEACHER ONLY */}

        <Route
          path="/create"
          element={
            <TeacherRoute>
              <CreateQuiz />
            </TeacherRoute>
          }
        />


        {/* JOIN QUIZ - STUDENT ONLY */}

        <Route
          path="/join"
          element={
            <StudentRoute>
              <JoinQuiz />
            </StudentRoute>
          }
        />


        {/* STUDENT RESULTS - TEACHER ONLY */}

<Route
  path="/student-results"
  element={
    <TeacherRoute>
      <TeacherResults />
    </TeacherRoute>
  }
/>


        {/* MY RESULTS - STUDENT ONLY */}

        <Route
          path="/results"
          element={
            <StudentRoute>
              <MyResults />
            </StudentRoute>
          }
        />


        {/* UNKNOWN URL */}

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />


      </Routes>

    </BrowserRouter>

  );
}


export default App;