import { useNavigate } from "react-router-dom";
import FeatureCard from "../components/FeatureCard";
import { useEffect, useState } from "react";
import api from "../api/axios";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user,setUser] = useState('Guest')

  useEffect(()=>{

    const getUser = async()=>{
      console.log("BOSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS")
      const response = await api.get('/get-user')  ;
      setUser(response.data)
      console.log("exe",response.data)
      console.log(user)
    }
    
    getUser()
  },[])
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

      {/* USER WELCOME SECTION */}
<div className="max-w-6xl mx-auto mb-8 px-4 py-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex items-center justify-between">
  <div>
    {user && user.username ? (
      <>
        <h2 className="text-xl font-semibold text-white tracking-tight">
          Hey! <span className="text-indigo-400">@{user.username}</span> 
        </h2>
        <p className="text-sm text-zinc-500">Ready to manage your documents?</p>
      </>
    ) : (
      /* SKELETON LOADER (Shows while 'user' is null or 'Guest') */
      <div className="animate-pulse space-y-2">
        <div className="h-6 w-48 bg-zinc-800 rounded-md"></div>
        <div className="h-4 w-32 bg-zinc-800 rounded-md"></div>
      </div>
    )}
  </div>

  {/* Optional: User Initial Avatar */}
  <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-lg font-bold shadow-lg shadow-indigo-500/20">
    {user?.username?.charAt(0).toUpperCase() || "?"}
  </div>
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

        <FeatureCard
          title="Change Font"
          icon="🔤"
          description="Replace PDF fonts with a professional style"
          onClick={() => navigate("/change-font")}
        />

        <FeatureCard
          title="Scanned to Standard"
          icon="📄"
          description="Convert scanned PDFs into selectable and editable text"
          onClick={() => navigate("/scanned-to-standard")}
        />
        <FeatureCard
          title="Receipt Generator"
          icon="📄"
          description="Generate receipts for your documents"
          onClick={() => navigate("/receipt-generator")}
        />
      </div>

      <div className="max-w-6xl mx-auto mt-10 flex justify-end">
        <button onClick={logout} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-400 border border-red-500/30 rounded-md hover:bg-red-500/10 hover:text-red-300  transition">
          Logout
        </button>
      </div>

    </div>
  );
}