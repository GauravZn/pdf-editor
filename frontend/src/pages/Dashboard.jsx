import { useNavigate } from "react-router-dom";
import FeatureCard from "../components/FeatureCard";

export default function Dashboard() {
  const navigate = useNavigate();

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
      </div>

      {/* FOOTER */}
      <div className="max-w-6xl mx-auto mt-10 flex justify-end">
        <button
          onClick={logout}
          className="
      inline-flex items-center gap-2
      px-4 py-2
      text-sm font-medium
      text-red-400
      border border-red-500/30
      rounded-md
      hover:bg-red-500/10
      hover:text-red-300
      transition
    "
        >
          Logout
        </button>
      </div>


    </div>
  );
}
