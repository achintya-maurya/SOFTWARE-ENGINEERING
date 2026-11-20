import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";

import { apiRequest } from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "../../components/layout/DashboardLayout";

import "../../App.css";

function OfficerDashboard() {
  const { token, user } = useAuth();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch complaints belonging to the logged-in officer's department.
  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest(
        "/api/officer/complaints",
        { method: "GET" },
        token,
      );

      setComplaints(data.complaints || []);
    } catch (err) {
      setError(err.message || "Unable to load complaints.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchComplaints();
    }
  }, [token, fetchComplaints]);

  // Calculate statistics from actual backend data.
  const totalComplaints = complaints.length;

  const pendingComplaints = complaints.filter(
    (complaint) => complaint.status === "Pending Verification",
  ).length;

  const inProgressComplaints = complaints.filter((complaint) =>
    ["Verified", "Assigned", "Accepted", "In Progress", "Completed"].includes(
      complaint.status,
    ),
  ).length;

  const resolvedComplaints = complaints.filter(
    (complaint) => complaint.status === "Resolved",
  ).length;

  const rejectedComplaints = complaints.filter(
    (complaint) => complaint.status === "Rejected",
  ).length;

  // Format complaint ID.
  const formatComplaintId = (id) => `CMP${String(id).padStart(4, "0")}`;

  // Format date.
  const formatDate = (date) => {
    if (!date) return "Not available";

    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // Convert status into CSS classes.
  const getStatusClass = (status) => {
    switch (status) {
      case "Pending Verification":
        return "pending";

      case "Verified":
      case "Assigned":
      case "Accepted":
      case "In Progress":
      case "Completed":
        return "progress";

      case "Resolved":
        return "resolved";

      case "Rejected":
        return "rejected";

      default:
        return "";
    }
  };

  return (
    <DashboardLayout>
      <main className="officer-content officer-dashboard-content">
        {/* Page Header */}
        <div className="officer-header">
          <div>
            <h1>Officer Dashboard</h1>

            <p>Review, verify and manage citizen complaints.</p>

            <p className="officer-department">
              Department: {user?.department_name || "Your Department"}
            </p>
          </div>

          <button
            type="button"
            className="officer-refresh-button"
            onClick={fetchComplaints}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {/* Statistics */}
        <div className="officer-stats">
          <div className="officer-stat-card">
            <h3>Total Complaints</h3>
            <strong>{totalComplaints}</strong>
          </div>

          <div className="officer-stat-card">
            <h3>Pending Verification</h3>
            <strong>{pendingComplaints}</strong>
          </div>

          <div className="officer-stat-card">
            <h3>In Progress</h3>
            <strong>{inProgressComplaints}</strong>
          </div>

          <div className="officer-stat-card">
            <h3>Resolved</h3>
            <strong>{resolvedComplaints}</strong>
          </div>

          <div className="officer-stat-card rejected-stat">
            <h3>Rejected</h3>
            <strong>{rejectedComplaints}</strong>
          </div>
        </div>

        {/* Complaints Section */}
        <section className="officer-complaints">
          <div className="section-heading">
            <h2>Recent Complaints</h2>

            <span>
              {complaints.length}{" "}
              {complaints.length === 1 ? "complaint" : "complaints"}
            </span>
          </div>

          {/* Loading */}
          {loading && <p>Loading department complaints...</p>}

          {/* Error */}
          {!loading && error && (
            <div>
              <p className="error-message">{error}</p>

              <button type="button" onClick={fetchComplaints}>
                Retry
              </button>
            </div>
          )}

          {/* Complaint List */}
          {!loading && !error && (
            <div className="officer-complaint-list">
              {complaints.length > 0 ? (
                complaints.map((complaint) => (
                  <div
                    className="officer-complaint-card"
                    key={complaint.complaint_id}
                  >
                    <div className="officer-complaint-info">
                      <h3>{complaint.title}</h3>

                      <p>
                        Complaint ID:{" "}
                        {formatComplaintId(complaint.complaint_id)}
                      </p>

                      <div className="complaint-meta">
                        <span>Category: {complaint.category_name}</span>

                        <span>Location: {complaint.location}</span>

                        <span>Date: {formatDate(complaint.created_at)}</span>

                        <span>Citizen: {complaint.citizen_name}</span>
                      </div>
                    </div>

                    <div className="officer-complaint-action">
                      <span
                        className={`officer-status ${getStatusClass(
                          complaint.status,
                        )}`}
                      >
                        {complaint.status}
                      </span>

                      <Link
                        to={`/officer/complaint/${complaint.complaint_id}`}
                        className="officer-view-button"
                      >
                        Review
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <p>No complaints found for your department.</p>
              )}
            </div>
          )}
        </section>
      </main>
    </DashboardLayout>
  );
}

export default OfficerDashboard;
