import { Link } from "react-router-dom";
import "../../App.css";

function CitizenDashboard() {
  return (
    <div className="dashboard">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="navbar-brand">Smart City</div>

        <div className="navbar-user">Welcome, Citizen</div>
      </nav>

      {/* Main Content */}
      <main className="dashboard-content">
        <div className="dashboard-header">
          <div>
            <h1>Citizen Dashboard</h1>

            <p>Report and track civic complaints in your city.</p>
          </div>

          <Link to="/citizen/submit" className="primary-button">
            + Submit Complaint
          </Link>
        </div>

        {/* Statistics */}
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Complaints</h3>
            <p>3</p>
          </div>

          <div className="stat-card">
            <h3>Pending</h3>
            <p>1</p>
          </div>

          <div className="stat-card">
            <h3>In Progress</h3>
            <p>1</p>
          </div>

          <div className="stat-card">
            <h3>Resolved</h3>
            <p>1</p>
          </div>
        </div>

        {/* Recent Complaints */}
        <section className="complaints-section">
          <div className="section-header">
            <h2>Recent Complaints</h2>

            <Link to="/citizen/complaints">View All</Link>
          </div>

          <div className="complaint-list">
            {/* Complaint 1 */}
            <div className="complaint-card">
              <div>
                <h3>Garbage Collection Issue</h3>

                <p>Complaint ID: CMP1001</p>

                <p>Location: Sector 15</p>
              </div>

              <span className="status pending">Pending</span>
            </div>

            {/* Complaint 2 */}
            <div className="complaint-card">
              <div>
                <h3>Street Light Not Working</h3>

                <p>Complaint ID: CMP1002</p>

                <p>Location: Sector 21</p>
              </div>

              <span className="status progress">In Progress</span>
            </div>

            {/* Complaint 3 */}
            <div className="complaint-card">
              <div>
                <h3>Road Damage</h3>

                <p>Complaint ID: CMP1003</p>

                <p>Location: Sector 10</p>
              </div>

              <span className="status resolved">Resolved</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default CitizenDashboard;
