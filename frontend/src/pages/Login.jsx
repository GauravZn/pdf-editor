import { useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async () => {
    if (!email || !password) return;

    try {
      setLoading(true);
      const res = await api.post("/auth/login", { email, password });
      console.log('sir, did we get here,', res.data.token)
      localStorage.setItem("token", res.data.token);
      navigate("/dashboard");
    } catch {
      alert("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-900 text-zinc-100 px-4">

      {/* APP TITLE */}
      <div className="mb-6 sm:mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          📄 PDF Editor
        </h1>
        <p className="text-zinc-400 mt-1 text-sm sm:text-base">
          Edit • Sign • Translate PDFs
        </p>
      </div>

      {/* LOGIN CARD */}
      <div
        className="
          w-full
          max-w-sm sm:max-w-md
          bg-zinc-800 border border-zinc-700
          rounded-xl p-5 sm:p-6
          shadow-lg
        "
      >
        <h2 className="text-xl sm:text-2xl font-semibold text-center mb-5 sm:mb-6">
          Welcome back
        </h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="space-y-3 sm:space-y-4"
        >
          {/* EMAIL */}
          <input
            type="email"
            placeholder="Email"
            className="
              w-full px-3 py-2 sm:py-2.5
              rounded-md
              bg-zinc-900 border border-zinc-700
              text-zinc-100 placeholder-zinc-400
              focus:outline-none focus:ring-2 focus:ring-indigo-500
              text-sm sm:text-base
            "
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* PASSWORD WITH TOGGLE */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="
                w-full px-3 py-2 sm:py-2.5 pr-10
                rounded-md
                bg-zinc-900 border border-zinc-700
                text-zinc-100 placeholder-zinc-400
                focus:outline-none focus:ring-2 focus:ring-indigo-500
                text-sm sm:text-base
              "
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="
                absolute inset-y-0 right-2
                flex items-center
                text-zinc-400 hover:text-zinc-200
                focus:outline-none
              "
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="
              w-full py-2.5 rounded-md font-medium
              bg-indigo-600 hover:bg-indigo-500
              transition disabled:opacity-50
              text-sm sm:text-base
            "
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-xs sm:text-sm text-zinc-400 text-center mt-4">
          Don’t have an account?{" "}
          <span
            onClick={() => navigate("/signup")}
            className="text-indigo-400 cursor-pointer hover:underline"
          >
            Sign up
          </span>
        </p>
      </div>
    </div>
  );
}