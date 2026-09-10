import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import { useComplaints } from "../../context/ComplaintContext";

function ComplaintReview() {
  const { id } = useParams();

  // Get shared complaints from ComplaintContext
  const { complaints, updateComplaint } = useComplaints();

  // Find complaint according to URL ID
  const selectedComplaint = complaints.find((complaint) => complaint.id === id);

  // If complaint doesn't exist
  if (!selectedComplaint) {
    return (
      <div className="officer-review-page">
        <nav className="officer-navbar">
          <h2>Smart City</h2>

          <div className="officer-nav-right">
            <span>Officer</span>

            <Link to="/">Logout</Link>
          </div>
        </nav>

        <main className="review-container">
          <h1>Complaint Not Found</h1>

          <p>No complaint was found with ID: {id}</p>

          <Link to="/officer/dashboard" className="back-link">
            ← Back to Dashboard
          </Link>
        </main>
      </div>
    );
  }

  // Selected worker
  const [selectedWorker, setSelectedWorker] = useState("");

  // Verify complaint
  const handleVerify = () => {
    updateComplaint(id, {
      status: "Verified",
    });
  };

  // Reject complaint
  const handleReject = () => {
    updateComplaint(id, {
      status: "Rejected",
      assignedWorker: null,
    });
  };

  // Assign worker
  const handleAssignWorker = () => {
    if (selectedWorker === "") {
      alert("Please select a field worker first.");
      return;
    }

    updateComplaint(id, {
      status: "Assigned",
      assignedWorker: selectedWorker,
    });
  };

  return (
    <div className="officer-review-page">
      {/* Navbar */}
      <nav className="officer-navbar">
        <h2>Smart City</h2>

        <div className="officer-nav-right">
          <span>Officer</span>

          <Link to="/">Logout</Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="review-container">
        {/* Back */}
        <Link to="/officer/dashboard" className="back-link">
          ← Back to Dashboard
        </Link>

        {/* Header */}
        <div className="review-header">
          <div>
            <h1>Review Complaint</h1>

            <p>Verify the complaint details before taking action.</p>
          </div>

          <span className="review-status">{selectedComplaint.status}</span>
        </div>

        {/* Complaint Information */}
        <div className="review-card">
          <div className="review-title">
            <h2>{selectedComplaint.title}</h2>

            <p>Complaint ID: {selectedComplaint.id}</p>
          </div>

          {/* Information */}
          <div className="review-information">
            <div className="review-item">
              <span>Category</span>

              <strong>{selectedComplaint.category}</strong>
            </div>

            <div className="review-item">
              <span>Location</span>

              <strong>{selectedComplaint.location}</strong>
            </div>

            <div className="review-item">
              <span>Submitted Date</span>

              <strong>{selectedComplaint.date}</strong>
            </div>

            <div className="review-item">
              <span>Citizen</span>

              <strong>{selectedComplaint.citizen}</strong>
            </div>

            <div className="review-item">
              <span>Email</span>

              <strong>{selectedComplaint.email}</strong>
            </div>

            <div className="review-item">
              <span>Status</span>

              <strong>{selectedComplaint.status}</strong>
            </div>
          </div>

          {/* Description */}
          <div className="review-description">
            <h3>Description</h3>

            <p>{selectedComplaint.description}</p>
          </div>
        </div>

        {/* Officer Action */}
        <div className="action-card">
          <h2>Officer Action</h2>

          <p>Review the complaint and select an appropriate action.</p>

          <div className="action-buttons">
            <button
              className="verify-button"
              onClick={handleVerify}
              disabled={
                selectedComplaint.status === "Rejected" ||
                selectedComplaint.status === "Assigned"
              }
            >
              ✓ Verify Complaint
            </button>

            <button
              className="reject-button"
              onClick={handleReject}
              disabled={selectedComplaint.status === "Assigned"}
            >
              ✕ Reject Complaint
            </button>
          </div>
        </div>

        {/* Worker Assignment */}
        {selectedComplaint.status === "Verified" && (
          <div className="assignment-card">
            <h2>Assign Field Worker</h2>

            <p>Complaint has been verified. Assign it to a field worker.</p>

            <div className="assignment-form">
              <div>
                <label htmlFor="worker">Select Field Worker</label>

                <select
                  id="worker"
                  value={selectedWorker}
                  onChange={(e) => setSelectedWorker(e.target.value)}
                >
                  <option value="">Select a worker</option>

                  <option value="Amit Kumar">Amit Kumar</option>

                  <option value="Ravi Singh">Ravi Singh</option>

                  <option value="Neeraj Verma">Neeraj Verma</option>
                </select>
              </div>

              <button className="assign-button" onClick={handleAssignWorker}>
                Assign Worker
              </button>
            </div>
          </div>
        )}

        {/* Assigned Worker */}
        {selectedComplaint.status === "Assigned" && (
          <div className="assignment-card">
            <h2>Worker Assigned</h2>

            <p>This complaint has been assigned successfully.</p>

            <div className="assigned-worker">
              <strong>Field Worker:</strong> {selectedComplaint.assignedWorker}
            </div>
          </div>
        )}

        {/* Rejected */}
        {selectedComplaint.status === "Rejected" && (
          <div className="rejected-card">
            <h2>Complaint Rejected</h2>

            <p>This complaint has been rejected by the officer.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default ComplaintReview;
