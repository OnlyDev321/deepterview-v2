import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../../services/AuthContext";

const ProtectedRoute = () => {
  const { isLogged } = useContext(AuthContext);

  if (!isLogged) {
    // If not logged in, redirect to signin
    return <Navigate to="/signin" replace />;
  }

  // If logged in, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;
