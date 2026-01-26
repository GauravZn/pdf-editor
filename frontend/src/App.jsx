import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Watermark from "./pages/Watermark";
import Esign from "./pages/Esign";
import Translate from "./pages/Translate";
import Summarize from "./pages/Summarize";

import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";

export default function App() {
  return (
    <Routes>

      {/* DEFAULT ROUTE */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* PUBLIC ROUTES */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      <Route
        path="/signup"
        element={
          <PublicRoute>
            <Signup />
          </PublicRoute>
        }
      />

      {/* PROTECTED ROUTES */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/watermark"
        element={
          <ProtectedRoute>
            <Watermark />
          </ProtectedRoute>
        }
      />

      <Route
        path="/esign"
        element={
          <ProtectedRoute>
            <Esign />
          </ProtectedRoute>
        }
      />

      <Route
        path="/translate"
        element={
          <ProtectedRoute>
            <Translate />
          </ProtectedRoute>
        }
      />

      <Route
        path="/summarize"
        element={
          <ProtectedRoute>
            <Summarize />
          </ProtectedRoute>
        }
      />

    </Routes>
  );
}
