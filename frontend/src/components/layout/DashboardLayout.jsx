import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./DashboardLayout.css";

function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const role = user?.role || "citizen";

  const roleConfig = {
    citizen: {
      title: "Citizen Portal",
      links: [
        { label: "Dashboard", path: "/citizen/dashboard", icon: "▦" },
        { label: "Submit Complaint", path: "/citizen/submit", icon: "+" },
        { label: "My Complaints", path: "/citizen/complaints", icon: "☷" },
      ],
    },
    officer: {
      title: "Officer Portal",
      links: [{ label: "Dashboard", path: "/officer/dashboard", icon: "▦" }],
    },
    worker: {
      title: "Worker Portal",
      links: [{ label: "Dashboard", path: "/worker/dashboard", icon: "▦" }],
    },
  };

  const config = roleConfig[role] || roleConfig.citizen;

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="sc-layout">
      {sidebarOpen && (
        <button
          type="button"
          className="sc-sidebar-overlay"
          aria-label="Close navigation"
          onClick={closeSidebar}
        />
      )}

      <aside className={`sc-sidebar ${sidebarOpen ? "sc-sidebar-open" : ""}`}>
        <div className="sc-brand">
          <div className="sc-brand-icon">SC</div>
          <div>
            <h2>Smart City</h2>
            <span>{config.title}</span>
          </div>
        </div>

        <div className="sc-nav-label">MENU</div>

        <nav className="sc-nav">
          {config.links.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end
              onClick={closeSidebar}
              className={({ isActive }) =>
                `sc-nav-link ${isActive ? "sc-nav-link-active" : ""}`
              }
            >
              <span className="sc-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sc-sidebar-footer">
          <div className="sc-sidebar-footer-mark">SC</div>
          <div>
            <strong>Smart City System</strong>
            <span>Civic Management</span>
          </div>
        </div>
      </aside>

      <div className="sc-main">
        <header className="sc-topbar">
          <div className="sc-topbar-left">
            <button
              type="button"
              className="sc-menu-button"
              aria-label="Open navigation"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <span />
              <span />
              <span />
            </button>

            <div className="sc-breadcrumb">
              <span>Smart City</span>
              <span className="sc-breadcrumb-separator">/</span>
              <strong>{config.title}</strong>
            </div>
          </div>

          <div className="sc-user-area">
            <div className="sc-user-avatar">
              {(user?.name || "U").charAt(0).toUpperCase()}
            </div>

            <div className="sc-user-info">
              <strong>{user?.name || "User"}</strong>
              <span>{role.charAt(0).toUpperCase() + role.slice(1)}</span>
            </div>

            <button
              type="button"
              className="sc-logout-button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </header>

        <div className="sc-page-content">{children}</div>
      </div>
    </div>
  );
}

export default DashboardLayout;
