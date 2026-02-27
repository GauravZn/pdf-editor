import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { Eye, EyeOff } from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha"; // <-- Import Recaptcha

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Signup() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false); // <-- T&C State
  const [captchaToken, setCaptchaToken] = useState(null);    // <-- CAPTCHA State
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const navigate = useNavigate();

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Private key is copied to clipboard!\nSave it in a safe folder.\nIt can't be generated again.");
      navigate('/login');
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const handleEmailBlur = () => {
    if (!email) return;
    if (!emailRegex.test(email)) setEmailError("Enter a valid email address");
    else setEmailError("");
  };

  const handleSignup = async () => {
    // Prevent submission if missing fields, unchecked T&C, or missing CAPTCHA
    if (!email || !password || !username || emailError || !termsAccepted || !captchaToken) {
      alert("Please fill all fields, accept the terms, and complete the CAPTCHA.");
      return;
    }

    try {
      setLoading(true);
      // Send the new data to the backend
      const res = await api.post("/auth/signup", { 
        email, 
        password, 
        username, 
        termsAccepted, 
        captchaToken 
      });
      setResponse(res.data);
    } catch (err) {
      alert(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-900 text-zinc-100 px-4">
      <div className="mb-6 sm:mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">📄 PDF Editor</h1>
        <p className="text-zinc-400 mt-1 text-sm sm:text-base">Edit • Sign • Translate PDFs</p>
      </div>

      <div className="w-full max-w-sm sm:max-w-md bg-zinc-800 border border-zinc-700 rounded-xl p-5 sm:p-6 shadow-lg">
        <h2 className="text-xl sm:text-2xl font-semibold text-center mb-5 sm:mb-6">Create account</h2>

        <form onSubmit={(e) => { e.preventDefault(); handleSignup(); }} className="space-y-4">
          
          {/* Email & Username inputs remain exactly the same as your code... */}
          <div>
            <input type="email" placeholder="Email" value={email} onChange={(e) => { setEmail(e.target.value); if (emailRegex.test(e.target.value)) setEmailError(""); }} onBlur={handleEmailBlur} className={`w-full px-3 py-2 rounded-md bg-zinc-900 border ${emailError ? "border-red-500" : "border-zinc-700"} text-zinc-100 outline-none focus:ring-2`} />
            {emailError && <p className="text-red-400 text-xs mt-1">{emailError}</p>}
          </div>

          <div>
            <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-3 py-2 rounded-md bg-zinc-900 border border-zinc-700 text-zinc-100 outline-none focus:ring-2" />
          </div>

          <div className="relative">
            <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 pr-10 rounded-md bg-zinc-900 border border-zinc-700 text-zinc-100 outline-none focus:ring-2" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-2 flex items-center text-zinc-400 hover:text-zinc-200">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* NEW: Terms & Conditions Checkbox */}
          <div className="flex items-start gap-2 mt-2">
            <input 
              type="checkbox" 
              id="terms" 
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-1 bg-zinc-900 border-zinc-700 rounded cursor-pointer" 
            />
            <label htmlFor="terms" className="text-sm text-zinc-400 cursor-pointer">
              I have read and agree to the <span className="text-indigo-400 hover:underline">Terms and Conditions</span>.
            </label>
          </div>

          {/* NEW: Google reCAPTCHA Widget */}
          <div className="flex justify-center mt-2">
            <ReCAPTCHA
              sitekey="6Lf5q3ksAAAAAPTbu_3uQ4Z0Vu6OlycGtpjk-M2y"
              onChange={(token) => setCaptchaToken(token)}
              theme="dark" // Matches your zinc-900 theme!
            />
          </div>

          <button
            type="submit"
            disabled={loading || !!emailError || response || !termsAccepted || !captchaToken}
            className={`w-full py-2.5 rounded-md font-medium transition text-sm sm:text-base ${response ? 'bg-green-600' : 'bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50'}`}
          >
            {loading ? "Creating account..." : response ? 'Account Created! Check Email.' : "Sign up"}
          </button>
        </form>

        {response && (
          <button className="w-full bg-blue-400 text-zinc-900 font-bold px-4 py-2 rounded-xl mt-4 cursor-pointer hover:bg-blue-300 transition" onClick={() => copyToClipboard(response.privateKey)}>
            Copy your private key
          </button>
        )}

        <p className="text-xs sm:text-sm text-zinc-400 text-center mt-4">
          Already have an account? <span onClick={() => navigate("/login")} className="text-indigo-400 cursor-pointer hover:underline">Log in</span>
        </p>
      </div>
    </div>
  );
}