import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Mail, Key, Copy, Check, Search, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from "../api/axios";

export default function RegisteredUsersPage() {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [copiedKey, setCopiedKey] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await api.get('/esign/all-users');
                setUsers(response.data);
            } catch (err) {
                console.error("Failed to fetch users", err);
            }
        };
        fetchUsers();
    }, []);

    const handleCopy = (publicKey) => {
        navigator.clipboard.writeText(publicKey);
        setCopiedKey(publicKey);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Inside RegisteredUsersPage.jsx
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                // Ensure this URL matches your backend port and route prefix
                const response = await api.get('esign/all-users');

                // response.data will now be the array from your PostgreSQL 'users' table
                setUsers(response.data);
            } catch (err) {
                console.error("Failed to fetch users:", err);
                // Optional: set an error state to show a message to the user
            }
        };
        fetchUsers();
    }, []);

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans py-12 px-6 flex flex-col items-center">

            {/* Header & Search */}
            <div className="max-w-4xl w-full space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <button
                            onClick={() => navigate(-1)}
                            className="group flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-4"
                        >
                            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="text-xs font-bold uppercase tracking-widest">Back</span>
                        </button>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Users className="text-blue-500" size={32} />
                            Directory
                        </h1>
                        <p className="text-zinc-500 mt-1">View and manage all registered system users.</p>
                    </div>

                    <div className="relative group max-w-sm w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-blue-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            className="w-full bg-[#121214] border border-zinc-800 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Users Grid */}
                <div className="grid gap-4">
                    {filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                            <div
                                key={user.id}
                                className="bg-[#121214] border border-zinc-800 p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-zinc-700 transition-all group"
                            >
                                {/* User Identity */}
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                                        <User size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-zinc-100 tracking-tight text-lg">@{user.username}</h3>
                                        <div className="flex items-center gap-2 text-zinc-500 text-sm">
                                            <Mail size={14} />
                                            <span>{user.email}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Public Key Section */}
                                <div className="flex flex-col md:items-end gap-2 flex-1 max-w-md">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                                        <Key size={12} /> Public Key
                                    </div>
                                    <div className="w-full bg-black/40 border border-zinc-800 rounded-xl p-2 pl-4 flex items-center justify-between gap-3 group/key hover:border-zinc-600 transition-colors">
                                        <code className="text-[11px] font-mono text-blue-400/80 truncate">
                                            {user.public_key}
                                        </code>
                                        <button
                                            onClick={() => handleCopy(user.public_key)}
                                            className="p-2 bg-zinc-800 hover:bg-blue-600 rounded-lg text-zinc-400 hover:text-white transition-all shrink-0"
                                            title="Copy Key"
                                        >
                                            {copiedKey === user.public_key ? <Check size={16} /> : <Copy size={16} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20 bg-[#121214] rounded-3xl border border-dashed border-zinc-800">
                            <p className="text-zinc-500 font-medium">No users found matching your search.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}