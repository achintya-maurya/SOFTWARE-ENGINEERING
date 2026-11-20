import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children, allowedRole }) {
  const { user, isAuthenticated } = useAuth();

  // Redirect users who are not logged in
  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  // Prevent users from accessing another role's pages
  if (allowedRole && user.role !== allowedRole) {
    const dashboardRoutes = {
      citizen: "/citizen/dashboard",
      officer: "/officer/dashboard",
      worker: "/worker/dashboard",
    };

    return <Navigate to={dashboardRoutes[user.role] || "/"} replace />;
  }

  return children;
}

export default ProtectedRoute;
