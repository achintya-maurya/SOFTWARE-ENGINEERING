import { Link } from "react-router-dom";
import "../../App.css";
import { useComplaints } from "../../context/ComplaintContext";

function MyComplaints() {
  const { complaints } = useComplaints();

  return (
    <div className="dashboard">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="navbar-brand">Smart City</div>

        <div className="navbar-user">Welcome, Citizen</div>
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

        {/* Complaints */}
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
                    <strong>Complaint ID:</strong> {complaint.id}
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

                {/* Status & Action */}
                <div className="complaint-actions">
                  <span
                    className={`status ${complaint.status
                      .toLowerCase()
                      .replace(" ", "-")}`}
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
      </main>
    </div>
  );
}

export default MyComplaints;
