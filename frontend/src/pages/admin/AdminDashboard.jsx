import { Link } from "react-router-dom";
import { useComplaints } from "../../context/ComplaintContext";

function AdminDashboard() {
  const { complaints } = useComplaints();

  // Statistics
  const totalComplaints = complaints.length;

  const pendingComplaints = complaints.filter(
    (complaint) => complaint.status === "Pending",
  ).length;

  const inProgressComplaints = complaints.filter(
    (complaint) => complaint.status === "In Progress",
  ).length;

  const completedComplaints = complaints.filter(
    (complaint) => complaint.status === "Completed",
  ).length;

  const resolvedComplaints = complaints.filter(
    (complaint) => complaint.status === "Resolved",
  ).length;

  const reopenedComplaints = complaints.filter(
    (complaint) => complaint.status === "Reopened",
  ).length;

  return (
    <div className="admin-dashboard">
      {/* Navbar */}
      <nav className="admin-navbar">
        <h2>Smart City</h2>

        <div className="admin-nav-right">
          <span>Administrator</span>

          <Link to="/">Logout</Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="admin-content">
        {/* Header */}
        <div className="admin-header">
          <div>
            <h1>Administrator Dashboard</h1>

            <p>Monitor and manage all civic complaints across the system.</p>
          </div>
        </div>

        {/* Statistics */}
        <div className="admin-stats">
          <div className="admin-stat-card">
            <h3>Total Complaints</h3>
            <strong>{totalComplaints}</strong>
          </div>

          <div className="admin-stat-card">
            <h3>Pending</h3>
            <strong>{pendingComplaints}</strong>
          </div>

          <div className="admin-stat-card">
            <h3>In Progress</h3>
            <strong>{inProgressComplaints}</strong>
          </div>

          <div className="admin-stat-card">
            <h3>Completed</h3>
            <strong>{completedComplaints}</strong>
          </div>

          <div className="admin-stat-card">
            <h3>Resolved</h3>
            <strong>{resolvedComplaints}</strong>
          </div>

          <div className="admin-stat-card">
            <h3>Reopened</h3>
            <strong>{reopenedComplaints}</strong>
          </div>
        </div>

        {/* Complaint Management */}
        <section className="admin-complaints">
          <div className="admin-section-heading">
            <div>
              <h2>Complaint Management</h2>

              <p>Monitor the current status of all complaints.</p>
            </div>
          </div>

          <div className="admin-complaint-list">
            {complaints.length === 0 ? (
              <div className="admin-empty-state">
                <h3>No Complaints</h3>

                <p>There are currently no complaints in the system.</p>
              </div>
            ) : (
              complaints.map((complaint) => (
                <div className="admin-complaint-card" key={complaint.id}>
                  {/* Complaint Information */}
                  <div className="admin-complaint-info">
                    <h3>{complaint.title}</h3>

                    <p>Complaint ID: {complaint.id}</p>

                    <div className="admin-complaint-meta">
                      <span>Category: {complaint.category}</span>

                      <span>Location: {complaint.location}</span>

                      <span>Date: {complaint.date}</span>
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="admin-complaint-action">
                    <span
                      className={`admin-status ${complaint.status
                        .toLowerCase()
                        .replace(" ", "-")}`}
                    >
                      {complaint.status}
                    </span>

                    <div className="admin-assignment">
                      <span>Assigned Worker</span>

                      <strong>
                        {complaint.assignedWorker
                          ? complaint.assignedWorker
                          : "Not Assigned"}
                      </strong>
                    </div>

                    {/* View Details */}
                    <Link
                      to={`/admin/complaint/${complaint.id}`}
                      className="admin-view-button"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default AdminDashboard;
