import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { Eye, EyeOff } from "lucide-react";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Signup() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailBlur = () => {
    if (!email) return;
    if (!emailRegex.test(email)) {
      setEmailError("Enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  const handleSignup = async () => {
    if (!email || !password || emailError) return;

    try {
      setLoading(true);

      await api.post("/auth/signup", { email, password });

      const loginRes = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", loginRes.data.token);

      navigate("/dashboard");
    } catch (err) {
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
          Create account
        </h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSignup();
          }}
          className="space-y-3 sm:space-y-4"
        >
          {/* EMAIL */}
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              onChange={(e) => {
                const value = e.target.value;
                setEmail(value);
                if (emailRegex.test(value)) setEmailError("");
              }}
              onBlur={handleEmailBlur}
              className={`
                w-full px-3 py-2 sm:py-2.5
                rounded-md
                bg-zinc-900 border
                ${emailError ? "border-red-500" : "border-zinc-700"}
                text-zinc-100 placeholder-zinc-400
                focus:outline-none focus:ring-2
                ${emailError ? "focus:ring-red-500" : "focus:ring-indigo-500"}
                text-sm sm:text-base
              `}
            />

            {emailError && (
              <p className="text-red-400 text-xs mt-1">
                {emailError}
              </p>
            )}
          </div>

          {/* PASSWORD */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="
                w-full px-3 py-2 sm:py-2.5 pr-10
                rounded-md
                bg-zinc-900 border border-zinc-700
                text-zinc-100 placeholder-zinc-400
                focus:outline-none focus:ring-2 focus:ring-indigo-500
                text-sm sm:text-base
              "
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
            disabled={loading || !!emailError}
            className="
              w-full py-2.5 rounded-md font-medium
              bg-indigo-600 hover:bg-indigo-500
              transition disabled:opacity-50
              text-sm sm:text-base
            "
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        {/* BACK TO LOGIN */}
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
