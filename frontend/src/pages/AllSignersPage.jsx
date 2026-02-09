import React, { useState, useRef } from 'react';
import { Upload, ArrowLeft, ShieldCheck, Cpu, Hash, Key, CheckCircle2, Loader2, User } from 'lucide-react';
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
                                    </div>

                                    <div className="grid gap-3">
                                        {allSigners.length > 0 ? (
                                            allSigners.map((signerData, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between bg-zinc-900/50 border border-zinc-800/50 p-4 rounded-2xl hover:border-zinc-700 transition-all group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
                                                            <User size={18} className="text-blue-400" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <p className="text-zinc-200 font-bold group-hover:text-white transition-colors">
                                                                {signerData.signer_username}
                                                            </p>
                                                            <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                                                                <span className="font-medium text-zinc-400">{signerData.signer_email}</span>
                                                                <span>•</span>
                                                                <span>
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

                                                    <div className="flex flex-col items-end gap-1">
                                                        <div className="flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                                                            <ShieldCheck size={12} className="text-emerald-500" />
                                                            <span className="text-[10px] font-bold text-emerald-500 uppercase">Verified</span>
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