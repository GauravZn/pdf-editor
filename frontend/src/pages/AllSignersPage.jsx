import React, { useState, useRef } from 'react';
import { Upload, ArrowLeft, ShieldCheck, Cpu, Hash, Key, CheckCircle2, Loader2, User, FileDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from "../api/axios";

export default function SignDocumentPage() {
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('idle'); // idle | uploading | hashing | ready
    const [fileData, setFileData] = useState({ hash: '', filename: '' });
    const [res, setRes] = useState(null)
    const [allSigners, setAllSigners] = useState([])
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    const downloadSignatures = () => {
        if (!allSigners || allSigners.length === 0) return;

        // Format the header
        let content = `Document: ${fileData.filename}\n`;
        content += `Fingerprint: ${fileData.hash}\n`;
        content += `Export Date: ${new Date().toLocaleString()}\n`;
        content += `-------------------------------------------\n\n`;

        // Map through signers and format each entry
        allSigners.forEach((signer, index) => {
            content += `Signer #${index + 1}\n`;
            content += `Username: ${signer.signer_username}\n`;
            content += `Email:    ${signer.signer_email}\n`;
            content += `Date:     ${new Date(signer.timestamp).toLocaleString()}\n`;
            content += `Signature: ${signer.signature}\n`;
            content += `-------------------------------------------\n`;
        });

        // Create the file and trigger download
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        // Set filename: pdf_name_all_signatures.txt
        const baseName = fileData.filename.replace(/\.[^/.]+$/, ""); // Removes .pdf extension
        link.download = `${baseName}_all_signatures.txt`;

        link.href = url;
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile || selectedFile.type !== 'application/pdf') return;

        setFile(selectedFile);
        setStatus('uploading');

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            // Step 1: Uploading
            const response = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.progress === 1) setStatus('hashing');
                }
            });

            const { hash, filename } = response.data;

            const result = await Promise.all([
                api.get('/esign/all-signers', { params: { hash } }),
                new Promise(resolve => setTimeout(resolve, 1000))
            ]);

            setFileData({ hash: hash, filename: filename })
            setAllSigners(result[0].data[0].signatures || []);
            setStatus('ready');


        } catch (err) {
            console.error(err);
            setStatus('idle');
            alert("Upload failed. Please try again.");
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
                    <h1 className="text-3xl font-bold mb-3">See All Signers</h1>
                    <p className="text-zinc-500">Securely upload a pdf and see all the signers.</p>
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
                            <p className="text-zinc-400 font-medium">Click to upload the PDF</p>
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
                                    {status === 'uploading' ? "Sending file to secure server" : "Getting all signers"}
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



                            {/* Signer List Section */}
                            {status === 'ready' && (
                                <div className="mt-8 pt-6 border-t border-zinc-800 space-y-4">
                                    <div className="flex items-center justify-between text-zinc-500 text-xs font-bold uppercase tracking-wider">
                                        <div className="flex items-center gap-2">
                                            <User size={14} className="text-blue-500" />
                                            Verified Signers ({allSigners.length})
                                        </div>

                                        {allSigners.length > 0 && (
                                            <button
                                                onClick={downloadSignatures}
                                                className="relative group/btn flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/20 hover:border-blue-500/50 transition-all duration-300 active:scale-95 shadow-[0_0_15px_rgba(59,130,246,0.1)] hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                                            >
                                                {/* Subtle inner glow for a "glass" effect */}
                                                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover/btn:opacity-100 transition-opacity" />

                                                <FileDown size={14} className="relative z-10 group-hover/btn:-translate-y-0.5 transition-transform" />

                                                <span className="relative z-10 text-[11px] font-bold tracking-tight">
                                                    EXPORT LOG
                                                </span>
                                            </button>
                                        )}

                                    </div>

                                    <div className="grid gap-3">
                                        {allSigners.length > 0 ? (
                                            allSigners.map((signerData, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between bg-zinc-900/50 border border-zinc-800/50 p-4 rounded-2xl hover:border-blue-500/30 transition-all group"
                                                >
                                                    {/* Left Side: User Info */}
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
                                                            <User size={18} className="text-blue-400" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <p className="text-zinc-200 font-bold group-hover:text-white transition-colors">
                                                                {signerData.signer_username}
                                                            </p>
                                                            <span className="text-[11px] font-medium text-zinc-500">{signerData.signer_email}</span>
                                                        </div>
                                                    </div>

                                                    {/* Right Side: Signature & Timestamp */}
                                                    <div className="flex flex-col items-end gap-2 max-w-[50%]">
                                                        {/* Signature Badge */}
                                                        <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-zinc-800 group-hover:border-blue-500/20 transition-all">
                                                            <Key size={10} className="text-blue-500/70" />
                                                            <code className="text-[10px] text-blue-400/90 font-mono truncate max-w-[150px]">
                                                                {signerData.signature}
                                                            </code>
                                                        </div>

                                                        {/* Timestamp Badge */}
                                                        <div className="flex items-center gap-1.5 text-zinc-500">
                                                            <ShieldCheck size={11} className="text-emerald-500/60" />
                                                            <span className="text-[10px] font-medium uppercase tracking-tight">
                                                                {new Date(signerData.timestamp).toLocaleDateString(undefined, {
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-10 bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800">
                                                <p className="text-zinc-500 text-sm italic">No signatures found for this document.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

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