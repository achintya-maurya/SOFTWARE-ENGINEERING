import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { apiRequest, API_BASE_URL } from "../../api/api";
import { useAuth } from "../../context/AuthContext";

function WorkerTaskDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user, logout } = useAuth();

  const complaintId = Number(String(id).replace("CMP", ""));

  const [assignment, setAssignment] = useState(null);
  const [progress, setProgress] = useState(0);
  const [workNotes, setWorkNotes] = useState("");

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [uploadedEvidenceCount, setUploadedEvidenceCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Create and clean up photograph previews.
  useEffect(() => {
    const urls = selectedFiles.map((file) => URL.createObjectURL(file));

    setPreviewUrls(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [selectedFiles]);

  // Fetch the logged-in worker's assignments.
  const fetchTask = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest("/api/worker/complaints", {}, token);

      const foundAssignment = (data.assignments || []).find(
        (item) => Number(item.complaint.complaint_id) === complaintId,
      );

      if (!foundAssignment) {
        setAssignment(null);
        return;
      }

      setAssignment(foundAssignment);
      setProgress(foundAssignment.progress ?? 0);
      setWorkNotes(foundAssignment.work_notes || "");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [complaintId, token]);

  useEffect(() => {
    if (token && Number.isInteger(complaintId) && complaintId > 0) {
      fetchTask();
    } else {
      setLoading(false);
      setError("Invalid complaint ID.");
    }
  }, [token, complaintId, fetchTask]);

  // Refresh task after successful backend action.
  const refreshTask = async (message) => {
    setSuccess(message);
    await fetchTask();
  };

  // Accept task.
  const handleAcceptTask = async () => {
    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      await apiRequest(
        `/api/worker/assignments/${assignment.assignment_id}/accept`,
        { method: "PATCH" },
        token,
      );

      await refreshTask("Task accepted successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Start work.
  const handleStartWork = async () => {
    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      await apiRequest(
        `/api/worker/assignments/${assignment.assignment_id}/start`,
        { method: "PATCH" },
        token,
      );

      await refreshTask("Work started successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Save progress and work notes in PostgreSQL.
  const saveProgress = async (progressValue, notesValue) => {
    const query = new URLSearchParams({
      progress: String(progressValue),
      work_notes: notesValue,
    });

    return apiRequest(
      `/api/worker/assignments/${assignment.assignment_id}/progress?${query.toString()}`,
      { method: "PATCH" },
      token,
    );
  };

  const handleSaveProgress = async () => {
    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      await saveProgress(progress, workNotes);

      await refreshTask("Progress and work notes saved successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Validate selected photographs.
  const handleFileChange = (event) => {
    setError("");
    setSuccess("");

    const files = Array.from(event.target.files || []);

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (files.length > 3) {
      setError("You can select a maximum of 3 photographs.");
      event.target.value = "";
      return;
    }

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        setError("Only JPG, PNG and WEBP photographs are allowed.");
        event.target.value = "";
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError(`${file.name} exceeds the 5 MB size limit.`);
        event.target.value = "";
        return;
      }
    }

    setSelectedFiles(files);
  };

  // Upload selected photographs to FastAPI.
  const handleUploadEvidence = async () => {
    if (progress !== 100) {
      setError(
        "Please save your work progress at 100% before uploading completion photographs.",
      );
      return;
    }

    if (selectedFiles.length === 0) {
      setError("Please select at least one photograph.");
      return;
    }

    if (uploadedEvidenceCount + selectedFiles.length > 3) {
      setError("You can upload a maximum of 3 photographs.");
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      let uploadedCount = 0;

      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(
          `${API_BASE_URL}/api/worker/assignments/${assignment.assignment_id}/evidence`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          },
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.detail || `Unable to upload ${file.name}.`);
        }

        uploadedCount += 1;
        setUploadedEvidenceCount((previous) => previous + 1);
      }

      setSelectedFiles([]);

      setSuccess(
        `${uploadedCount} completion photograph(s) uploaded successfully.`,
      );
    } catch (err) {
      setError(err.message || "Photograph upload failed.");
    } finally {
      setActionLoading(false);
    }
  };

  // Complete task only after photograph upload.
  const handleCompleteTask = async () => {
    if (progress !== 100) {
      setError("Please set work progress to 100% before completing.");
      return;
    }

    if (workNotes.trim().length === 0) {
      setError("Please add work notes before completing the task.");
      return;
    }

    if (uploadedEvidenceCount === 0) {
      setError(
        "Please upload at least one completion photograph before completing the task.",
      );
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to mark this task as completed?",
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      await saveProgress(100, workNotes);

      await apiRequest(
        `/api/worker/assignments/${assignment.assignment_id}/complete`,
        { method: "PATCH" },
        token,
      );

      await refreshTask(
        "Task completed successfully. It is now waiting for citizen verification.",
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const formatComplaintId = (value) => `CMP${String(value).padStart(4, "0")}`;

  const formatDate = (value) => {
    if (!value) return "N/A";

    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // Loading screen.
  if (loading) {
    return (
      <div className="worker-task-page">
        <nav className="worker-navbar">
          <h2>Smart City</h2>
          <div className="worker-nav-right">
            <span>{user?.name || "Field Worker"}</span>
            <button onClick={handleLogout}>Logout</button>
          </div>
        </nav>

        <main className="worker-task-container">
          <p>Loading task details...</p>
        </main>
      </div>
    );
  }

  // Task not found.
  if (!assignment) {
    return (
      <div className="worker-task-page">
        <nav className="worker-navbar">
          <h2>Smart City</h2>
          <div className="worker-nav-right">
            <span>{user?.name || "Field Worker"}</span>
            <button onClick={handleLogout}>Logout</button>
          </div>
        </nav>

        <main className="worker-task-container">
          <h1>Task Not Found</h1>
          <p>{error || `No task was found with ID: ${id}`}</p>

          <Link to="/worker/dashboard" className="back-link">
            ← Back to Dashboard
          </Link>
        </main>
      </div>
    );
  }

  const task = assignment.complaint;
  const status = assignment.assignment_status;

  return (
    <div className="worker-task-page">
      <nav className="worker-navbar">
        <h2>Smart City</h2>

        <div className="worker-nav-right">
          <span>{user?.name || "Field Worker"}</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <main className="worker-task-container">
        <Link to="/worker/dashboard" className="back-link">
          ← Back to Dashboard
        </Link>

        <div className="worker-task-header">
          <div>
            <h1>Task Details</h1>
            <p>View and update the details of your assigned complaint.</p>
          </div>

          <span className="worker-task-status">{status}</span>
        </div>

        {error && (
          <div className="error-message" role="alert">
            {error}
            <button onClick={() => setError("")}>×</button>
          </div>
        )}

        {success && (
          <div className="success-message" role="status">
            {success}
          </div>
        )}

        {/* Complaint Details */}
        <div className="worker-task-details-card">
          <div className="worker-task-title">
            <h2>{task.title}</h2>
            <p>Complaint ID: {formatComplaintId(task.complaint_id)}</p>
          </div>

          <div className="worker-task-information">
            <div className="worker-task-item">
              <span>Category</span>
              <strong>{task.category_name}</strong>
            </div>

            <div className="worker-task-item">
              <span>Location</span>
              <strong>{task.location}</strong>
            </div>

            <div className="worker-task-item">
              <span>Assigned Date</span>
              <strong>{formatDate(assignment.assigned_at)}</strong>
            </div>

            <div className="worker-task-item">
              <span>Assigned By</span>
              <strong>Department Officer</strong>
            </div>

            <div className="worker-task-item">
              <span>Current Status</span>
              <strong>{status}</strong>
            </div>

            <div className="worker-task-item">
              <span>Progress</span>
              <strong>{assignment.progress ?? 0}%</strong>
            </div>
          </div>

          <div className="worker-task-description">
            <h3>Complaint Description</h3>
            <p>{task.description}</p>
          </div>
        </div>

        {/* Worker Action */}
        <div className="worker-action-card">
          <h2>Worker Action</h2>
          <p>Review the task details and update the work status.</p>

          {/* STEP 1: ACCEPT TASK */}
          {status === "Assigned" && (
            <button
              className="accept-task-button"
              onClick={handleAcceptTask}
              disabled={actionLoading}
            >
              {actionLoading ? "Processing..." : "✓ Accept Task"}
            </button>
          )}

          {/* STEP 2: START WORK */}
          {status === "Accepted" && (
            <div>
              <div className="task-success-message">
                <strong>✓ Task Accepted</strong>
                <p>
                  You have accepted this task. Start the work when you are
                  ready.
                </p>
              </div>

              <button
                className="start-work-button"
                onClick={handleStartWork}
                disabled={actionLoading}
              >
                {actionLoading ? "Starting..." : "▶ Start Work"}
              </button>
            </div>
          )}

          {/* STEP 3: UPDATE PROGRESS AND UPLOAD EVIDENCE */}
          {status === "In Progress" && (
            <div className="progress-section">
              <h3>Update Work Progress</h3>

              <div className="progress-label">
                <span>Completion Progress</span>
                <strong>{progress}%</strong>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={progress}
                onChange={(event) => setProgress(Number(event.target.value))}
                className="progress-slider"
                disabled={actionLoading}
              />

              <div className="progress-bar-background">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>

              <div className="work-notes-section">
                <label htmlFor="workNotes">Work Notes</label>

                <textarea
                  id="workNotes"
                  placeholder="Describe the work completed so far..."
                  value={workNotes}
                  onChange={(event) => setWorkNotes(event.target.value)}
                  disabled={actionLoading}
                />
              </div>

              {/* Completion Photograph Upload */}
              <div className="evidence-section">
                <label htmlFor="evidence">
                  Upload Work Completion Photographs
                </label>

                <input
                  id="evidence"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleFileChange}
                  disabled={actionLoading || progress !== 100}
                />

                <p>
                  Upload up to 3 photographs. JPG, PNG or WEBP. Maximum 5 MB per
                  photograph.
                </p>

                {previewUrls.length > 0 && (
                  <div className="evidence-preview-list">
                    {previewUrls.map((url, index) => (
                      <div key={url}>
                        <img
                          src={url}
                          alt={`Selected completion evidence ${index + 1}`}
                          style={{
                            width: "130px",
                            height: "110px",
                            objectFit: "cover",
                            borderRadius: "8px",
                            margin: "8px",
                          }}
                        />
                        <p>{selectedFiles[index]?.name}</p>
                      </div>
                    ))}
                  </div>
                )}

                <p>
                  Successfully uploaded in this session:{" "}
                  <strong>{uploadedEvidenceCount}/3</strong>
                </p>

                <button
                  type="button"
                  className="start-work-button"
                  onClick={handleUploadEvidence}
                  disabled={
                    actionLoading ||
                    progress !== 100 ||
                    selectedFiles.length === 0 ||
                    uploadedEvidenceCount >= 3
                  }
                >
                  {actionLoading ? "Uploading..." : "Upload Photographs"}
                </button>
              </div>

              <button
                className="start-work-button"
                onClick={handleSaveProgress}
                disabled={actionLoading}
              >
                {actionLoading ? "Saving..." : "Save Progress"}
              </button>

              <button
                className="complete-task-button"
                onClick={handleCompleteTask}
                disabled={actionLoading || uploadedEvidenceCount === 0}
              >
                {actionLoading ? "Processing..." : "✓ Mark as Completed"}
              </button>
            </div>
          )}

          {/* STEP 4: COMPLETED */}
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
                  <strong>{assignment.progress ?? 0}%</strong>
                </div>

                <div>
                  <span>Work Notes</span>
                  <strong>{assignment.work_notes || "No notes added"}</strong>
                </div>

                <div>
                  <span>Evidence uploaded this session</span>
                  <strong>
                    {uploadedEvidenceCount > 0
                      ? `${uploadedEvidenceCount} photograph(s)`
                      : "Existing upload status not loaded"}
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
