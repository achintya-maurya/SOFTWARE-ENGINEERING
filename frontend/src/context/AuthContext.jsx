import { createContext, useContext, useState } from "react";

import { apiRequest } from "../api/api";

const AuthContext = createContext(null);

// Map frontend roles to backend login APIs
const LOGIN_ENDPOINTS = {
  citizen: "/api/auth/login",
  officer: "/api/officer/login",
  worker: "/api/worker/login",
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() =>
    sessionStorage.getItem("access_token"),
  );

  const [user, setUser] = useState(() => {
    const savedUser = sessionStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [loading, setLoading] = useState(false);

  // Login for Citizen, Officer or Worker
  const login = async (email, password, role) => {
    const endpoint = LOGIN_ENDPOINTS[role];

    if (!endpoint) {
      throw new Error("Invalid user role.");
    }

    setLoading(true);

    try {
      const data = await apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const authenticatedUser = {
        user_id: data.user_id,
        name: data.name,
        email: data.email,
        role: data.role.toLowerCase(),
        department_id: data.department_id ?? null,
        department_name: data.department_name ?? null,
      };

      sessionStorage.setItem("access_token", data.access_token);

      sessionStorage.setItem("user", JSON.stringify(authenticatedUser));

      setToken(data.access_token);
      setUser(authenticatedUser);

      return authenticatedUser;
    } finally {
      setLoading(false);
    }
  };

  // Register a new Citizen
  const register = async (name, email, password) => {
    setLoading(true);

    try {
      return await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = () => {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("user");

    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: Boolean(token && user),
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom authentication hook
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
