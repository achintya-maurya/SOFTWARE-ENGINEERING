import { Link, useParams } from "react-router-dom";
import { useComplaints } from "../../context/ComplaintContext";

function ComplaintDetails() {
  const { id } = useParams();

  const { complaints, updateComplaint } = useComplaints();

  // Find the actual complaint from shared Context
  const complaint = complaints.find((item) => item.id === id);

  // Complaint not found
  if (!complaint) {
    return (
      <div className="complaint-details-page">
        <div className="details-container">
          <Link to="/citizen/complaints" className="back-link">
            ← Back to My Complaints
          </Link>

          <div className="details-card">
            <h1>Complaint Not Found</h1>

            <p>No complaint was found with ID: {id}</p>
          </div>
        </div>
      </div>
    );
  }

  // Status helper functions
  const isVerified =
    complaint.status === "Verified" ||
    complaint.status === "Assigned" ||
    complaint.status === "Accepted" ||
    complaint.status === "In Progress" ||
    complaint.status === "Completed" ||
    complaint.status === "Resolved";

  const isAssigned =
    complaint.status === "Assigned" ||
    complaint.status === "Accepted" ||
    complaint.status === "In Progress" ||
    complaint.status === "Completed" ||
    complaint.status === "Resolved";

  const isCompleted =
    complaint.status === "Completed" || complaint.status === "Resolved";

  const isResolved = complaint.status === "Resolved";

  // Citizen verifies the completed work
  const handleVerifyResolution = () => {
    updateComplaint(id, {
      status: "Resolved",
      citizenVerified: true,
    });
  };

  // Citizen reopens the completed complaint
  const handleReopenComplaint = () => {
    updateComplaint(id, {
      status: "Reopened",
      citizenVerified: false,
    });
  };

  return (
    <div className="complaint-details-page">
      <div className="details-container">
        {/* Back Button */}
        <Link to="/citizen/complaints" className="back-link">
          ← Back to My Complaints
        </Link>

        {/* Header */}
        <div className="details-header">
          <div>
            <h1>Complaint Details</h1>

            <p>View information and progress of your complaint.</p>
          </div>

          <span
            className={`status-badge ${complaint.status
              .toLowerCase()
              .replace(" ", "-")}`}
          >
            {complaint.status}
          </span>
        </div>

        {/* Complaint Information */}
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

          {/* Description */}
          <div className="description-section">
            <h3>Description</h3>

            <p>{complaint.description}</p>
          </div>

          {/* Worker Information */}
          {complaint.assignedWorker && (
            <div className="description-section">
              <h3>Assigned Field Worker</h3>

              <p>{complaint.assignedWorker}</p>
            </div>
          )}

          {/* Work Completion Information */}
          {isCompleted && (
            <div className="description-section">
              <h3>Work Completion Details</h3>

              <p>
                <strong>Progress:</strong> {complaint.progress || 0}%
              </p>

              {complaint.workNotes && (
                <p>
                  <strong>Work Notes:</strong> {complaint.workNotes}
                </p>
              )}

              <p>
                <strong>Evidence:</strong>{" "}
                {complaint.evidence ? complaint.evidence : "Not uploaded"}
              </p>
            </div>
          )}
        </div>

        {/* Complaint Timeline */}
        <div className="timeline-card">
          <h2>Complaint Timeline</h2>

          <div className="timeline">
            {/* 1. Complaint Submitted */}
            <div className="timeline-item completed">
              <div className="timeline-dot">✓</div>

              <div>
                <h3>Complaint Submitted</h3>

                <p>{complaint.date}</p>
              </div>
            </div>

            {/* 2. Officer Verification */}
            <div className={`timeline-item ${isVerified ? "completed" : ""}`}>
              <div className="timeline-dot">{isVerified ? "✓" : "2"}</div>

              <div>
                <h3>Officer Verification</h3>

                <p>
                  {isVerified ? "Complaint verified by officer" : "Pending"}
                </p>
              </div>
            </div>

            {/* 3. Worker Assigned */}
            <div className={`timeline-item ${isAssigned ? "completed" : ""}`}>
              <div className="timeline-dot">{isAssigned ? "✓" : "3"}</div>

              <div>
                <h3>Worker Assigned</h3>

                <p>
                  {isAssigned
                    ? complaint.assignedWorker
                      ? `Assigned to ${complaint.assignedWorker}`
                      : "Worker assigned"
                    : "Pending"}
                </p>
              </div>
            </div>

            {/* 4. Work Completed */}
            <div className={`timeline-item ${isCompleted ? "completed" : ""}`}>
              <div className="timeline-dot">{isCompleted ? "✓" : "4"}</div>

              <div>
                <h3>Work Completed</h3>

                <p>{isCompleted ? "Field work completed" : "Pending"}</p>
              </div>
            </div>

            {/* 5. Citizen Verification */}
            <div className={`timeline-item ${isResolved ? "completed" : ""}`}>
              <div className="timeline-dot">{isResolved ? "✓" : "5"}</div>

              <div>
                <h3>Citizen Verification</h3>

                <p>
                  {isResolved ? "Resolution verified by citizen" : "Pending"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Citizen Action */}
        {complaint.status === "Completed" && (
          <div className="citizen-resolution-card">
            <h2>Verify Resolution</h2>

            <p>
              The field worker has completed the work. Please verify whether the
              complaint has been resolved satisfactorily.
            </p>

            <div className="citizen-resolution-actions">
              <button
                className="verify-resolution-button"
                onClick={handleVerifyResolution}
              >
                ✓ Verify Resolution
              </button>

              <button
                className="reopen-complaint-button"
                onClick={handleReopenComplaint}
              >
                ↻ Reopen Complaint
              </button>
            </div>
          </div>
        )}

        {/* Resolved Message */}
        {complaint.status === "Resolved" && (
          <div className="citizen-resolved-card">
            <h2>Complaint Resolved</h2>

            <p>
              You have verified the resolution. This complaint has been
              successfully resolved.
            </p>
          </div>
        )}

        {/* Reopened Message */}
        {complaint.status === "Reopened" && (
          <div className="citizen-reopened-card">
            <h2>Complaint Reopened</h2>

            <p>
              The complaint has been reopened and requires further action from
              the civic department.
            </p>

            <p>The complaint will be reviewed again by the officer.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ComplaintDetails;
