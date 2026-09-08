import { Link, useParams } from "react-router-dom";

function ComplaintDetails() {
  const { id } = useParams();

  const complaint = {
    id: id,
    title: "Garbage Collection Issue",
    category: "Garbage / Waste",
    location: "Sector 15",
    date: "05 September 2026",
    status: "Pending",
    description:
      "Garbage has not been collected for the last two days in our area.",
  };

  return (
    <div className="complaint-details-page">
      <div className="details-container">
        <Link to="/citizen/complaints" className="back-link">
          ← Back to My Complaints
        </Link>

        <div className="details-header">
          <div>
            <h1>Complaint Details</h1>
            <p>View information and progress of your complaint.</p>
          </div>

          <span
            className={`status-badge ${complaint.status.toLowerCase().replace(" ", "-")}`}
          >
            {complaint.status}
          </span>
        </div>

        <div className="details-card">
          <div className="complaint-title-section">
            <h2>{complaint.title}</h2>
            <p>Complaint ID: {complaint.id}</p>
          </div>

          <div className="information-grid">
            <div className="information-item">
              <span>Category</span>
              <strong>{complaint.category}</strong>
            </div>

            <div className="information-item">
              <span>Location</span>
              <strong>{complaint.location}</strong>
            </div>

            <div className="information-item">
              <span>Submitted Date</span>
              <strong>{complaint.date}</strong>
            </div>

            <div className="information-item">
              <span>Status</span>
              <strong>{complaint.status}</strong>
            </div>
          </div>

          <div className="description-section">
            <h3>Description</h3>
            <p>{complaint.description}</p>
          </div>
        </div>

        <div className="timeline-card">
          <h2>Complaint Timeline</h2>

          <div className="timeline">
            <div className="timeline-item completed">
              <div className="timeline-dot">✓</div>

              <div>
                <h3>Complaint Submitted</h3>
                <p>{complaint.date}</p>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-dot">2</div>

              <div>
                <h3>Officer Verification</h3>
                <p>Pending</p>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-dot">3</div>

              <div>
                <h3>Worker Assigned</h3>
                <p>Pending</p>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-dot">4</div>

              <div>
                <h3>Complaint Resolved</h3>
                <p>Pending</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComplaintDetails;
