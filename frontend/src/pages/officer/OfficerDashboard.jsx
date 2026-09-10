import { Link } from "react-router-dom";
import { useComplaints } from "../../context/ComplaintContext";

function OfficerDashboard() {
  // Get complaints from shared ComplaintContext
  const { complaints } = useComplaints();

  // Calculate statistics dynamically
  const totalComplaints = complaints.length;

  const pendingComplaints = complaints.filter(
    (complaint) => complaint.status === "Pending",
  ).length;

  const inProgressComplaints = complaints.filter(
    (complaint) => complaint.status === "In Progress",
  ).length;

  const resolvedComplaints = complaints.filter(
    (complaint) =>
      complaint.status === "Resolved" || complaint.status === "Completed",
  ).length;

  return (
    <div className="officer-dashboard">
      {/* Navbar */}
      <nav className="officer-navbar">
        <h2>Smart City</h2>

        <div className="officer-nav-right">
          <span>Officer</span>

          <Link to="/">Logout</Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="officer-content">
        <div className="officer-header">
          <div>
            <h1>Officer Dashboard</h1>

            <p>Review, verify and manage citizen complaints.</p>
          </div>
        </div>

        {/* Statistics */}
        <div className="officer-stats">
          <div className="officer-stat-card">
            <h3>Total Complaints</h3>

            <strong>{totalComplaints}</strong>
          </div>

          <div className="officer-stat-card pending-stat">
            <h3>Pending Verification</h3>

            <strong>{pendingComplaints}</strong>
          </div>

          <div className="officer-stat-card progress-stat">
            <h3>In Progress</h3>

            <strong>{inProgressComplaints}</strong>
          </div>

          <div className="officer-stat-card resolved-stat">
            <h3>Resolved</h3>

            <strong>{resolvedComplaints}</strong>
          </div>
        </div>

        {/* Complaints */}
        <section className="officer-complaints">
          <div className="section-heading">
            <h2>Recent Complaints</h2>

            <span>Manage complaints</span>
          </div>

          <div className="officer-complaint-list">
            {complaints.map((complaint) => (
              <div className="officer-complaint-card" key={complaint.id}>
                <div className="officer-complaint-info">
                  <h3>{complaint.title}</h3>

                  <p>Complaint ID: {complaint.id}</p>

                  <div className="complaint-meta">
                    <span>Category: {complaint.category}</span>

                    <span>Location: {complaint.location}</span>

                    <span>Date: {complaint.date}</span>
                  </div>
                </div>

                <div className="officer-complaint-action">
                  <span
                    className={`officer-status ${complaint.status
                      .toLowerCase()
                      .replace(" ", "-")}`}
                  >
                    {complaint.status}
                  </span>

                  <Link
                    to={`/officer/complaint/${complaint.id}`}
                    className="officer-view-button"
                  >
                    Review
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default OfficerDashboard;
