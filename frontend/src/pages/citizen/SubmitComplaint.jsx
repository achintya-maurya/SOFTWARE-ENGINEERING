import { useState } from "react";
import { Link } from "react-router-dom";
import "../../App.css";

function SubmitComplaint() {
  // Stores the information entered by the citizen
  const [formData, setFormData] = useState({
    category: "",
    description: "",
    location: "",
    photograph: null,
  });

  // Stores the generated complaint ID after submission
  const [complaintId, setComplaintId] = useState("");

  // Handles changes in the form
  const handleChange = (event) => {
    const { name, value, files } = event.target;

    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

  // Handles form submission
  const handleSubmit = (event) => {
    event.preventDefault();

    // Generate a temporary complaint ID
    const newComplaintId = "CMP" + Math.floor(1000 + Math.random() * 9000);

    setComplaintId(newComplaintId);
  };

  return (
    <div className="dashboard">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="navbar-brand">Smart City</div>

        <div className="navbar-user">Welcome, Citizen</div>
      </nav>

      {/* Main Content */}
      <main className="form-page">
        {/* Back button */}
        <Link to="/citizen/dashboard" className="back-link">
          ← Back to Dashboard
        </Link>

        <div className="form-card">
          <h1>Submit Complaint</h1>

          <p className="form-description">
            Report a civic issue by providing the details below.
          </p>

          {/* Complaint Form */}
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
              >
                <option value="">Select a category</option>

                <option value="Garbage">Garbage / Waste</option>

                <option value="Street Light">Street Light</option>

                <option value="Road Damage">Road Damage</option>

                <option value="Water Supply">Water Supply</option>

                <option value="Drainage">Drainage</option>

                <option value="Other">Other</option>
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
                required
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
              />
            </div>

            {/* Photograph */}
            <div className="form-group">
              <label htmlFor="photograph">Upload Photograph</label>

              <input
                type="file"
                id="photograph"
                name="photograph"
                accept="image/*"
                onChange={handleChange}
              />

              <small>Upload an image showing the civic issue.</small>
            </div>

            {/* Submit Button */}
            <button type="submit" className="submit-button">
              Submit Complaint
            </button>
          </form>

          {/* Success Message */}
          {complaintId && (
            <div className="success-message">
              <h2>Complaint Submitted Successfully</h2>

              <p>Your complaint has been registered.</p>

              <p>
                <strong>Complaint ID:</strong> {complaintId}
              </p>

              <p>
                <strong>Status:</strong> Submitted
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
