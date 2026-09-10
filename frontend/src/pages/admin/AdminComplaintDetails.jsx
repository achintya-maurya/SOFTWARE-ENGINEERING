import { Link, useParams } from "react-router-dom";
import { useComplaints } from "../../context/ComplaintContext";

function AdminComplaintDetails() {
  const { id } = useParams();

  const { complaints, updateComplaint } = useComplaints();

  // Find complaint using URL ID
  const complaint = complaints.find((item) => item.id === id);

  // Complaint not found
  if (!complaint) {
    return (
      <div className="admin-details-page">
        <nav className="admin-navbar">
          <h2>Smart City</h2>

          <div className="admin-nav-right">
            <span>Administrator</span>

            <Link to="/">Logout</Link>
          </div>
        </nav>

        <main className="admin-details-container">
          <Link to="/admin/dashboard" className="admin-back-link">
            ← Back to Dashboard
          </Link>

          <div className="admin-details-card">
            <h1>Complaint Not Found</h1>

            <p>No complaint was found with ID: {id}</p>
          </div>
        </main>
      </div>
    );
  }

  // Reassign worker
  const handleReassignWorker = (event) => {
    const selectedWorker = event.target.value;

    if (selectedWorker === "") {
      return;
    }

    updateComplaint(id, {
      assignedWorker: selectedWorker,
      status: complaint.status === "Pending" ? "Assigned" : complaint.status,
    });
  };

  return (
    <div className="admin-details-page">
      {/* Navbar */}
      <nav className="admin-navbar">
        <h2>Smart City</h2>

        <div className="admin-nav-right">
          <span>Administrator</span>

          <Link to="/">Logout</Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="admin-details-container">
        {/* Back */}
        <Link to="/admin/dashboard" className="admin-back-link">
          ← Back to Dashboard
        </Link>

        {/* Header */}
        <div className="admin-details-header">
          <div>
            <h1>Complaint Details</h1>

            <p>View and manage complete complaint information.</p>
          </div>

          <span
            className={`admin-status ${complaint.status
              .toLowerCase()
              .replace(" ", "-")}`}
          >
            {complaint.status}
          </span>
        </div>

        {/* Complaint Information */}
        <div className="admin-details-card">
          <div className="admin-details-title">
            <h2>{complaint.title}</h2>

            <p>Complaint ID: {complaint.id}</p>
          </div>

          <div className="admin-information-grid">
            <div className="admin-information-item">
              <span>Category</span>

              <strong>{complaint.category}</strong>
            </div>

            <div className="admin-information-item">
              <span>Location</span>

              <strong>{complaint.location}</strong>
            </div>

            <div className="admin-information-item">
              <span>Submitted Date</span>

              <strong>{complaint.date}</strong>
            </div>

            <div className="admin-information-item">
              <span>Current Status</span>

              <strong>{complaint.status}</strong>
            </div>
          </div>

          {/* Description */}
          <div className="admin-description">
            <h3>Complaint Description</h3>

            <p>{complaint.description}</p>
          </div>
        </div>

        {/* Citizen Information */}
        <div className="admin-details-card">
          <h2>Citizen Information</h2>

          <div className="admin-information-grid">
            <div className="admin-information-item">
              <span>Citizen</span>

              <strong>{complaint.citizen || "Not Available"}</strong>
            </div>

            <div className="admin-information-item">
              <span>Email</span>

              <strong>{complaint.email || "Not Available"}</strong>
            </div>
          </div>
        </div>

        {/* Worker Information */}
        <div className="admin-details-card">
          <h2>Worker Assignment</h2>

          <div className="admin-worker-assignment">
            <div>
              <span>Current Worker</span>

              <strong>
                {complaint.assignedWorker
                  ? complaint.assignedWorker
                  : "Not Assigned"}
              </strong>
            </div>

            <div>
              <label htmlFor="worker">Reassign Worker</label>

              <select
                id="worker"
                defaultValue=""
                onChange={handleReassignWorker}
              >
                <option value="">Select Worker</option>

                <option value="Amit Kumar">Amit Kumar</option>

                <option value="Ravi Singh">Ravi Singh</option>

                <option value="Neeraj Verma">Neeraj Verma</option>
              </select>
            </div>
          </div>
        </div>

        {/* Work Progress */}
        <div className="admin-details-card">
          <h2>Work Progress</h2>

          <div className="admin-progress-section">
            <div className="admin-progress-header">
              <span>Completion Progress</span>

              <strong>{complaint.progress || 0}%</strong>
            </div>

            <div className="admin-progress-background">
              <div
                className="admin-progress-fill"
                style={{
                  width: `${complaint.progress || 0}%`,
                }}
              ></div>
            </div>
          </div>

          {/* Work Notes */}
          <div className="admin-description">
            <h3>Work Notes</h3>

            <p>
              {complaint.workNotes
                ? complaint.workNotes
                : "No work notes submitted yet."}
            </p>
          </div>

          {/* Evidence */}
          <div className="admin-description">
            <h3>Work Evidence</h3>

            <p>
              {complaint.evidence
                ? complaint.evidence
                : "No evidence uploaded."}
            </p>
          </div>
        </div>

        {/* Citizen Verification */}
        <div className="admin-details-card">
          <h2>Citizen Verification</h2>

          <p>
            {complaint.citizenVerified
              ? "✓ Resolution verified by citizen."
              : complaint.status === "Completed"
                ? "Waiting for citizen verification."
                : "Citizen verification is not available yet."}
          </p>
        </div>
      </main>
    </div>
  );
}

export default AdminComplaintDetails;
