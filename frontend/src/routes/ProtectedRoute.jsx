// It is a react functional component that accepts a single prop 'children'
// and render this children (page/component) only if allowed.
// That is if we have a token in local storage.
// If no token is found, it redirects the user to the login page.

import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}