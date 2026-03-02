import React, { useState, useRef } from 'react';
import { Upload, ArrowLeft, ShieldCheck, Cpu, Hash, Key, CheckCircle2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from "../api/axios";
// import saveSign from '../../../backend/src/utils/saveSign';

export default function SignDocumentPage() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | uploading | hashing | ready
  const [fileData, setFileData] = useState({ hash: '', filename: '' });
  const [password, setPassword] = useState('');
  const [res, setRes] = useState(null)
  const [duplicate, setDuplicate] = useState(false)
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile || selectedFile.type !== 'application/pdf') return;

    setFile(selectedFile);
    setStatus('uploading');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      // Step 1: Uploading
      const response = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.progress === 1) setStatus('hashing');
        }
      });

      // Simulated delay for "Hashing" feedback so user sees the process
      setTimeout(() => {
        setFileData({
          hash: response.data.hash,
          filename: response.data.filename
        });
        setStatus('ready');
      }, 1500);

    } catch (err) {
      console.error(err);
      setStatus('idle');
      alert("Upload failed. Please try again.");
    }
  };

  const handleSign = async () => {
    try {
      setStatus('hashing'); // Show loading state

      // 1. Pack the file and password into FormData
      const formData = new FormData();
      formData.append("document", file); // Must match backend's upload.single("document")
      formData.append("password", password);

      // 2. Make the single secure API call
      const resp = await api.post('/esign/sign', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // The backend has now signed AND saved the signature to Postgres automatically!
      setRes(resp.data);
      setStatus('ready');

    } catch (err) {
      setStatus('ready');
      if (err.response && err.response.status === 409) {
        setDuplicate(true);
      } else if (err.response && err.response.status === 401) {
        alert("Incorrect password. Cannot decrypt your signing key.");
      } else {
        console.error("Signing failed:", err.message);
        alert(err.response?.data?.message || "An error occurred during signing.");
      }
    }
  }


  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans flex flex-col items-center py-12 px-6">

      {/* Navigation */}
      <div className="max-w-3xl w-full flex justify-start mb-12">
        <button
          onClick={() => navigate(-1)}
          className="group flex items-center gap-2 text-zinc-500 hover:text-white transition-colors"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold uppercase tracking-wider">Back to Dashboard</span>
        </button>
      </div>

      <div className="max-w-2xl w-full">
        {/* Step Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-3">Sign Document</h1>
          <p className="text-zinc-500">Securely hash and sign your PDF using your private key.</p>
        </div>

        {/* Main Interaction Card */}
        <div className="bg-[#121214] border border-zinc-800 rounded-3xl p-8 shadow-2xl">

          {/* STATE: IDLE */}
          {status === 'idle' && (
            <div
              onClick={() => fileInputRef.current.click()}
              className="group border-2 border-dashed border-zinc-800 hover:border-blue-500 hover:bg-blue-500/5 transition-all rounded-2xl p-16 text-center cursor-pointer"
            >
              <Upload size={48} className="mx-auto mb-4 text-zinc-700 group-hover:text-blue-500 transition-colors" />
              <p className="text-zinc-400 font-medium">Click to upload the PDF you wish to sign</p>
              <p className="text-zinc-600 text-xs mt-2">Maximum file size: 10MB</p>
            </div>
          )}

          {/* STATE: UPLOADING / HASHING */}
          {(status === 'uploading' || status === 'hashing') && (
            <div className="py-12 flex flex-col items-center text-center space-y-6">
              <div className="relative">
                <Loader2 size={64} className="text-blue-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  {status === 'uploading' ? <Upload size={20} /> : <Cpu size={20} />}
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold capitalize">{status}...</h3>
                <p className="text-zinc-500 text-sm mt-1">
                  {status === 'uploading' ? "Sending file to secure server" : "Computing cryptographic SHA-256 fingerprint"}
                </p>
              </div>
            </div>
          )}

          {/* STATE: READY TO SIGN */}
          {status === 'ready' && (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
              {/* Hash Display */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase">
                  <Hash size={14} /> Document Fingerprint (Hash)
                </div>
                <div className="bg-black/40 border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
                  <code className="text-blue-400 text-xs font-mono break-all leading-relaxed">
                    {fileData.hash}
                  </code>
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0 ml-4" />
                </div>
              </div>

              {/* Password Input for Key Decryption */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase">
                  <Key size={14} /> Authorize Signature
                </div>
                <input
                  type="password"
                  placeholder="Enter your account password to unlock your key..."
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-inner"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className="text-[10px] text-zinc-500 italic">
                  * Zero-Knowledge Security: Your password decrypts your signature key in memory. We never store your raw private key.
                </p>
              </div>

              <button onClick={() => handleSign()}
                disabled={!password || duplicate || res}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/10"
              >
                <ShieldCheck size={20} />
                Sign This Document
              </button>
            </div>
          )}


          {/* Feedback Section: Success or Duplicate Warning */}
          <div className="mt-6 space-y-4">

            {/* SUCCESS MESSAGE */}
            {!duplicate && res && (
              <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl animate-in fade-in slide-in-from-bottom-2">
                <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />
                <p className="text-emerald-200 text-sm font-medium">
                  {res.message || "Document signed successfully!"}
                </p>
              </div>
            )}

            {/* DUPLICATE WARNING */}
            {duplicate && (
              <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl animate-in fade-in slide-in-from-bottom-2">
                <ShieldCheck className="text-amber-500 shrink-0" size={20} />
                <div>
                  <p className="text-amber-200 text-sm font-bold">Already Signed</p>
                  <p className="text-amber-500/80 text-xs">
                    Your signature is already recorded in this document's audit trail.
                  </p>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".pdf"
        onChange={handleFileChange}
      />
    </div>
  );
}