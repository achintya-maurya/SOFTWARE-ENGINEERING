import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import { useComplaints } from "../../context/ComplaintContext";

function WorkerTaskDetails() {
  const { id } = useParams();

  const { complaints, updateComplaint } = useComplaints();

  // Find complaint according to URL ID
  const selectedTask = complaints.find((complaint) => complaint.id === id);

  // Work notes and evidence are local form values until submitted
  const [workNotes, setWorkNotes] = useState(selectedTask?.workNotes || "");

  const [evidence, setEvidence] = useState(selectedTask?.evidence || null);

  // Task not found
  if (!selectedTask) {
    return (
      <div className="worker-task-page">
        {/* Navbar */}
        <nav className="worker-navbar">
          <h2>Smart City</h2>

          <div className="worker-nav-right">
            <span>Field Worker</span>

            <Link to="/">Logout</Link>
          </div>
        </nav>

        {/* Content */}
        <main className="worker-task-container">
          <h1>Task Not Found</h1>

          <p>No task was found with ID: {id}</p>

          <Link to="/worker/dashboard" className="back-link">
            ← Back to Dashboard
          </Link>
        </main>
      </div>
    );
  }

  // Current status and progress come directly from Context
  const status = selectedTask.status;
  const progress = selectedTask.progress || 0;

  // Accept Task
  const handleAcceptTask = () => {
    updateComplaint(id, {
      status: "Accepted",
    });
  };

  // Start Work
  const handleStartWork = () => {
    updateComplaint(id, {
      status: "In Progress",
      progress: 10,
    });
  };

  // Update progress
  const handleProgressChange = (event) => {
    const newProgress = Number(event.target.value);

    updateComplaint(id, {
      progress: newProgress,
    });
  };

  // Update work notes
  const handleWorkNotesChange = (event) => {
    setWorkNotes(event.target.value);
  };

  // Upload evidence
  const handleEvidenceChange = (event) => {
    const file = event.target.files[0];

    if (file) {
      setEvidence(file);
    }
  };

  // Mark task as completed
  const handleCompleteTask = () => {
    if (progress < 100) {
      alert(
        "Please complete the progress to 100% before marking the task as completed.",
      );
      return;
    }

    if (workNotes.trim() === "") {
      alert("Please add work notes before completing the task.");
      return;
    }

    updateComplaint(id, {
      status: "Completed",
      progress: 100,
      workNotes: workNotes,
      evidence: evidence ? evidence.name : null,
    });
  };

  return (
    <div className="worker-task-page">
      {/* Navbar */}
      <nav className="worker-navbar">
        <h2>Smart City</h2>

        <div className="worker-nav-right">
          <span>Field Worker</span>

          <Link to="/">Logout</Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="worker-task-container">
        {/* Back Button */}
        <Link to="/worker/dashboard" className="back-link">
          ← Back to Dashboard
        </Link>

        {/* Header */}
        <div className="worker-task-header">
          <div>
            <h1>Task Details</h1>

            <p>View and update the details of your assigned complaint.</p>
          </div>

          {/* Dynamic Status */}
          <span className="worker-task-status">{status}</span>
        </div>

        {/* Complaint Details */}
        <div className="worker-task-details-card">
          {/* Task Title */}
          <div className="worker-task-title">
            <h2>{selectedTask.title}</h2>

            <p>Complaint ID: {selectedTask.id}</p>
          </div>

          {/* Information */}
          <div className="worker-task-information">
            <div className="worker-task-item">
              <span>Category</span>

              <strong>{selectedTask.category}</strong>
            </div>

            <div className="worker-task-item">
              <span>Location</span>

              <strong>{selectedTask.location}</strong>
            </div>

            <div className="worker-task-item">
              <span>Assigned Date</span>

              <strong>{selectedTask.date}</strong>
            </div>

            <div className="worker-task-item">
              <span>Assigned By</span>

              <strong>Officer</strong>
            </div>

            <div className="worker-task-item">
              <span>Current Status</span>

              <strong>{status}</strong>
            </div>
          </div>

          {/* Description */}
          <div className="worker-task-description">
            <h3>Complaint Description</h3>

            <p>{selectedTask.description}</p>
          </div>
        </div>

        {/* Worker Action */}
        <div className="worker-action-card">
          <h2>Worker Action</h2>

          <p>Review the task details and update the work status.</p>

          {/* =====================================
              STEP 1: ACCEPT TASK
              ===================================== */}

          {status === "Assigned" && (
            <button className="accept-task-button" onClick={handleAcceptTask}>
              ✓ Accept Task
            </button>
          )}

          {/* =====================================
              STEP 2: ACCEPTED
              ===================================== */}

          {status === "Accepted" && (
            <div>
              <div className="task-success-message">
                <strong>✓ Task Accepted</strong>

                <p>
                  You have accepted this task. Start the work when you are
                  ready.
                </p>
              </div>

              <button className="start-work-button" onClick={handleStartWork}>
                ▶ Start Work
              </button>
            </div>
          )}

          {/* =====================================
              STEP 3: IN PROGRESS
              ===================================== */}

          {status === "In Progress" && (
            <div className="progress-section">
              <h3>Update Work Progress</h3>

              {/* Progress Percentage */}
              <div className="progress-label">
                <span>Completion Progress</span>

                <strong>{progress}%</strong>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={handleProgressChange}
                className="progress-slider"
              />

              {/* Progress Bar */}
              <div className="progress-bar-background">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${progress}%`,
                  }}
                ></div>
              </div>

              {/* Work Notes */}
              <div className="work-notes-section">
                <label htmlFor="workNotes">Work Notes</label>

                <textarea
                  id="workNotes"
                  placeholder="Describe the work completed so far..."
                  value={workNotes}
                  onChange={handleWorkNotesChange}
                ></textarea>
              </div>

              {/* Evidence */}
              <div className="evidence-section">
                <label htmlFor="evidence">Upload Work Evidence</label>

                <input
                  id="evidence"
                  type="file"
                  accept="image/*"
                  onChange={handleEvidenceChange}
                />

                {evidence && (
                  <p className="file-selected">✓ Selected: {evidence.name}</p>
                )}
              </div>

              {/* Complete Button */}
              <button
                className="complete-task-button"
                onClick={handleCompleteTask}
              >
                ✓ Mark as Completed
              </button>
            </div>
          )}

          {/* =====================================
              STEP 4: COMPLETED
              ===================================== */}

          {status === "Completed" && (
            <div className="completed-task-message">
              <div className="completed-icon">✓</div>

              <h3>Task Completed</h3>

              <p>
                The work has been completed and submitted for citizen
                verification.
              </p>

              <div className="completed-summary">
                <div>
                  <span>Progress</span>

                  <strong>{selectedTask.progress}%</strong>
                </div>

                <div>
                  <span>Work Notes</span>

                  <strong>{selectedTask.workNotes}</strong>
                </div>

                <div>
                  <span>Evidence</span>

                  <strong>
                    {selectedTask.evidence
                      ? selectedTask.evidence
                      : "Not uploaded"}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default WorkerTaskDetails;
