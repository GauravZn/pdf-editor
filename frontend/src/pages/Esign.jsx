import { useState } from "react";
import api from "../api/axios";

export default function Esign() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const uploadForSigning = async () => {
    if (!file) {
      alert("Please choose a PDF");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);

      const res = await api.post("/pdf/esign/upload", formData);

      alert(
        `PDF uploaded successfully!\n\nDocument ID:\n${res.data.pdfId}`
      );
    } catch (err) {
      alert("Failed to upload PDF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-zinc-800 border border-zinc-700 rounded-xl p-6 shadow-lg">

        <h1 className="text-2xl font-semibold text-center mb-6">
          ✍️ E-Sign PDF
        </h1>

        {/* FILE INPUT */}
        <label className="block mb-4">
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files[0])}
            className="hidden"
          />

          <div className="cursor-pointer bg-zinc-900 border border-zinc-700 rounded-md px-4 py-3 text-center text-sm">
            {file ? file.name : "Choose PDF to upload for signing"}
          </div>
        </label>

        <button
          onClick={uploadForSigning}
          disabled={loading}
          className="w-full py-2.5 rounded-md bg-indigo-600 hover:bg-indigo-500 transition disabled:opacity-50"
        >
          {loading ? "Uploading..." : "Upload PDF"}
        </button>
      </div>
    </div>
  );
}
