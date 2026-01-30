import { useState, useRef } from "react";
import PdfPreview from "./PdfPreview";
import axios from "axios";

export default function PdfUpload() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isDragging, setIsDragging] = useState(false);
  
  // State to control the UI flow
  const [isUploaded, setIsUploaded] = useState(false); 
  const [showPreview, setShowPreview] = useState(false);

  const fileInputRef = useRef(null);

  const validateFile = (selectedFile) => {
    if (selectedFile && selectedFile.type !== "application/pdf") {
      setStatus({ type: "error", message: "❌ Only PDF files are allowed." });
      return false;
    }
    return true;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && validateFile(selectedFile)) {
      setFile(selectedFile);
      // Reset everything on new file selection
      setIsUploaded(false); 
      setShowPreview(false);
      setStatus({ type: "success", message: "File selected. Ready to upload." });
    }
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && validateFile(droppedFile)) {
      setFile(droppedFile);
      setIsUploaded(false);
      setShowPreview(false);
      setStatus({ type: "success", message: "File dropped successfully" });
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setStatus({ type: "error", message: "Please select a file first." });
      return;
    }

    const formData = new FormData();
    formData.append("pdf", file);
    // Add watermark settings if needed
    // formData.append("text", "Confidential"); 

    try {
      setLoading(true);
      setStatus({ type: "", message: "" });

      const res = await axios.post(
        "http://localhost:5000/api/watermark", // Check your port/route!
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          responseType: 'blob' // CRITICAL: Expect binary file, not JSON
        }
      );

      // 1. Auto-download the result
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `watermarked_${file.name}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      
      // 2. Update UI State
      setStatus({ type: "success", message: "✅ Success! PDF processed and downloaded." });
      setIsUploaded(true); // <--- Triggers the Preview Button to appear

    } catch (err) {
      console.error(err);
      setStatus({ type: "error", message: "❌ Upload failed. Check server connection." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center py-12 px-4 font-sans text-gray-200">
      
      {/* Upload Card */}
      <div className="w-full max-w-md bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 overflow-hidden mb-8">
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold text-white">Upload Document</h2>
        </div>

        <div className="px-8 pb-8">
          <div
            onClick={() => fileInputRef.current.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              flex flex-col items-center justify-center w-full h-48 
              border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300
              ${isDragging ? "border-indigo-500 bg-indigo-500/10" : "border-gray-700 hover:border-indigo-500 hover:bg-gray-800"}
              ${file ? "border-green-500/50 bg-green-500/5" : ""}
            `}
          >
            <input type="file" accept="application/pdf" onChange={handleFileChange} ref={fileInputRef} className="hidden" />
            
            {file ? (
              <div className="text-center">
                <span className="text-4xl">📄</span>
                <p className="text-white mt-2 font-medium truncate max-w-[200px]">{file.name}</p>
              </div>
            ) : (
              <p className="text-gray-400">Click or Drag & Drop PDF</p>
            )}
          </div>

          {/* Upload Button - Disappears or disables during loading */}
          <button
            onClick={handleUpload}
            disabled={loading || !file}
            className={`w-full mt-6 py-3 rounded-lg text-sm font-bold text-white shadow-lg transition-all
              ${!file || loading ? "bg-gray-800 text-gray-500 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-500"}
            `}
          >
            {loading ? "Processing..." : "Upload & Process"}
          </button>

          {/* Status Message */}
          {status.message && (
            <div className={`mt-4 p-3 rounded-lg text-sm text-center border ${status.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
              {status.message}
            </div>
          )}

          {/* --- PREVIEW BUTTON (Only visible AFTER upload) --- */}
          {isUploaded && (
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="w-full mt-4 py-3 rounded-lg text-sm font-bold bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 transition-all flex items-center justify-center gap-2 animate-fade-in"
            >
              {showPreview ? "Hide Preview" : "👁️ Show Preview"}
            </button>
          )}
        </div>
      </div>

      {/* --- PREVIEW SECTION --- */}
      {showPreview && file && (
        <div className="w-full max-w-3xl animate-fade-in-up">
           <PdfPreview file={file} />
        </div>
      )}

    </div>
  );
}