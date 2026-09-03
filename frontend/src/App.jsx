import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Register from "./pages/Register";
import "./App.css";

function Login() {
  return (
    <div className="app">
      <div className="login-container">
        {/* Left side */}
        <div className="login-info">
          <h1>Smart City</h1>

          <h2>Civic Complaint & Management System</h2>

          <p>
            Report civic issues, track complaints, and help make your city
            better.
          </p>
        </div>

        {/* Right side */}
        <div className="login-box">
          <h2>Welcome Back</h2>

          <p className="login-subtitle">Login to your account</p>

          <form>
            <label htmlFor="email">Email</label>

            <input type="email" id="email" placeholder="Enter your email" />

            <label htmlFor="password">Password</label>

            <input
              type="password"
              id="password"
              placeholder="Enter your password"
            />

            <button type="submit">Login</button>
          </form>

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
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
