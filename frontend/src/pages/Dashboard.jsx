/*
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Dashboard() {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [watermarkText, setWatermarkText] = useState("");
  const [mode, setMode] = useState("repeat"); // 🔥 single | repeat
  const [opacity, setOpacity] = useState(0.4);
  const [rotation, setRotation] = useState(45);
  const [loading, setLoading] = useState(false);

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const applyWatermark = async () => {
    if (!file || !watermarkText) {
      alert("Please select a PDF and enter watermark text");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("watermarkText", watermarkText);
    formData.append("mode", mode);
    formData.append("opacity", opacity);
    formData.append("rotation", rotation);

    try {
      setLoading(true);

      const res = await api.post("/pdf/watermark", formData, {
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "watermarked.pdf";
      a.click();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Failed to apply watermark");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 flex flex-col items-center px-4 py-8">

    
      <div className="mb-6 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold">📄 PDF Editor</h1>
        <p className="text-zinc-400 text-sm sm:text-base">
          Edit • Sign • Translate PDFs
        </p>
      </div>

      
      <div className="w-full max-w-lg bg-zinc-800 border border-zinc-700 rounded-xl p-6 space-y-4">

      
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files[0])}
          className="w-full text-sm"
        />

      
        <input
          type="text"
          placeholder="Watermark text"
          value={watermarkText}
          onChange={(e) => setWatermarkText(e.target.value)}
          className="
            w-full px-3 py-2 rounded-md
            bg-zinc-900 border border-zinc-700
            focus:ring-2 focus:ring-indigo-500
          "
        />

      
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="single"
              checked={mode === "single"}
              onChange={() => setMode("single")}
            />
            Single (center)
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="repeat"
              checked={mode === "repeat"}
              onChange={() => setMode("repeat")}
            />
            Repeat (secure)
          </label>
        </div>

      
        <div>
          <label className="text-xs text-zinc-400">
            Opacity ({opacity})
          </label>
          <input
            type="range"
            min="0.1"
            max="0.9"
            step="0.1"
            value={opacity}
            onChange={(e) => setOpacity(e.target.value)}
            className="w-full"
          />
        </div>

      <div>
          <label className="text-xs text-zinc-400">
            Rotation ({rotation}°)
          </label>
          <input
            type="range"
            min="0"
            max="90"
            step="5"
            value={rotation}
            onChange={(e) => setRotation(e.target.value)}
            className="w-full"
          />
        </div>

      
        <button
          onClick={applyWatermark}
          disabled={loading}
          className="
            w-full py-2 rounded-md
            bg-indigo-600 hover:bg-indigo-500
            transition font-medium
            disabled:opacity-50
          "
        >
          {loading ? "Applying watermark..." : "Apply Watermark"}
        </button>

      
        <button
          onClick={logout}
          className="
            w-full py-2 rounded-md
            bg-red-600 hover:bg-red-500
            transition font-medium
          "
        >
          Logout
        </button>
      </div>
    </div>
  );
}
*/

import { useNavigate } from "react-router-dom";
import FeatureCard from "../components/FeatureCard";

export default function Dashboard() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 px-4 py-10">

      {/* HEADER */}
      <div className="max-w-6xl mx-auto mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold">
          📄 PDF Editor
        </h1>
        <p className="text-zinc-400 mt-1">
          Powerful tools to work with PDFs
        </p>
      </div>

      {/* FEATURES GRID */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

        <FeatureCard
          title="Add Watermark"
          icon="💧"
          description="Add text watermark to all pages of a PDF"
          onClick={() => navigate("/watermark")}
        />

        <FeatureCard
          title="E-Sign PDF"
          icon="✍️"
          description="Digitally sign your PDF documents"
          onClick={() => navigate("/esign")}
        />

        <FeatureCard
          title="Translate PDF"
          icon="🌐"
          description="Translate PDFs into another language"
          onClick={() => navigate("/translate")}
        />

        <FeatureCard
          title="Summarize PDF"
          icon="📝"
          description="Get a short summary of a PDF"
          onClick={() => navigate("/summarize")}
        />

      </div>

      {/* FOOTER */}
      <div className="max-w-6xl mx-auto mt-10">
        <button
          onClick={logout}
          className="text-sm text-red-400 hover:underline"
        >
          Logout
        </button>
      </div>

    </div>
  );
}
