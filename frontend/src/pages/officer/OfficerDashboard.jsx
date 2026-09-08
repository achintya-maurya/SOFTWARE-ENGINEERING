import { Link } from "react-router-dom";

function OfficerDashboard() {
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
            <strong>3</strong>
          </div>

          <div className="officer-stat-card pending-stat">
            <h3>Pending Verification</h3>
            <strong>1</strong>
          </div>

          <div className="officer-stat-card progress-stat">
            <h3>In Progress</h3>
            <strong>1</strong>
          </div>

          <div className="officer-stat-card resolved-stat">
            <h3>Resolved</h3>
            <strong>1</strong>
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
