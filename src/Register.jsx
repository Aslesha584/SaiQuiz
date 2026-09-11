import { useState } from "react";
import axios from "axios";
import "./Register.css";
import saiquizLogo from "./assets/saiquiz-logo.jpeg";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password.trim()) {
      alert("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        "https://saiquiz-backend.onrender.com/api/auth/register",
        {
          name: name.trim(),
          email: email.trim(),
          password,
          role,
        }
      );

      alert(response.data.message);

      // Clear form after successful registration
      setName("");
      setEmail("");
      setPassword("");
      setRole("student");

    } catch (error) {
      console.error("Registration error:", error);

      alert(
        error.response?.data?.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">

      {/* LEFT SIDE */}
      <div className="register-brand">

        <div className="brand-content">

          <div className="brand-logo">
  <img
    src={saiquizLogo}
    alt="SimpleQuiz"
    className="register-logo-image"
  />
  <span className="brand-name">SimpleQuiz</span>
</div>

          <div className="brand-message">
            <p className="brand-label">
              SMART QUIZ PLATFORM
            </p>

            <h1>
              Learn.
              <br />
              Test.
              <br />
              <span>Grow.</span>
            </h1>

            <p>
              Create quizzes, collect responses,
              and make learning easier with SimpleQuiz.
            </p>
          </div>

          <div className="brand-footer">
            © 2026 SimpleQuiz
          </div>

        </div>

      </div>


      {/* RIGHT SIDE */}
      <div className="register-section">

        <div className="register-card">

          <div className="mobile-logo">
  <img
    src={saiquizLogo}
    alt="SimpleQuiz"
    className="register-logo-image"
  />
  <span>SimpleQuiz</span>
</div>

          <div className="register-heading">

            <p className="register-label">
              GET STARTED
            </p>

            <h2>
              Create your account
            </h2>

            <p>
              Join SimpleQuiz and get started in seconds.
            </p>

          </div>


          {/* ROLE SELECTION */}
          <div className="role-section">

            <label>
              I am a
            </label>

            <div className="role-options">

              <button
                type="button"
                className={`role-card ${
                  role === "student" ? "active" : ""
                }`}
                onClick={() => setRole("student")}
              >
                

                <div>
                  <strong>Student</strong>
                  <span>Attend quizzes</span>
                </div>

                <div className="role-check">
                  {role === "student" ? "✓" : ""}
                </div>

              </button>


              <button
                type="button"
                className={`role-card ${
                  role === "teacher" ? "active" : ""
                }`}
                onClick={() => setRole("teacher")}
              >
                

                <div>
                  <strong>Teacher</strong>
                  <span>Create quizzes</span>
                </div>

                <div className="role-check">
                  {role === "teacher" ? "✓" : ""}
                </div>

              </button>

            </div>

          </div>


          {/* FORM */}
          <form
            className="register-form"
            onSubmit={handleRegister}
          >

            <div className="form-group">

              <label htmlFor="name">
                Full name
              </label>

              <input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />

            </div>


            <div className="form-group">

              <label htmlFor="email">
                Email address
              </label>

              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />

            </div>


            <div className="form-group">

              <label htmlFor="password">
                Password
              </label>

              <input
                id="password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />

              <span className="password-hint">
                Minimum 6 characters
              </span>

            </div>


            <button
              type="submit"
              className="register-button"
              disabled={loading}
            >
              {loading ? (
                "Creating account..."
              ) : (
                <>
                  Create account
                  <span>→</span>
                </>
              )}
            </button>

          </form>


          <p className="login-text">
            Already have an account?
            <button
              type="button"
              className="login-link"
              onClick={() => {
                window.location.href = "/login";
              }}
            >
              Sign in
            </button>
          </p>

        </div>

      </div>

    </div>
  );
}

export default Register;

