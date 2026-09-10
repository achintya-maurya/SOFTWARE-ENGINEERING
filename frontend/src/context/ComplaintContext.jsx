import { createContext, useContext, useState } from "react";

// Create Complaint Context
const ComplaintContext = createContext();

// Initial complaint data
const initialComplaints = [
  {
    id: "CMP1001",
    title: "Garbage Collection Issue",
    category: "Garbage / Waste",
    location: "Sector 15",
    date: "05 September 2026",

    citizen: "Rahul Sharma",
    email: "rahul@example.com",

    description:
      "Garbage has not been collected for the last two days in our area. The garbage bins are overflowing and creating an unhygienic condition.",

    status: "Pending",

    assignedWorker: null,

    progress: 0,

    workNotes: "",

    evidence: null,

    citizenVerified: false,
  },

  {
    id: "CMP1002",
    title: "Street Light Not Working",
    category: "Street Light",
    location: "Sector 21",
    date: "03 September 2026",

    citizen: "Priya Singh",
    email: "priya@example.com",

    description:
      "The street light near the main road has not been working for several days, making the area unsafe at night.",

    status: "In Progress",

    assignedWorker: "Worker",

    progress: 50,

    workNotes: "",

    evidence: null,

    citizenVerified: false,
  },

  {
    id: "CMP1003",
    title: "Road Damage",
    category: "Road Damage",
    location: "Sector 10",
    date: "01 September 2026",

    citizen: "Amit Kumar",
    email: "amit@example.com",

    description:
      "There is significant damage on the road surface which is causing difficulty for vehicles and pedestrians.",

    status: "Resolved",

    assignedWorker: "Worker",

    progress: 100,

    workNotes: "Road damage has been repaired successfully.",

    evidence: null,

    citizenVerified: true,
  },
];

// Provider
export function ComplaintProvider({ children }) {
  const [complaints, setComplaints] = useState(initialComplaints);

  // Update any information of a complaint
  const updateComplaint = (complaintId, updates) => {
    setComplaints((currentComplaints) =>
      currentComplaints.map((complaint) =>
        complaint.id === complaintId
          ? {
              ...complaint,
              ...updates,
            }
          : complaint,
      ),
    );
  };

  // Add a new complaint
  const addComplaint = (newComplaint) => {
    setComplaints((currentComplaints) => [...currentComplaints, newComplaint]);
  };

  return (
    <ComplaintContext.Provider
      value={{
        complaints,
        updateComplaint,
        addComplaint,
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
