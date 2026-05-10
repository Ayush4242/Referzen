import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";

export function ProtectedRoute({ children, requiredRole }) {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    // Redirect to appropriate dashboard based on their actual role
    const redirectPath = user.role === "referrer" ? "/referrer-dashboard" : "/dashboard";
    return <Navigate to={redirectPath} replace />;
  }

  return children;
}
