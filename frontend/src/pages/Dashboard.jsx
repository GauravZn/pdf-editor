import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 flex flex-col items-center justify-center px-4">

      {/* APP TITLE */}
      <div className="mb-6 sm:mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          📄 PDF Editor
        </h1>
        <p className="text-zinc-400 mt-1 text-sm sm:text-base">
          Edit • Sign • Translate PDFs
        </p>
      </div>

      {/* DASHBOARD CARD */}
      <div
        className="
          w-full
          max-w-sm sm:max-w-md
          bg-zinc-800 border border-zinc-700
          rounded-xl
          p-6 sm:p-8
          shadow-lg
          text-center
        "
      >
        <h2 className="text-xl sm:text-2xl font-semibold mb-2">
          Dashboard
        </h2>

        <p className="text-zinc-400 mb-5 sm:mb-6 text-sm sm:text-base">
          You are successfully logged in.
        </p>

        <button
          onClick={logout}
          className="
            w-full py-2.5 rounded-md font-medium
            bg-red-600 hover:bg-red-500
            transition
            text-sm sm:text-base
          "
        >
          Logout
        </button>
      </div>
    </div>
  );
}
