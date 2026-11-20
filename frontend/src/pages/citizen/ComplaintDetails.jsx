import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import "../../App.css";

import { apiRequest, API_BASE_URL } from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import { useComplaints } from "../../context/ComplaintContext";

function ComplaintDetails() {
  const { id } = useParams();

  const { token } = useAuth();
  const { refreshComplaints } = useComplaints();

  const [complaint, setComplaint] = useState(null);
  const [history, setHistory] = useState([]);
  const [evidence, setEvidence] = useState([]);

  const [loading, setLoading] = useState(true);
  const [evidenceError, setEvidenceError] = useState("");
  const [verifying, setVerifying] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Format date
  const formatDate = (dateValue) => {
    if (!dateValue) return "Not available";

    return new Date(dateValue).toLocaleString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Fetch complaint photographs using token authentication
  const fetchEvidence = async () => {
    setEvidenceError("");

    try {
      const evidenceData = await apiRequest(
        `/api/complaints/${id}/evidence`,
        { method: "GET" },
        token,
      );

      const photographs = evidenceData.photographs || [];

      // Download each protected image using the Bearer token
      const loadedPhotographs = await Promise.all(
        photographs.map(async (photo) => {
          try {
            const imageResponse = await fetch(
              `${API_BASE_URL}${photo.file_url}`,
              {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            );

            if (!imageResponse.ok) {
              throw new Error("Unable to load this photograph.");
            }

            const imageBlob = await imageResponse.blob();

            return {
              ...photo,
              imageUrl: URL.createObjectURL(imageBlob),
            };
          } catch (err) {
            console.error(`Error loading evidence ${photo.evidence_id}:`, err);
            return null;
          }
        }),
      );

      const validPhotographs = loadedPhotographs.filter(Boolean);

      setEvidence(validPhotographs);

      if (validPhotographs.length < photographs.length) {
        setEvidenceError(
          "Some photographs could not be loaded. Please refresh the page.",
        );
      }
    } catch (err) {
      setEvidence([]);
      setEvidenceError(err.message || "Unable to load complaint photographs.");
    }
  };

  // Fetch complaint details and status history
  const fetchComplaintDetails = async () => {
    if (!token) {
      setError("Please log in to view complaint details.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [complaintData, historyData] = await Promise.all([
        apiRequest(`/api/complaints/${id}`, { method: "GET" }, token),

        apiRequest(`/api/complaints/${id}/history`, { method: "GET" }, token),
      ]);

      setComplaint(complaintData);
      setHistory(historyData.history || []);

      // Fetch complaint and worker photographs
      await fetchEvidence();
    } catch (err) {
      setError(err.message || "Unable to load complaint details.");
    } finally {
      setLoading(false);
    }
  };

  // Load data whenever complaint ID or token changes
  useEffect(() => {
    fetchComplaintDetails();
  }, [id, token]);

  // Release image memory when the page or photographs change
  useEffect(() => {
    return () => {
      evidence.forEach((photo) => {
        URL.revokeObjectURL(photo.imageUrl);
      });
    };
  }, [evidence]);

  // Verify completed work through backend
  const handleVerifyResolution = async () => {
    setError("");
    setSuccess("");
    setVerifying(true);

    try {
      const response = await apiRequest(
        `/api/complaints/${id}/verify-completion`,
        { method: "PATCH" },
        token,
      );

      setSuccess(response.message || "Complaint successfully resolved.");

      // Fetch updated complaint, timeline and photographs
      await fetchComplaintDetails();

      // Refresh citizen dashboard and complaints list
      await refreshComplaints();
    } catch (err) {
      setError(err.message || "Unable to verify complaint resolution.");
    } finally {
      setVerifying(false);
    }
  };

  // Complaint loading
  if (loading) {
    return (
      <div className="complaint-details-page">
        <div className="details-container">
          <p>Loading complaint details...</p>
        </div>
      </div>
    );
  }

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
            <p>{error || `No complaint found with ID: ${id}`}</p>

            <button type="button" onClick={fetchComplaintDetails}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Status helpers
  const isResolved = complaint.status === "Resolved";

  const getStatusClass = (status) => {
    switch (status) {
      case "Pending Verification":
      case "Verified":
      case "Assigned":
      case "Reopened":
        return "pending";

      case "Accepted":
      case "In Progress":
      case "Completed":
        return "progress";

      case "Resolved":
        return "resolved";

      case "Rejected":
        return "rejected";

      default:
        return "";
    }
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

          <span className={`status-badge ${getStatusClass(complaint.status)}`}>
            {complaint.status}
          </span>
        </div>

        {/* Error Message */}
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}

        {/* Success Message */}
        {success && (
          <p className="success-message" role="status">
            {success}
          </p>
        )}

        {/* Complaint Information */}
        <div className="details-card">
          <div className="complaint-title-section">
            <h2>{complaint.title}</h2>

            <p>
              Complaint ID: CMP
              {String(complaint.complaint_id).padStart(4, "0")}
            </p>
          </div>

          <div className="information-grid">
            <div className="information-item">
              <span>Category</span>
              <strong>{complaint.category_name}</strong>
            </div>

            <div className="information-item">
              <span>Department</span>
              <strong>{complaint.department_name}</strong>
            </div>

            <div className="information-item">
              <span>Location</span>
              <strong>{complaint.location}</strong>
            </div>

            <div className="information-item">
              <span>Submitted Date</span>
              <strong>{formatDate(complaint.created_at)}</strong>
            </div>

            <div className="information-item">
              <span>Last Updated</span>
              <strong>{formatDate(complaint.updated_at)}</strong>
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
        </div>

        {/* Complaint and Worker Photographs */}
        <div className="details-card">
          <h2>Complaint Photographs & Work Evidence</h2>

          <p>
            View the photographs submitted by the citizen and field worker.
            Review the work evidence before verifying the resolution.
          </p>

          {evidenceError && (
            <p className="error-message" role="alert">
              {evidenceError}
            </p>
          )}

          {evidence.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: "20px",
                marginTop: "20px",
              }}
            >
              {evidence.map((photo, index) => (
                <div
                  key={photo.evidence_id}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "10px",
                    background: "#ffffff",
                  }}
                >
                  <a
                    href={photo.imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src={photo.imageUrl}
                      alt={`Complaint evidence ${index + 1}`}
                      style={{
                        width: "100%",
                        height: "160px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        cursor: "pointer",
                      }}
                    />
                  </a>

                  <p style={{ margin: "10px 0 5px", fontWeight: "600" }}>
                    Photograph {index + 1}
                  </p>

                  <small style={{ color: "#64748b" }}>
                    Uploaded: {formatDate(photo.uploaded_at)}
                  </small>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ marginTop: "15px", color: "#64748b" }}>
              No photographs have been uploaded for this complaint yet.
            </p>
          )}

          <button
            type="button"
            onClick={fetchEvidence}
            style={{ marginTop: "20px" }}
          >
            Refresh Photographs
          </button>
        </div>

        {/* Complaint Timeline */}
        <div className="timeline-card">
          <h2>Complaint Timeline</h2>

          <div className="timeline">
            {history.length > 0 ? (
              history.map((item) => (
                <div className="timeline-item completed" key={item.history_id}>
                  <div className="timeline-dot">✓</div>

                  <div>
                    <h3>{item.new_status}</h3>
                    <p>{formatDate(item.changed_at)}</p>

                    {item.remarks && <p>{item.remarks}</p>}
                  </div>
                </div>
              ))
            ) : (
              <p>No status history available.</p>
            )}
          </div>
        </div>

        {/* Citizen Verification */}
        {complaint.status === "Completed" && (
          <div className="citizen-resolution-card">
            <h2>Verify Resolution</h2>

            <p>
              The field worker has completed the work. Please review the
              uploaded photographs and verify whether the complaint has been
              resolved satisfactorily.
            </p>

            <div className="citizen-resolution-actions">
              <button
                type="button"
                className="verify-resolution-button"
                onClick={handleVerifyResolution}
                disabled={verifying}
              >
                {verifying ? "Verifying..." : "✓ Verify Resolution"}
              </button>
            </div>
          </div>
        )}

        {/* Resolved Message */}
        {isResolved && (
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
          </div>
        )}
      </div>
    </div>
  );
}

export default ComplaintDetails;
