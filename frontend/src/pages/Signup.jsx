import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { Eye, EyeOff, X, Printer } from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha"; // <-- Import Recaptcha
import { useSearchParams } from "react-router-dom";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Signup() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false); // <-- T&C State
  const [captchaToken, setCaptchaToken] = useState(null);    // <-- CAPTCHA State

  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const navigate = useNavigate();

  const handleTermsScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    // If the distance from top + container height is >= total scrollable height (with a 10px buffer)
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      setHasScrolledToBottom(true);
    }
  };

  const acceptTermsFromModal = () => {
    setTermsAccepted(true);
    setShowTermsModal(false);
  };

  const printTerms = () => {
    // A simple trigger for the browser's print dialog
    window.print();
  };

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
        captchaToken,
        termsAccepted
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
          {/* UPDATED: Terms & Conditions Checkbox */}
          <div className="flex items-start gap-2 mt-2">
            <input
              type="checkbox"
              id="terms"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-1 bg-zinc-900 border-zinc-700 rounded cursor-pointer"
            />
            <label htmlFor="terms" className="text-sm text-zinc-400">
              I have read and agree to the{" "}
              <button
                type="button"
                onClick={() => setShowTermsModal(true)}
                className="text-indigo-400 hover:underline font-bold focus:outline-none"
              >
                Terms and Conditions
              </button>.
            </label>
          </div>

          {/* NEW: Google reCAPTCHA Widget */}
          <div className="flex justify-center mt-4 mb-4">
            <ReCAPTCHA
              sitekey="6Lc9yXwsAAAAAKrsGlG7LWTRYBg0vBvGQwXenNrO"
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

        <p className="text-xs sm:text-sm text-zinc-400 text-center mt-4">
          Already have an account? <span onClick={() => navigate("/login")} className="text-indigo-400 cursor-pointer hover:underline">Log in</span>
        </p>
      </div>


      {/* NEW: Interactive Terms & Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">

            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-800">
              <h3 className="text-xl font-bold text-zinc-100">Terms and Conditions</h3>
              <button
                onClick={() => setShowTermsModal(false)}
                className="text-zinc-400 hover:text-zinc-100 transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            {/* Modal Body (Scrollable) */}
            <div
              className="flex-1 overflow-y-auto p-6 space-y-4 text-sm text-zinc-300 pretty-scrollbar print-section"
              onScroll={handleTermsScroll}
            >
              <h2 className="text-2xl font-black text-zinc-100 mb-6">Electronic Signature Agreement & Terms</h2>
              <p><strong>Last Updated: {new Date().toLocaleDateString()}</strong></p>
              <p>By accessing or using our application, you agree to be bound by these Terms and Conditions. This document constitutes a legally binding agreement regarding your use of electronic signatures and electronic records.</p>

              <h4 className="font-bold text-zinc-100 mt-6 border-b border-zinc-700 pb-2">1. Global E-Signature Compliance</h4>
              <p>This platform facilitates the execution of documents using electronic signatures. Our cryptographic architecture is designed to comply with major international electronic signature frameworks, including but not limited to:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li><strong>The ESIGN Act (USA):</strong> The Electronic Signatures in Global and National Commerce Act of 2000.</li>
                <li><strong>eIDAS Regulation (EU):</strong> The Electronic Identification, Authentication and Trust Services Regulation (EU No 910/2014).</li>
                <li><strong>The IT Act (India):</strong> The Information Technology Act, 2000, governing electronic governance and digital signatures.</li>
              </ul>
              <p className="mt-2">By proceeding, you agree that your electronic signature carries the same legal weight and binding effect as a handwritten, physical signature.</p>

              <h4 className="font-bold text-zinc-100 mt-6 border-b border-zinc-700 pb-2">2. Your Consumer Rights</h4>
              <p>Before you consent to do business with us electronically, you have the following legal rights regarding your electronic records and signatures:</p>
              <ol className="list-decimal pl-5 space-y-2 mt-2">
                <li><strong>Right to Paper Records:</strong> You have the right to request a physical, paper copy of any document you sign electronically on this platform.</li>
                <li><strong>Right to Withdraw Consent:</strong> You may withdraw your consent to use electronic signatures and records at any time. (Note: Withdrawing consent does not invalidate previously signed documents).</li>
                <li><strong>Right to Hardware/Software Transparency:</strong> You have the right to know the minimum hardware and software requirements necessary to access and retain these electronic records (e.g., a modern web browser and a PDF reader).</li>
                <li><strong>Right to Copies:</strong> You have the fundamental right to download and save copies of all your executed electronic records for your personal archives.</li>
                <li><strong>Right to Scope Awareness:</strong> You have the right to know that your consent applies to all documents, notices, and disclosures routed to you through this specific platform.</li>
              </ol>

              <h4 className="font-bold text-zinc-100 mt-6 border-b border-zinc-700 pb-2">3. Cryptography and Security</h4>
              <p>Our service utilizes localized cryptographic key generation (ECDSA P-256). You acknowledge that your private key is encrypted using your personal password. We operate on a zero-knowledge architecture; if you lose your password, we cannot recover your private key or decrypt your identity signature.</p>

              {/* Buffer to force scrolling */}
              <div className="mt-12 opacity-50 italic text-center text-xs">Keep scrolling to accept...</div>
              <div className="h-[30vh]"></div>
              <p className="text-center font-bold text-zinc-100">End of Terms and Conditions</p>
            </div>

            {/* Modal Footer (Action Buttons) */}
            <div className="p-6 border-t border-zinc-800 flex items-center justify-between bg-zinc-800/30 rounded-b-2xl">
              <button
                onClick={printTerms}
                className="flex items-center gap-2 px-4 py-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition"
              >
                <Printer size={18} /> Print
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="px-5 py-2 text-zinc-300 hover:bg-zinc-800 rounded-lg transition"
                >
                  Decline
                </button>
                <button
                  onClick={acceptTermsFromModal}
                  disabled={!hasScrolledToBottom}
                  className={`px-6 py-2 rounded-lg font-bold transition-all shadow-lg ${hasScrolledToBottom
                    ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20"
                    : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    }`}
                >
                  {hasScrolledToBottom ? "I Accept" : "Scroll to Accept"}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}