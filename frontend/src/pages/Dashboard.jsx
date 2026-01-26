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

      </div>

      {/* FOOTER */}
      <div className="max-w-6xl mx-auto mt-10">
        <button
          onClick={logout}
          className="text-sm text-red-400 hover:underline"
        >
          Logout
        </button>
      </div>

    </div>
  );
}
