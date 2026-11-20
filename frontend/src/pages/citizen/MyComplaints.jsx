import { Link } from "react-router-dom";

import "../../App.css";

import { useComplaints } from "../../context/ComplaintContext";
import { useAuth } from "../../context/AuthContext";

function MyComplaints() {
  const { complaints, loading, error, refreshComplaints } = useComplaints();

  const { user } = useAuth();

  // Format complaint ID
  const formatComplaintId = (id) => {
    return `CMP${String(id).padStart(4, "0")}`;
  };

  // Get CSS class according to complaint status
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
    <div className="dashboard">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="navbar-brand">Smart City</div>

        <div className="navbar-user">Welcome, {user?.name || "Citizen"}</div>
      </nav>

      {/* Main Content */}
      <main className="complaints-page">
        <Link to="/citizen/dashboard" className="back-link">
          ← Back to Dashboard
        </Link>

        <div className="page-heading">
          <h1>My Complaints</h1>

          <p>View and track all your submitted complaints.</p>
        </div>

        {/* Loading */}
        {loading && <p>Loading your complaints...</p>}

        {/* Error */}
        {!loading && error && (
          <div>
            <p className="error-message">{error}</p>

            <button type="button" onClick={refreshComplaints}>
              Retry
            </button>
          </div>
        )}

        {/* Complaints */}
        {!loading && !error && (
          <div className="all-complaints">
            {complaints.length === 0 ? (
              <div className="full-complaint-card">
                <div className="complaint-information">
                  <h2>No Complaints Found</h2>

                  <p>You have not submitted any complaints yet.</p>
                </div>

                <div className="complaint-actions">
                  <Link to="/citizen/submit" className="view-button">
                    Submit Complaint
                  </Link>
                </div>
              </div>
            ) : (
              complaints.map((complaint) => (
                <div className="full-complaint-card" key={complaint.id}>
                  {/* Complaint Information */}
                  <div className="complaint-information">
                    <h2>{complaint.title}</h2>

                    <p>
                      <strong>Complaint ID:</strong>{" "}
                      {formatComplaintId(complaint.id)}
                    </p>

                    <p>
                      <strong>Category:</strong> {complaint.category}
                    </p>

                    <p>
                      <strong>Location:</strong> {complaint.location}
                    </p>

                    <p>
                      <strong>Submitted:</strong> {complaint.date}
                    </p>
                  </div>

                  {/* Status and Action */}
                  <div className="complaint-actions">
                    <span
                      className={`status ${getStatusClass(complaint.status)}`}
                    >
                      {complaint.status}
                    </span>

                    <Link
                      to={`/citizen/complaint/${complaint.id}`}
                      className="view-button"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default MyComplaints;
