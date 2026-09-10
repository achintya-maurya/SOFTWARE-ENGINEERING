import { Routes, Route, Link } from "react-router-dom";
import { useState } from "react";

import Register from "./pages/Register";

import CitizenDashboard from "./pages/citizen/CitizenDashboard";
import SubmitComplaint from "./pages/citizen/SubmitComplaint";
import MyComplaints from "./pages/citizen/MyComplaints";
import ComplaintDetails from "./pages/citizen/ComplaintDetails";

import OfficerDashboard from "./pages/officer/OfficerDashboard";
import ComplaintReview from "./pages/officer/ComplaintReview";

import WorkerDashboard from "./pages/worker/WorkerDashboard";
import WorkerTaskDetails from "./pages/worker/WorkerTaskDetails";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminComplaintDetails from "./pages/admin/AdminComplaintDetails";

import "./App.css";

function Login() {
  const [role, setRole] = useState("citizen");

  return (
    <div className="app">
      <div className="login-container">
        {/* Left Side */}
        <div className="login-info">
          <h1>Smart City</h1>

          <h2>Civic Complaint & Management System</h2>

          <p>
            Report civic issues, track complaints, and help make your city
            better.
          </p>
        </div>

        {/* Right Side */}
        <div className="login-box">
          <h2>Welcome Back</h2>

          <p className="login-subtitle">Login to your account</p>

          <form>
            {/* Email */}
            <label htmlFor="email">Email</label>

            <input type="email" id="email" placeholder="Enter your email" />

            {/* Password */}
            <label htmlFor="password">Password</label>

            <input
              type="password"
              id="password"
              placeholder="Enter your password"
            />

            {/* Role Selection */}
            <div className="role-selection">
              <label htmlFor="role">Login As</label>

              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="citizen">Citizen</option>

                <option value="officer">Officer</option>

                <option value="worker">Field Worker</option>

                <option value="admin">Administrator</option>
              </select>
            </div>

            {/* Login Button */}
            <Link
              to={
                role === "citizen"
                  ? "/citizen/dashboard"
                  : role === "officer"
                    ? "/officer/dashboard"
                    : role === "worker"
                      ? "/worker/dashboard"
                      : "/admin/dashboard"
              }
              className="login-button"
            >
              Login
            </Link>
          </form>

          {/* Register */}
          <p className="register-text">
            Don't have an account? <Link to="/register">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      {/* ================= LOGIN ================= */}

      <Route path="/" element={<Login />} />

      {/* ================= REGISTER ================= */}

      <Route path="/register" element={<Register />} />

      {/* ================= CITIZEN ================= */}

      <Route path="/citizen/dashboard" element={<CitizenDashboard />} />

      <Route path="/citizen/submit" element={<SubmitComplaint />} />

      <Route path="/citizen/complaints" element={<MyComplaints />} />

      <Route path="/citizen/complaint/:id" element={<ComplaintDetails />} />

      {/* ================= OFFICER ================= */}

      <Route path="/officer/dashboard" element={<OfficerDashboard />} />

      <Route path="/officer/complaint/:id" element={<ComplaintReview />} />

      {/* ================= FIELD WORKER ================= */}

      <Route path="/worker/dashboard" element={<WorkerDashboard />} />

      <Route path="/worker/task/:id" element={<WorkerTaskDetails />} />

      {/* ================= ADMIN ================= */}

      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/complaint/:id" element={<AdminComplaintDetails />} />
    </Routes>
  );
}

export default App;
