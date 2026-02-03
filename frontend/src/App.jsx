import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Watermark from "./pages/Watermark";
import Esign from "./pages/Esign";
import Translate from "./pages/Translate";
import Summarize from "./pages/Summarize";
import Changefont from "./pages/Changefont";
import ScannedToStandard from "./pages/ScannedToStandard";
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";
import ReceiptGenerator from "./pages/RecieptGenerator";

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
      <Route
        path="/change-font"
        element={
          <ProtectedRoute>
            <Changefont />
          </ProtectedRoute>
        }
      />
      <Route path="/scanned-to-standard" element={<ProtectedRoute>
            <ScannedToStandard />
          </ProtectedRoute>} />

      <Route path="/receipt-generator" element={<ProtectedRoute>
            <ReceiptGenerator />
          </ProtectedRoute>} />
    </Routes>
  );
}
