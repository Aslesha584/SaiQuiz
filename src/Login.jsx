import { useState } from "react";
import axios from "axios";
import "./Login.css";
import saiquizLogo from "./assets/saiquiz-logo.jpeg";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // =========================
  // LOGIN
  // =========================

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      alert("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        {
          email: email.trim(),
          password,
        }
      );

      const { token, user } = response.data;

      // Save authentication information
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // Redirect according to role
      window.location.href = "/dashboard";

    } catch (error) {
      console.error("Login error:", error);

      alert(
        error.response?.data?.message ||
          "Login failed. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };

  // =========================
  // LOGIN PAGE
  // =========================

  return (
    <div className="login-page">

      {/* =========================
          LEFT BRAND SECTION
      ========================= */}

      <div className="login-brand">

        <div className="login-brand-content">

          {/* Desktop Logo */}

          <div className="login-logo">

            <img
              src={saiquizLogo}
              alt="SaiQuiz"
              className="login-logo-image"
            />

            <span className="login-logo-name">
              SaiQuiz
            </span>

          </div>


          {/* Brand Message */}

          <div className="login-brand-message">

            <p className="login-brand-label">
              SMART QUIZ PLATFORM
            </p>

            <h1>
              Welcome
              <br />
              <span>back.</span>
            </h1>

            <p>
              Continue creating, sharing and
              completing quizzes with SaiQuiz.
            </p>

          </div>


          {/* Brand Footer */}

          <div className="login-brand-footer">
            © 2026 SaiQuiz
          </div>

        </div>

      </div>


      {/* =========================
          RIGHT LOGIN SECTION
      ========================= */}

      <div className="login-section">

        <div className="login-card">

          {/* =========================
              MOBILE LOGO
          ========================= */}

          <div className="login-mobile-logo">

            <img
              src={saiquizLogo}
              alt="SaiQuiz"
              className="login-mobile-logo-image"
            />

            <span>
              SaiQuiz
            </span>

          </div>


          {/* =========================
              HEADING
          ========================= */}

          <div className="login-heading">

            <p className="login-label">
              WELCOME BACK
            </p>

            <h2>
              Sign in to SaiQuiz
            </h2>

            <p>
              Enter your account details to continue.
            </p>

          </div>


          {/* =========================
              LOGIN FORM
          ========================= */}

          <form
            className="login-form"
            onSubmit={handleLogin}
          >

            {/* Email */}

            <div className="login-form-group">

              <label htmlFor="login-email">
                Email address
              </label>

              <input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                autoComplete="email"
              />

            </div>


            {/* Password */}

            <div className="login-form-group">

              <label htmlFor="login-password">
                Password
              </label>

              <input
                id="login-password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                autoComplete="current-password"
              />

            </div>


            {/* Login Button */}

            <button
              type="submit"
              className="login-submit-button"
              disabled={loading}
            >

              {loading ? (
                "Signing in..."
              ) : (
                <>
                  Sign in
                  <span>→</span>
                </>
              )}

            </button>

          </form>


          {/* =========================
              REGISTER LINK
          ========================= */}

          <p className="register-text">

            Don't have an account?

            <button
              type="button"
              className="register-link"
              onClick={() => {
                window.location.href = "/register";
              }}
            >
              Create one
            </button>

          </p>

        </div>

      </div>

    </div>
  );
}

export default Login;