import { Link, useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { apiRequest, API_BASE_URL } from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import "../../App.css";

function ComplaintReview() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { token, user, logout } = useAuth();

  const complaintId = Number(String(id).replace("CMP", ""));

  const [complaint, setComplaint] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState("");
  const [remarks, setRemarks] = useState("");

  const [loading, setLoading] = useState(true);
  const [workersLoading, setWorkersLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Photograph gallery states
  const [evidencePhotos, setEvidencePhotos] = useState([]);
  const [evidenceLoading, setEvidenceLoading] = useState(true);
  const [evidenceError, setEvidenceError] = useState("");

  // Fetch complaint details
  const fetchComplaint = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest("/api/officer/complaints", {}, token);

      const foundComplaint = (data.complaints || []).find(
        (item) => Number(item.complaint_id) === complaintId,
      );

      setComplaint(foundComplaint || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [complaintId, token]);

  // Fetch department workers
  const fetchWorkers = useCallback(async () => {
    try {
      setWorkersLoading(true);

      const data = await apiRequest("/api/officer/workers", {}, token);

      setWorkers(data.workers || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setWorkersLoading(false);
    }
  }, [token]);

  // Fetch complaint photographs
  useEffect(() => {
    if (!token || !complaintId) return;

    let cancelled = false;
    const imageUrls = [];

    const fetchEvidence = async () => {
      try {
        setEvidenceLoading(true);
        setEvidenceError("");
        setEvidencePhotos([]);

        const data = await apiRequest(
          `/api/complaints/${complaintId}/evidence`,
          {},
          token,
        );

        const photographs = data.photographs || [];

        // Load each photograph independently
        const results = await Promise.allSettled(
          photographs.map(async (photo) => {
            const response = await fetch(`${API_BASE_URL}${photo.file_url}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (!response.ok) {
              throw new Error("Unable to load photograph");
            }

            const blob = await response.blob();
            const imageUrl = URL.createObjectURL(blob);

            imageUrls.push(imageUrl);

            return {
              ...photo,
              imageUrl,
            };
          }),
        );

        const loadedPhotos = results
          .filter((result) => result.status === "fulfilled")
          .map((result) => result.value);

        if (!cancelled) {
          setEvidencePhotos(loadedPhotos);

          if (photographs.length > 0 && loadedPhotos.length === 0) {
            setEvidenceError("Photographs were found but could not be loaded.");
          }
        }
      } catch (err) {
        if (!cancelled) {
          setEvidenceError(err.message);
        }
      } finally {
        if (!cancelled) {
          setEvidenceLoading(false);
        }
      }
    };

    fetchEvidence();

    return () => {
      cancelled = true;
      imageUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [complaintId, token]);

  // Initial data loading
  useEffect(() => {
    if (token && Number.isInteger(complaintId) && complaintId > 0) {
      fetchComplaint();
    } else {
      setLoading(false);
      setError("Invalid complaint ID.");
    }
  }, [token, complaintId, fetchComplaint]);

  useEffect(() => {
    if (token) {
      fetchWorkers();
    }
  }, [token, fetchWorkers]);

  // Refresh after an action
  const refreshAfterAction = async (message) => {
    setSuccess(message);
    setRemarks("");
    setSelectedWorker("");
    await fetchComplaint();
  };

  // Verify complaint
  const handleVerify = async () => {
    if (remarks.trim().length < 3) {
      setError("Please enter remarks of at least 3 characters.");
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      await apiRequest(
        `/api/officer/complaints/${complaintId}/verify`,
        {
          method: "PATCH",
          body: JSON.stringify({
            remarks: remarks.trim(),
          }),
        },
        token,
      );

      await refreshAfterAction("Complaint verified successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Reject complaint
  const handleReject = async () => {
    if (remarks.trim().length < 3) {
      setError("Please enter rejection remarks of at least 3 characters.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to reject this complaint?",
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      await apiRequest(
        `/api/officer/complaints/${complaintId}/reject`,
        {
          method: "PATCH",
          body: JSON.stringify({
            remarks: remarks.trim(),
          }),
        },
        token,
      );

      await refreshAfterAction("Complaint rejected successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Assign worker
  const handleAssignWorker = async () => {
    if (!selectedWorker) {
      setError("Please select a field worker first.");
      return;
    }

    if (remarks.trim().length < 3) {
      setError("Please enter assignment remarks of at least 3 characters.");
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      await apiRequest(
        `/api/officer/complaints/${complaintId}/assign`,
        {
          method: "POST",
          body: JSON.stringify({
            worker_id: Number(selectedWorker),
            remarks: remarks.trim(),
          }),
        },
        token,
      );

      await refreshAfterAction("Worker assigned successfully.");
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

  // Loading screen
  if (loading) {
    return (
      <div className="officer-review-page">
        <nav className="officer-navbar">
          <h2>Smart City</h2>
          <div className="officer-nav-right">
            <span>{user?.name || "Officer"}</span>
            <button onClick={handleLogout}>Logout</button>
          </div>
        </nav>

        <main className="review-container">
          <p>Loading complaint details...</p>
        </main>
      </div>
    );
  }

  // Complaint not found
  if (!complaint) {
    return (
      <div className="officer-review-page">
        <nav className="officer-navbar">
          <h2>Smart City</h2>
          <div className="officer-nav-right">
            <span>{user?.name || "Officer"}</span>
            <button onClick={handleLogout}>Logout</button>
          </div>
        </nav>

        <main className="review-container">
          <h1>Complaint Not Found</h1>
          <p>{error || `No complaint was found with ID: ${id}`}</p>

          <Link to="/officer/dashboard" className="back-link">
            ← Back to Dashboard
          </Link>
        </main>
      </div>
    );
  }

  const isPending = complaint.status === "Pending Verification";
  const isVerified = complaint.status === "Verified";
  const isAssigned = complaint.status === "Assigned";

  return (
    <div className="officer-review-page">
      {/* Navbar */}
      <nav className="officer-navbar">
        <h2>Smart City</h2>

        <div className="officer-nav-right">
          <span>{user?.name || "Officer"}</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </nav>

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

          <span className="review-status">{complaint.status}</span>
        </div>

        {/* Messages */}
        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError("")}>×</button>
          </div>
        )}

        {success && <div className="success-message">{success}</div>}

        {/* Complaint Information */}
        <div className="review-card">
          <div className="review-title">
            <h2>{complaint.title}</h2>
            <p>Complaint ID: {formatComplaintId(complaint.complaint_id)}</p>
          </div>

          <div className="review-information">
            <div className="review-item">
              <span>Category</span>
              <strong>{complaint.category_name}</strong>
            </div>

            <div className="review-item">
              <span>Location</span>
              <strong>{complaint.location}</strong>
            </div>

            <div className="review-item">
              <span>Submitted Date</span>
              <strong>{formatDate(complaint.created_at)}</strong>
            </div>

            <div className="review-item">
              <span>Citizen</span>
              <strong>{complaint.citizen_name}</strong>
            </div>

            <div className="review-item">
              <span>Email</span>
              <strong>{complaint.citizen_email}</strong>
            </div>

            <div className="review-item">
              <span>Status</span>
              <strong>{complaint.status}</strong>
            </div>
          </div>

          <div className="review-description">
            <h3>Description</h3>
            <p>{complaint.description}</p>
          </div>
        </div>

        {/* Complaint Photograph Gallery */}
        <div className="review-card officer-evidence-card">
          <div className="review-title">
            <h2>Complaint Photographs</h2>
            <p>View photographs uploaded for this complaint.</p>
          </div>

          {evidenceLoading ? (
            <p>Loading photographs...</p>
          ) : evidenceError ? (
            <p className="error-message">{evidenceError}</p>
          ) : evidencePhotos.length === 0 ? (
            <p>No photographs uploaded for this complaint.</p>
          ) : (
            <div className="officer-photo-gallery">
              {evidencePhotos.map((photo) => (
                <a
                  key={photo.evidence_id}
                  href={photo.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="officer-photo-item"
                >
                  <img src={photo.imageUrl} alt="Complaint evidence" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Officer Action */}
        {isPending && (
          <div className="action-card">
            <h2>Officer Action</h2>
            <p>Review the complaint and select an appropriate action.</p>

            <div className="assignment-form">
              <div>
                <label htmlFor="remarks">Officer Remarks</label>
                <textarea
                  id="remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter your remarks..."
                  rows="3"
                  maxLength="500"
                />
              </div>

              <div className="action-buttons">
                <button
                  className="verify-button"
                  onClick={handleVerify}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Processing..." : "✓ Verify Complaint"}
                </button>

                <button
                  className="reject-button"
                  onClick={handleReject}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Processing..." : "✕ Reject Complaint"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Worker Assignment */}
        {isVerified && (
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
                  disabled={workersLoading || actionLoading}
                >
                  <option value="">
                    {workersLoading ? "Loading workers..." : "Select a worker"}
                  </option>

                  {workers.map((worker) => (
                    <option key={worker.worker_id} value={worker.worker_id}>
                      {worker.name} ({worker.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="assignmentRemarks">Assignment Remarks</label>
                <textarea
                  id="assignmentRemarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter assignment remarks..."
                  rows="3"
                  maxLength="500"
                />
              </div>

              <button
                className="assign-button"
                onClick={handleAssignWorker}
                disabled={
                  actionLoading || workersLoading || workers.length === 0
                }
              >
                {actionLoading ? "Assigning..." : "Assign Worker"}
              </button>

              {!workersLoading && workers.length === 0 && (
                <p>No workers are available in your department.</p>
              )}
            </div>
          </div>
        )}

        {/* Assigned Worker */}
        {isAssigned && (
          <div className="assignment-card">
            <h2>Worker Assigned</h2>
            <p>This complaint has been assigned successfully.</p>
            <p>
              The assigned worker will see this task in their Worker Dashboard.
            </p>
          </div>
        )}

        {/* Rejected */}
        {complaint.status === "Rejected" && (
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
