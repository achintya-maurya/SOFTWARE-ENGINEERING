import "../App.css";

function Register() {
  return (
    <div className="app">
      <div className="login-container">
        {/* Left side */}
        <div className="login-info">
          <h1>Smart City</h1>

          <h2>Civic Complaint & Management System</h2>

          <p>
            Create your account and help make your city cleaner, safer, and
            better.
          </p>
        </div>

        {/* Right side */}
        <div className="login-box">
          <h2>Create Account</h2>

          <p className="login-subtitle">Register as a citizen</p>

          <form>
            <label htmlFor="name">Full Name</label>

            <input type="text" id="name" placeholder="Enter your full name" />

            <label htmlFor="email">Email</label>

            <input type="email" id="email" placeholder="Enter your email" />

            <label htmlFor="password">Password</label>

            <input
              type="password"
              id="password"
              placeholder="Create a password"
            />

            <label htmlFor="confirmPassword">Confirm Password</label>

            <input
              type="password"
              id="confirmPassword"
              placeholder="Confirm your password"
            />

            <button type="submit">Create Account</button>
          </form>

          <p className="register-text">
            Already have an account? <span>Login</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
