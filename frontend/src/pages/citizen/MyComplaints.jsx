import { Link } from "react-router-dom";
import "../../App.css";

function MyComplaints() {
  const complaints = [
    {
      id: "CMP1001",
      title: "Garbage Collection Issue",
      category: "Garbage / Waste",
      location: "Sector 15",
      date: "05 September 2026",
      status: "Pending",
    },
    {
      id: "CMP1002",
      title: "Street Light Not Working",
      category: "Street Light",
      location: "Sector 21",
      date: "03 September 2026",
      status: "In Progress",
    },
    {
      id: "CMP1003",
      title: "Road Damage",
      category: "Road Damage",
      location: "Sector 10",
      date: "01 September 2026",
      status: "Resolved",
    },
  ];

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
          {complaints.map((complaint) => (
            <div className="full-complaint-card" key={complaint.id}>
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
          ))}
        </div>
      </main>
    </div>
  );
}

export default MyComplaints;
