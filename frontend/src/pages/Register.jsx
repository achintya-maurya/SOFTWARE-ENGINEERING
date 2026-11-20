import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import "../styles/auth-pages.css";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await register(name.trim(), email.trim(), password);

      setSuccess("Account created successfully! Redirecting to login...");

      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Branding Panel */}
        <section className="auth-brand-panel">
          <div className="auth-brand">
            <div className="auth-brand-logo">SC</div>
            <span>Smart City</span>
          </div>

          <div className="auth-brand-content">
            <span className="auth-eyebrow">CIVIC COMPLAINT MANAGEMENT</span>

            <h1>Build a better city, together.</h1>

            <p>
              Report civic issues, track their progress, and contribute to a
              cleaner, safer, and smarter community.
            </p>
          </div>

          <div className="auth-brand-footer">
            Smart City Civic Complaint & Management System
          </div>
        </section>

        {/* Registration Form */}
        <section className="auth-form-panel">
          <div className="auth-form-content">
            <div className="auth-mobile-brand">
              <div className="auth-brand-logo">SC</div>
              <span>Smart City</span>
            </div>

            <span className="auth-form-eyebrow">GET STARTED</span>

            <h2>Create your account</h2>

            <p className="auth-subtitle">
              Register as a citizen to report and track civic complaints.
            </p>

            <form onSubmit={handleRegister} className="auth-form">
              <div className="auth-field">
                <label htmlFor="name">Full Name</label>

                <input
                  type="text"
                  id="name"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  minLength={2}
                  maxLength={100}
                  autoComplete="name"
                  required
                />
              </div>

              <div className="auth-field">
                <label htmlFor="email">Email Address</label>

                <input
                  type="email"
                  id="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="auth-field">
                <label htmlFor="password">Password</label>

                <input
                  type="password"
                  id="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  required
                />

                <small>Use at least 8 characters.</small>
              </div>

              <div className="auth-field">
                <label htmlFor="confirmPassword">Confirm Password</label>

                <input
                  type="password"
                  id="confirmPassword"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>

              {error && (
                <p className="auth-error" role="alert">
                  {error}
                </p>
              )}

              {success && (
                <p className="auth-success" role="status">
                  {success}
                </p>
              )}

              <button
                type="submit"
                className="auth-submit-button"
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            <p className="auth-switch-text">
              Already have an account? <Link to="/">Login</Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Register;
