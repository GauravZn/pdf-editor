import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileUp, 
  ShieldCheck, 
  History, 
  UserCheck, 
  Layers, 
  ArrowRight,
  ArrowLeft 
} from 'lucide-react';

export default function SignDashboard() {
  const navigate = useNavigate();

  const features = [
    {
      title: "Upload & Sign",
      description: "Upload a new PDF, generate a hash, and apply your digital signature.",
      icon: <FileUp size={32} className="text-blue-500" />,
      path: "/esign/sign",
    },
    {
      title: "See All Signers",
      description: "Upload a signed PDF to see the list of valid signers.",
      icon: <ShieldCheck size={32} className="text-emerald-500" />,
      path: "/esign/all-signers",
    },
    {
      title: "Document History",
      description: "View your previously signed documents and track pending signature requests.",
      icon: <History size={32} className="text-purple-500" />,
      path: "/esign/history",
    },
    {
      title: "Certificate Authority",
      description: "The undeniable database.",
      icon: <UserCheck size={32} className="text-amber-500" />,
      path: "/esign/registry",
    }
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans flex flex-col items-center py-12 px-6 relative">
      
      {/* Top Navigation Bar */}
      <div className="max-w-5xl w-full flex justify-start mb-8">
        <button
          onClick={() => navigate(-1)} 
          className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all active:scale-95"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold tracking-wide">Back</span>
        </button>
      </div>

      {/* Header Section */}
      <div className="max-w-4xl w-full text-center mb-16 space-y-4">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-blue-600/10 rounded-2xl border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
            <Layers className="text-blue-500" size={40} />
          </div>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          E-Signature <span className="text-blue-500">Suite</span>
        </h1>
        <p className="text-zinc-500 text-lg max-w-xl mx-auto font-medium">
          Secure, cryptographic PDF signing and verification.
        </p>
      </div>

      {/* Grid Section */}
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature, idx) => (
          <button
            key={idx}
            onClick={() => navigate(feature.path)}
            className="group relative flex flex-col items-start p-8 bg-[#121214] border border-zinc-800 rounded-3xl text-left transition-all duration-300 hover:border-zinc-600 hover:bg-[#161618] hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
          >
            <div className="mb-6 p-4 rounded-2xl bg-zinc-900 border border-zinc-800 group-hover:scale-110 transition-transform duration-300">
              {feature.icon}
            </div>

            <h3 className="text-xl font-bold mb-2 group-hover:text-white transition-colors">
              {feature.title}
            </h3>
            <p className="text-zinc-500 text-sm leading-relaxed mb-8">
              {feature.description}
            </p>

            <div className="mt-auto flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-600 group-hover:text-blue-400 transition-colors">
              Enter Module
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>

            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </button>
        ))}
      </div>

      {/* Footer Info */}
      <footer className="mt-20 text-zinc-600 text-[11px] border-t border-zinc-900/50 pt-8 w-full max-w-5xl flex justify-between items-center uppercase tracking-widest font-bold">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
          Infrastructure Online
        </div>
        <div>
          Postgres v16 • WebCrypto Engine
        </div>
      </footer>
    </div>
  );
}