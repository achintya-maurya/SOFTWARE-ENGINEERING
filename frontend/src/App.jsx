import { useState } from "react";
import { Routes, Route, Link, useNavigate, Navigate } from "react-router-dom";

import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Register from "./pages/Register";

import CitizenDashboard from "./pages/citizen/CitizenDashboard";
import SubmitComplaint from "./pages/citizen/SubmitComplaint";
import MyComplaints from "./pages/citizen/MyComplaints";
import ComplaintDetails from "./pages/citizen/ComplaintDetails";

import OfficerDashboard from "./pages/officer/OfficerDashboard";
import ComplaintReview from "./pages/officer/ComplaintReview";

import WorkerDashboard from "./pages/worker/WorkerDashboard";
import WorkerTaskDetails from "./pages/worker/WorkerTaskDetails";

import "./App.css";
import "./styles/design-system.css";
import "./styles/auth-pages.css";

// ================= LOGIN COMPONENT =================

function Login() {
  const [role, setRole] = useState("citizen");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { login, loading, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Redirect already authenticated users.
  const dashboardRoutes = {
    citizen: "/citizen/dashboard",
    officer: "/officer/dashboard",
    worker: "/worker/dashboard",
  };

  if (isAuthenticated && user) {
    return <Navigate to={dashboardRoutes[user.role] || "/"} replace />;
  }

  // Handle login using the existing AuthContext.
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const authenticatedUser = await login(email.trim(), password, role);

      const destination = dashboardRoutes[authenticatedUser.role];

      if (!destination) {
        setError("Invalid user role.");
        return;
      }

      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
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

            <h1>Making your city better starts here.</h1>

            <p>
              Report civic issues, track complaint progress, and stay connected
              with the people working to improve your city.
            </p>
          </div>

          <div className="auth-brand-footer">
            Smart City Civic Complaint & Management System
          </div>
        </section>

        {/* Login Form */}
        <section className="auth-form-panel">
          <div className="auth-form-content">
            <div className="auth-mobile-brand">
              <div className="auth-brand-logo">SC</div>
              <span>Smart City</span>
            </div>

            <span className="auth-form-eyebrow">WELCOME BACK</span>

            <h2>Login to your account</h2>

            <p className="auth-subtitle">
              Enter your credentials to access your Smart City portal.
            </p>

            <form onSubmit={handleLogin} className="auth-form">
              {/* Email */}
              <div className="auth-field">
                <label htmlFor="email">Email Address</label>

                <input
                  type="email"
                  id="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>

              {/* Password */}
              <div className="auth-field">
                <label htmlFor="password">Password</label>

                <input
                  type="password"
                  id="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

              {/* Role Selection */}
              <div className="auth-field">
                <label htmlFor="role">Login As</label>

                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                >
                  <option value="citizen">Citizen</option>
                  <option value="officer">Officer</option>
                  <option value="worker">Field Worker</option>
                </select>
              </div>

              {/* Error */}
              {error && (
                <p className="auth-error" role="alert">
                  {error}
                </p>
              )}

              {/* Login Button */}
              <button
                type="submit"
                className="auth-submit-button"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            <p className="auth-switch-text">
              Don't have an account? <Link to="/register">Register</Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

// ================= APP COMPONENT =================

function App() {
  return (
    <Routes>
      {/* LOGIN */}
      <Route path="/" element={<Login />} />

      {/* REGISTER */}
      <Route path="/register" element={<Register />} />

      {/* CITIZEN ROUTES */}
      <Route
        path="/citizen/dashboard"
        element={
          <ProtectedRoute allowedRole="citizen">
            <CitizenDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/citizen/submit"
        element={
          <ProtectedRoute allowedRole="citizen">
            <SubmitComplaint />
          </ProtectedRoute>
        }
      />

      <Route
        path="/citizen/complaints"
        element={
          <ProtectedRoute allowedRole="citizen">
            <MyComplaints />
          </ProtectedRoute>
        }
      />

      <Route
        path="/citizen/complaint/:id"
        element={
          <ProtectedRoute allowedRole="citizen">
            <ComplaintDetails />
          </ProtectedRoute>
        }
      />

      {/* OFFICER ROUTES */}
      <Route
        path="/officer/dashboard"
        element={
          <ProtectedRoute allowedRole="officer">
            <OfficerDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/officer/complaint/:id"
        element={
          <ProtectedRoute allowedRole="officer">
            <ComplaintReview />
          </ProtectedRoute>
        }
      />

      {/* WORKER ROUTES */}
      <Route
        path="/worker/dashboard"
        element={
          <ProtectedRoute allowedRole="worker">
            <WorkerDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/worker/task/:id"
        element={
          <ProtectedRoute allowedRole="worker">
            <WorkerTaskDetails />
          </ProtectedRoute>
        }
      />

      {/* UNKNOWN ROUTES */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
