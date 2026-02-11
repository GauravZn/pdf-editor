import React, { useState, useRef } from 'react';
import { Upload, ArrowLeft, ShieldCheck, Cpu, Hash, Key, CheckCircle2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from "../api/axios";

export default function SummarizeDocumentPage() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle || uploading || hashing || ready
  const [fileData, setFileData] = useState({ hash: '', filename: '' });
  const [res, setRes] = useState(null)
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

  const handleSummarize = async () => {
    if (!fileData.hash) return;
    setStatus('summarizing');

    try {
      const response = await api.get(`/summarize/${fileData.hash}`, {
        responseType: 'blob', // Keep this, we need binary data
      });

      // 1. EXTRACT THE FILENAME FROM THE SERVER HEADER
      // Because we added 'Access-Control-Expose-Headers' in the backend, we can read this!
      const contentDisposition = response.headers['content-disposition'];
      let fileName = `Summary_Document.pdf`; // Fallback name

      if (contentDisposition) {
        // This regex grabs whatever is inside the quotes after 'filename='
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
        if (fileNameMatch && fileNameMatch.length === 2) {
          fileName = fileNameMatch[1];
        }
      }

      // 2. CREATE THE BLOB URL
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);

      // 3. FORCE THE BROWSER TO USE OUR NAME
      const link = document.createElement('a');
      link.href = url;

      // This is the most important line:
      link.setAttribute('download', fileName);

      document.body.appendChild(link);
      link.click();

      // 4. CLEANUP
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setStatus('ready');
      setRes(true);
    } catch (err) {
      console.error("Summarization failed:", err);
      alert("Could not generate summary.");
      setStatus('ready');
    }
  };



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
          <h1 className="text-3xl font-bold mb-3">Summarize a Document</h1>
          <p className="text-zinc-500">Simply upload a pdf and get its summary in a pdf format.</p>
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
              <p className="text-zinc-400 font-medium">Click to upload the PDF you wish to summarize</p>
              <p className="text-zinc-600 text-xs mt-2">Maximum file size: 10MB</p>
            </div>
          )}

          {/* STATE: UPLOADING / HASHING / SUMMARIZING */}
          {(status === 'uploading' || status === 'hashing' || status === 'summarizing') && (
            <div className="py-12 flex flex-col items-center text-center space-y-6">
              <div className="relative">
                <Loader2 size={64} className="text-blue-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  {status === 'uploading' ? <Upload size={20} /> :
                    status === 'hashing' ? <Cpu size={20} /> :
                      <ShieldCheck size={20} className="text-blue-400" />}
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold capitalize">{status}...</h3>
                <p className="text-zinc-500 text-sm mt-1">
                  {status === 'uploading' && "Sending file to secure server"}
                  {status === 'hashing' && "Computing cryptographic SHA-256 fingerprint"}
                  {status === 'summarizing' && "AI is reading and condensing your document..."}
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



              <button
                onClick={handleSummarize}
                disabled={status === 'summarizing' || res || status === 'uploading'}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/10"
              >
                {status === 'summarizing' ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Generating PDF...
                  </>
                ) : res ? (
                  <>
                    <CheckCircle2 size={20} className="text-emerald-500 " />
                    Summary Downloaded
                  </>
                ) : (
                  <>
                    <ShieldCheck size={20} />
                    Summarize and Download
                  </>
                )}
              </button>
            </div>
          )}




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