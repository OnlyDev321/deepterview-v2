import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../../services/AuthContext";

const PublicRoute = () => {
  const { isLogged } = useContext(AuthContext);

  if (isLogged) {
    // If already logged in, redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  // If not logged in, allow access to public routes (like Sign In)
  return <Outlet />;
};

export default PublicRoute;
