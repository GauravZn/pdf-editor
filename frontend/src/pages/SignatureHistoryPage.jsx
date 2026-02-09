import React, { useState, useEffect } from 'react';
import { 
    FileText, 
    Clock, 
    ExternalLink, 
    ShieldCheck, 
    ArrowLeft, 
    Search,
    Fingerprint
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from "../api/axios";

const SignatureHistoryPage = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();

    // 1. Fetch the joined data (Signature + Filename)
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                // This calls the route we built with the INNER JOIN
                const response = await api.get('/esign/history');
                setHistory(response.data);
            } catch (err) {
                console.error("Failed to fetch signature history:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    // 2. Filter logic for the search bar
    const filteredHistory = history.filter(item => 
        item.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.file_hash.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-100 py-12 px-6">
            <div className="max-w-4xl mx-auto space-y-8">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <button
                            onClick={() => navigate(-1)}
                            className="group flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-4"
                        >
                            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="text-xs font-bold uppercase tracking-widest">Dashboard</span>
                        </button>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Fingerprint className="text-blue-500" size={32} />
                            Your Signature History
                        </h1>
                        <p className="text-zinc-500 mt-1">
                            Verify and access every document you've digitally signed.
                        </p>
                    </div>

                    {/* Search Bar */}
                    <div className="relative group max-w-sm w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-blue-500 transition-colors" size={18} />
                        <input 
                            type="text"
                            placeholder="Search by filename or hash..."
                            className="w-full bg-[#121214] border border-zinc-800 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Main List */}
                <div className="grid gap-4">
                    {filteredHistory.length > 0 ? (
                        filteredHistory.map((item, index) => (
                            <div 
                                key={index} 
                                className="bg-[#121214] border border-zinc-800 p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-zinc-700 transition-all group"
                            >
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                                        <FileText size={24} />
                                    </div>
                                    <div className="space-y-2 overflow-hidden">
                                        <h3 className="font-bold text-zinc-100 text-lg truncate pr-4">
                                            {item.filename}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold text-zinc-500 uppercase tracking-tighter">
                                            <div className="flex items-center gap-1.5 bg-zinc-800/50 px-2 py-1 rounded-md">
                                                <Clock size={12} />
                                                {new Date(item.timestamp).toLocaleString()}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-emerald-500">
                                                <ShieldCheck size={12} />
                                                Signature Verified
                                            </div>
                                        </div>
                                        {/* Signature Fragment */}
                                        <div className="mt-2 text-[10px] font-mono text-zinc-600 bg-black/30 p-2 rounded-lg border border-zinc-800/50 truncate">
                                            SIGNATURE: {item.signature}
                                        </div>
                                    </div>
                                </div>

                                {/* Clickable View PDF Link */}
                                <div className="flex items-center gap-3 shrink-0">
                                    <a 
                                        href={`http://localhost:5000/uploads/${item.filename}`} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-6 py-3 rounded-2xl transition-all shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20"
                                    >
                                        View Document
                                        <ExternalLink size={14} />
                                    </a>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20 bg-[#121214] rounded-3xl border border-dashed border-zinc-800">
                            <p className="text-zinc-500 font-medium">No signature records found.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SignatureHistoryPage;