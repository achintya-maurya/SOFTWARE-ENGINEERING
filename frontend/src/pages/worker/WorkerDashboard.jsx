import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";

import { apiRequest } from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "../../components/layout/DashboardLayout";

import "../../App.css";

function WorkerDashboard() {
  const { token, user } = useAuth();

  const [assignments, setAssignments] = useState([]);
  const [workerName, setWorkerName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch assignments belonging to the logged-in worker.
  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest(
        "/api/worker/complaints",
        { method: "GET" },
        token,
      );

      setAssignments(data.assignments || []);
      setWorkerName(data.worker_name || user?.name || "Field Worker");
    } catch (err) {
      setError(err.message || "Unable to load assigned tasks.");
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    if (token) {
      fetchAssignments();
    }
  }, [token, fetchAssignments]);

  // Calculate statistics from actual assignment statuses.
  const assignedTasks = assignments.filter(
    (item) =>
      item.assignment_status === "Assigned" ||
      item.assignment_status === "Accepted",
  ).length;

  const inProgressTasks = assignments.filter(
    (item) => item.assignment_status === "In Progress",
  ).length;

  const completedTasks = assignments.filter(
    (item) => item.assignment_status === "Completed",
  ).length;

  // Format complaint ID.
  const formatComplaintId = (id) => `CMP${String(id).padStart(4, "0")}`;

  // Format date.
  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // Convert assignment status into CSS classes.
  const getStatusClass = (status) => {
    switch (status) {
      case "Assigned":
        return "assigned";

      case "Accepted":
        return "accepted";

      case "In Progress":
        return "in-progress";

      case "Completed":
        return "completed";

      default:
        return "";
    }
  };

  return (
    <DashboardLayout>
      <main className="worker-content worker-dashboard-content">
        {/* Page Header */}
        <div className="worker-header">
          <div>
            <h1>Field Worker Dashboard</h1>
            <p>View and manage your assigned civic tasks.</p>
            <p className="worker-welcome">
              Welcome, {workerName || user?.name || "Field Worker"}
            </p>
          </div>

          <button
            type="button"
            className="worker-refresh-button"
            onClick={fetchAssignments}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {/* Error */}
        {!loading && error && (
          <div className="worker-error-message">
            <p>{error}</p>
            <button type="button" onClick={fetchAssignments}>
              Retry
            </button>
          </div>
        )}

        {/* Statistics */}
        <div className="worker-stats">
          <div className="worker-stat-card">
            <h3>Assigned Tasks</h3>
            <strong>{assignedTasks}</strong>
          </div>

          <div className="worker-stat-card">
            <h3>In Progress</h3>
            <strong>{inProgressTasks}</strong>
          </div>

          <div className="worker-stat-card">
            <h3>Completed</h3>
            <strong>{completedTasks}</strong>
          </div>
        </div>

        {/* Assigned Tasks */}
        <section className="worker-tasks">
          <div className="worker-section-heading">
            <h2>Assigned Complaints</h2>
            <span>Manage your tasks</span>
          </div>

          <div className="worker-task-list">
            {loading ? (
              <div className="worker-empty-state">
                <h3>Loading Tasks...</h3>
                <p>Please wait while we fetch your assignments.</p>
              </div>
            ) : error ? (
              <div className="worker-empty-state">
                <h3>Unable to Load Tasks</h3>
                <p>Use Retry to fetch your assignments again.</p>
              </div>
            ) : assignments.length === 0 ? (
              <div className="worker-empty-state">
                <h3>No Assigned Tasks</h3>
                <p>There are currently no complaints assigned to you.</p>
              </div>
            ) : (
              assignments.map((assignment) => {
                const task = assignment.complaint;

                if (!task) return null;

                return (
                  <div
                    className="worker-task-card"
                    key={assignment.assignment_id}
                  >
                    {/* Task Information */}
                    <div className="worker-task-info">
                      <h3>{task.title}</h3>

                      <p>
                        Complaint ID: {formatComplaintId(task.complaint_id)}
                      </p>

                      <div className="worker-task-meta">
                        <span>Category: {task.category_name}</span>

                        <span>Location: {task.location}</span>

                        <span>
                          Assigned: {formatDate(assignment.assigned_at)}
                        </span>
                      </div>
                    </div>

                    {/* Status and Action */}
                    <div className="worker-task-action">
                      <span
                        className={`worker-status ${getStatusClass(
                          assignment.assignment_status,
                        )}`}
                      >
                        {assignment.assignment_status}
                      </span>

                      <Link
                        to={`/worker/task/${task.complaint_id}`}
                        className="worker-view-button"
                        state={{
                          assignmentId: assignment.assignment_id,
                        }}
                      >
                        View Task
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>
    </DashboardLayout>
  );
}

export default WorkerDashboard;
