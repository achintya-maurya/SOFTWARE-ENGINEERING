import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import "../../App.css";

import { useComplaints } from "../../context/ComplaintContext";
import { useAuth } from "../../context/AuthContext";
import { apiRequest, API_BASE_URL } from "../../api/api";

// Category and department IDs from PostgreSQL
const CATEGORY_MAPPING = {
  "Road Damage": {
    category_id: 1,
    department_id: 1,
  },
  Streetlight: {
    category_id: 2,
    department_id: 2,
  },
  Garbage: {
    category_id: 3,
    department_id: 3,
  },
  "Water Supply": {
    category_id: 4,
    department_id: 4,
  },
  Drainage: {
    category_id: 5,
    department_id: 5,
  },
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 3;

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function SubmitComplaint() {
  const { refreshComplaints } = useComplaints();
  const { token, user } = useAuth();

  const [formData, setFormData] = useState({
    category: "",
    description: "",
    location: "",
  });

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  const [complaintId, setComplaintId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Create and clean up image previews.
  useEffect(() => {
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));

    setPreviews(previewUrls);

    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [selectedFiles]);

  // Handle normal form input changes.
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  // Validate and select photographs.
  const handleFileChange = (event) => {
    setError("");
    setSuccess("");

    const files = Array.from(event.target.files || []);

    if (files.length > MAX_FILES) {
      setError(`You can upload a maximum of ${MAX_FILES} photographs.`);
      event.target.value = "";
      return;
    }

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError("Only JPG, PNG and WEBP photographs are allowed.");
        event.target.value = "";
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError(`"${file.name}" exceeds the 5 MB size limit.`);
        event.target.value = "";
        return;
      }

      if (file.size === 0) {
        setError(`"${file.name}" is empty.`);
        event.target.value = "";
        return;
      }
    }

    setSelectedFiles(files);
  };

  // Remove a selected photograph.
  const removeFile = (index) => {
    setSelectedFiles((previousFiles) =>
      previousFiles.filter((_, fileIndex) => fileIndex !== index),
    );
  };

  // Upload photographs after the complaint is created.
  const uploadPhotographs = async (newComplaintId) => {
    for (const file of selectedFiles) {
      const uploadData = new FormData();
      uploadData.append("file", file);

      const response = await fetch(
        `${API_BASE_URL}/api/complaints/${newComplaintId}/evidence`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: uploadData,
        },
      );

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          responseData.detail || `Failed to upload ${file.name}.`,
        );
      }
    }
  };

  // Submit complaint and then upload its photographs.
  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");
    setComplaintId("");

    const mapping = CATEGORY_MAPPING[formData.category];

    if (!mapping) {
      setError("Please select a valid complaint category.");
      return;
    }

    if (!token || user?.role !== "citizen") {
      setError("Please log in as a citizen before submitting.");
      return;
    }

    setLoading(true);

    let complaintCreated = false;

    try {
      const payload = {
        category_id: mapping.category_id,
        department_id: mapping.department_id,

        title:
          formData.category === "Streetlight"
            ? "Streetlight not working"
            : `${formData.category} issue`,

        description: formData.description.trim(),
        location: formData.location.trim(),
      };

      // Step 1: Create complaint.
      const response = await apiRequest(
        "/api/complaints",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
        token,
      );

      const newComplaintId = response.complaint.complaint_id;

      complaintCreated = true;

      setComplaintId(`CMP${String(newComplaintId).padStart(4, "0")}`);

      // Step 2: Upload selected photographs.
      if (selectedFiles.length > 0) {
        await uploadPhotographs(newComplaintId);

        setSuccess(
          "Your complaint and all photographs were submitted successfully.",
        );
      } else {
        setSuccess("Your complaint was submitted successfully.");
      }

      // Clear form after successful complaint creation.
      setFormData({
        category: "",
        description: "",
        location: "",
      });

      setSelectedFiles([]);

      // Refresh actual complaints from PostgreSQL.
      await refreshComplaints();
    } catch (err) {
      if (complaintCreated) {
        setSuccess(
          "Your complaint was created, but photograph upload failed. " +
            "Please contact support or try uploading the photographs again.",
        );
      } else {
        setError(
          err.message || "Unable to submit complaint. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="navbar-brand">Smart City</div>

        <div className="navbar-user">Welcome, {user?.name || "Citizen"}</div>
      </nav>

      {/* Main Content */}
      <main className="form-page">
        <Link to="/citizen/dashboard" className="back-link">
          ← Back to Dashboard
        </Link>

        <div className="form-card">
          <h1>Submit Complaint</h1>

          <p className="form-description">
            Report a civic issue by providing the details below.
          </p>

          <form onSubmit={handleSubmit}>
            {/* Category */}
            <div className="form-group">
              <label htmlFor="category">Complaint Category</label>

              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="">Select a category</option>
                <option value="Road Damage">Road Damage</option>
                <option value="Streetlight">Streetlight</option>
                <option value="Garbage">Garbage</option>
                <option value="Water Supply">Water Supply</option>
                <option value="Drainage">Drainage</option>
              </select>
            </div>

            {/* Description */}
            <div className="form-group">
              <label htmlFor="description">Complaint Description</label>

              <textarea
                id="description"
                name="description"
                placeholder="Describe the civic issue..."
                value={formData.description}
                onChange={handleChange}
                rows="5"
                maxLength={2000}
                required
                disabled={loading}
              />
            </div>

            {/* Location */}
            <div className="form-group">
              <label htmlFor="location">Location</label>

              <input
                type="text"
                id="location"
                name="location"
                placeholder="Enter the location of the issue"
                value={formData.location}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            {/* Photograph Upload */}
            <div className="form-group">
              <label htmlFor="photographs">Photograph Upload</label>

              <input
                type="file"
                id="photographs"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleFileChange}
                disabled={loading}
              />

              <small>
                Upload up to 3 photographs. JPG, PNG or WEBP. Maximum 5 MB per
                photograph.
              </small>

              {/* Image Previews */}
              {previews.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "12px",
                    marginTop: "15px",
                  }}
                >
                  {previews.map((preview, index) => (
                    <div
                      key={`${preview}-${index}`}
                      style={{
                        width: "120px",
                        position: "relative",
                      }}
                    >
                      <img
                        src={preview}
                        alt={`Selected photograph ${index + 1}`}
                        style={{
                          width: "120px",
                          height: "100px",
                          objectFit: "cover",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                        }}
                      />

                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        disabled={loading}
                        aria-label={`Remove photograph ${index + 1}`}
                        style={{
                          display: "block",
                          width: "100%",
                          marginTop: "5px",
                          padding: "5px",
                          cursor: "pointer",
                        }}
                      >
                        Remove
                      </button>

                      <small>{selectedFiles[index]?.name}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <p className="error-message" role="alert">
                {error}
              </p>
            )}

            {/* Submit Button */}
            <button type="submit" className="submit-button" disabled={loading}>
              {loading
                ? "Submitting complaint and photographs..."
                : "Submit Complaint"}
            </button>
          </form>

          {/* Success Message */}
          {complaintId && (
            <div className="success-message" role="status">
              <h2>Complaint Submitted Successfully</h2>

              <p>{success}</p>

              <p>
                <strong>Complaint ID:</strong> {complaintId}
              </p>

              <p>
                <strong>Status:</strong> Pending Verification
              </p>

              <Link to="/citizen/dashboard" className="dashboard-button">
                Go to Dashboard
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default SubmitComplaint;
