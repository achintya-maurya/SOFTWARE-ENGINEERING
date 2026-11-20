import { Link } from "react-router-dom";

import { useComplaints } from "../../context/ComplaintContext";
import DashboardLayout from "../../components/layout/DashboardLayout";

import "../../App.css";

function CitizenDashboard() {
  const { complaints, loading, error, refreshComplaints } = useComplaints();

  // Calculate complaint statistics from actual backend data.
  const totalComplaints = complaints.length;

  const pendingComplaints = complaints.filter((complaint) =>
    ["Pending Verification", "Verified", "Assigned"].includes(complaint.status),
  ).length;

  const inProgressComplaints = complaints.filter((complaint) =>
    ["Accepted", "In Progress", "Completed"].includes(complaint.status),
  ).length;

  const resolvedComplaints = complaints.filter(
    (complaint) => complaint.status === "Resolved",
  ).length;

  const rejectedComplaints = complaints.filter(
    (complaint) => complaint.status === "Rejected",
  ).length;

  // Display the latest three complaints.
  const recentComplaints = complaints.slice(0, 3);

  // Convert backend status into CSS status classes.
  const getStatusClass = (status) => {
    switch (status) {
      case "Pending Verification":
      case "Verified":
      case "Assigned":
      case "Reopened":
        return "pending";

      case "Accepted":
      case "In Progress":
      case "Completed":
        return "progress";

      case "Resolved":
        return "resolved";

      case "Rejected":
        return "rejected";

      default:
        return "pending";
    }
  };

  return (
    <DashboardLayout>
      <main className="dashboard-content citizen-dashboard-content">
        {/* Page Header */}
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
        <div className="stats-grid citizen-stats-grid">
          <div className="stat-card">
            <h3>Total Complaints</h3>
            <p>{totalComplaints}</p>
          </div>

          <div className="stat-card">
            <h3>Pending</h3>
            <p>{pendingComplaints}</p>
          </div>

          <div className="stat-card">
            <h3>In Progress</h3>
            <p>{inProgressComplaints}</p>
          </div>

          <div className="stat-card">
            <h3>Resolved</h3>
            <p>{resolvedComplaints}</p>
          </div>

          <div className="stat-card rejected-stat">
            <h3>Rejected</h3>
            <p>{rejectedComplaints}</p>
          </div>
        </div>

        {/* Recent Complaints */}
        <section className="complaints-section">
          <div className="section-header">
            <h2>Recent Complaints</h2>
            <Link to="/citizen/complaints">View All</Link>
          </div>

          {/* Loading */}
          {loading && <p>Loading complaints...</p>}

          {/* Error */}
          {!loading && error && (
            <div>
              <p className="error-message">{error}</p>

              <button type="button" onClick={refreshComplaints}>
                Retry
              </button>
            </div>
          )}

          {/* Complaint List */}
          {!loading && !error && (
            <div className="complaint-list">
              {recentComplaints.length > 0 ? (
                recentComplaints.map((complaint) => (
                  <Link
                    to={`/citizen/complaint/${complaint.id}`}
                    className="complaint-card"
                    key={complaint.id}
                  >
                    <div className="citizen-complaint-info">
                      <h3>{complaint.title}</h3>

                      <p>
                        Complaint ID: CMP
                        {String(complaint.id).padStart(4, "0")}
                      </p>

                      <p>Location: {complaint.location}</p>
                    </div>

                    <span
                      className={`status ${getStatusClass(complaint.status)}`}
                    >
                      {complaint.status}
                    </span>
                  </Link>
                ))
              ) : (
                <p>No complaints submitted yet.</p>
              )}
            </div>
          )}
        </section>
      </main>
    </DashboardLayout>
  );
}

export default CitizenDashboard;
