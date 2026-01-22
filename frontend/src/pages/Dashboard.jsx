import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Dashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    // Optional: verify token with backend
    api.get("/auth/me").catch(() => {
      localStorage.removeItem("token");
      navigate("/login");
    });
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p className="mb-6">You are logged in 🎉</p>

      <button
        onClick={logout}
        className="bg-red-600 text-white px-4 py-2"
      >
        Logout
      </button>
    </div>
  );
}
