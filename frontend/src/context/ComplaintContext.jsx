import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

import { apiRequest } from "../api/api";
import { useAuth } from "./AuthContext";

// Create Complaint Context
const ComplaintContext = createContext(null);

// Format backend complaint data for existing frontend components
const formatComplaint = (complaint, user) => {
  const date = complaint.created_at
    ? new Date(complaint.created_at).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "";

  return {
    id: String(complaint.complaint_id),
    title: complaint.title,
    category: complaint.category_name,
    location: complaint.location,
    date,

    citizen: user?.name || "",
    email: user?.email || "",

    description: complaint.description,
    status: complaint.status,

    assignedWorker: null,
    progress: 0,
    workNotes: "",
    evidence: null,
    citizenVerified: complaint.status === "Resolved",

    // Preserve original backend fields
    complaint_id: complaint.complaint_id,
    category_id: complaint.category_id,
    department_id: complaint.department_id,
    department_name: complaint.department_name,
    created_at: complaint.created_at,
    updated_at: complaint.updated_at,
  };
};

// Provider
export function ComplaintProvider({ children }) {
  const { token, user } = useAuth();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch complaints belonging to the logged-in citizen
  const refreshComplaints = useCallback(async () => {
    if (!token || user?.role !== "citizen") {
      setComplaints([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await apiRequest(
        "/api/complaints/my",
        { method: "GET" },
        token,
      );

      const formattedComplaints = (data.complaints || []).map((complaint) =>
        formatComplaint(complaint, user),
      );

      setComplaints(formattedComplaints);
    } catch (err) {
      setError(err.message || "Unable to load complaints.");
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  // Automatically fetch complaints after citizen login
  useEffect(() => {
    if (token && user?.role === "citizen") {
      refreshComplaints();
    } else {
      setComplaints([]);
      setError("");
      setLoading(false);
    }
  }, [token, user?.role, refreshComplaints]);

  // Update complaint information locally
  const updateComplaint = (complaintId, updates) => {
    setComplaints((currentComplaints) =>
      currentComplaints.map((complaint) =>
        String(complaint.id) === String(complaintId)
          ? { ...complaint, ...updates }
          : complaint,
      ),
    );
  };

  // Add complaint locally for existing component compatibility
  const addComplaint = (newComplaint) => {
    setComplaints((currentComplaints) => [newComplaint, ...currentComplaints]);
  };

  return (
    <ComplaintContext.Provider
      value={{
        complaints,
        loading,
        error,
        updateComplaint,
        addComplaint,
        refreshComplaints,
      }}
    >
      {children}
    </ComplaintContext.Provider>
  );
}

// Custom hook
export function useComplaints() {
  const context = useContext(ComplaintContext);

  if (!context) {
    throw new Error("useComplaints must be used inside ComplaintProvider");
  }

  return context;
}
