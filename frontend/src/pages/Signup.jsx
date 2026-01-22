import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { Eye, EyeOff } from "lucide-react";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async () => {
    if (!email || !password) {
      alert("Email and password required");
      return;
    }

    try {
      setLoading(true);

      console.log("📤 Signing up user...");

      // 1️⃣ SIGNUP
      await api.post("/auth/signup", { email, password });

      console.log("✅ Signup successful");

      // 2️⃣ AUTO LOGIN
      const loginRes = await api.post("/auth/login", {
        email,
        password,
      });

      console.log("🔐 Logged in");

      // 3️⃣ STORE TOKEN
      localStorage.setItem("token", loginRes.data.token);

      // 4️⃣ REDIRECT
      navigate("/dashboard");
    } catch (err) {
      console.error("❌ Signup/Login error:", err);
      alert(err.response?.data?.message || "Signup failed");
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

      {/* SIGNUP CARD */}
      <div className="w-full max-w-sm sm:max-w-md bg-zinc-800 border border-zinc-700 rounded-xl p-5 sm:p-6 shadow-lg">

        <h2 className="text-xl sm:text-2xl font-semibold text-center mb-5 sm:mb-6">
          Create account
        </h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSignup();
          }}
          className="space-y-4"
        >
          <input
            type="email"
            placeholder="Email"
            className="w-full px-3 py-2 sm:py-2.5 rounded-md bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* PASSWORD WITH TOGGLE */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="w-full px-3 py-2 sm:py-2.5 pr-10 rounded-md bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-md font-medium bg-indigo-600 hover:bg-indigo-500 transition disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="text-xs sm:text-sm text-zinc-400 text-center mt-4">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            className="text-indigo-400 cursor-pointer hover:underline"
          >
            Log in
          </span>
        </p>
      </div>
    </div>
  );
}
