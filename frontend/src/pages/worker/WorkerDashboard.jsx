import { Link } from "react-router-dom";
import { useComplaints } from "../../context/ComplaintContext";

function WorkerDashboard() {
  const { complaints } = useComplaints();

  // For the frontend prototype, show complaints that
  // have been assigned to a field worker.
  const tasks = complaints.filter(
    (complaint) =>
      complaint.assignedWorker !== null && complaint.assignedWorker !== "",
  );

  // Statistics
  const assignedTasks = tasks.filter(
    (task) => task.status === "Assigned" || task.status === "Accepted",
  ).length;

  const inProgressTasks = tasks.filter(
    (task) => task.status === "In Progress",
  ).length;

  const completedTasks = tasks.filter(
    (task) => task.status === "Completed",
  ).length;

  return (
    <div className="worker-dashboard">
      {/* Navbar */}
      <nav className="worker-navbar">
        <h2>Smart City</h2>

        <div className="worker-nav-right">
          <span>Field Worker</span>

          <Link to="/">Logout</Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="worker-content">
        {/* Header */}
        <div className="worker-header">
          <div>
            <h1>Field Worker Dashboard</h1>

            <p>View and manage your assigned civic tasks.</p>
          </div>
        </div>

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
            {tasks.length === 0 ? (
              <div className="worker-empty-state">
                <h3>No Assigned Tasks</h3>

                <p>There are currently no complaints assigned to you.</p>
              </div>
            ) : (
              tasks.map((task) => (
                <div className="worker-task-card" key={task.id}>
                  {/* Task Information */}
                  <div className="worker-task-info">
                    <h3>{task.title}</h3>

                    <p>Complaint ID: {task.id}</p>

                    <div className="worker-task-meta">
                      <span>Category: {task.category}</span>

                      <span>Location: {task.location}</span>

                      <span>Assigned: {task.date}</span>
                    </div>
                  </div>

                  {/* Task Status & Action */}
                  <div className="worker-task-action">
                    <span
                      className={`worker-status ${task.status
                        .toLowerCase()
                        .replace(" ", "-")}`}
                    >
                      {task.status}
                    </span>

                    <Link
                      to={`/worker/task/${task.id}`}
                      className="worker-view-button"
                    >
                      View Task
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default WorkerDashboard;
