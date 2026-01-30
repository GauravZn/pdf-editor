import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import api from "../api/axios";


export default function Watermark() {
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [text, setText] = useState("");
    const [opacity, setOpacity] = useState(0.3);
    const [rotation, setRotation] = useState(45);
    const [position, setPosition] = useState("center");
    const [repeat, setRepeat] = useState(false);
    const [loading, setLoading] = useState(false);

    const applyWatermark = async () => {
        if (!file || !text) {
            alert("Please select a PDF and enter watermark text");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("watermarkText", text);
        formData.append("opacity", opacity.toString());
        formData.append("rotation", rotation.toString());
        formData.append("position", position);
        formData.append("repeat", repeat ? "true" : "false");

        try {
            setLoading(true);

            const res = await api.post("/pdf/watermark", formData, {
                responseType: "blob",
            });

            /* ===== AUTO-INCREMENT FILENAME LOGIC ===== */
            const originalName = file.name.replace(/\.pdf$/i, "");
            const storageKey = `watermark_count_${originalName}`;

            let count = Number(localStorage.getItem(storageKey)) || 0;
            count += 1;
            localStorage.setItem(storageKey, count);

            const downloadName =
                count === 1
                    ? `${originalName}_watermark.pdf`
                    : `${originalName}_watermark_${count}.pdf`;

            const url = window.URL.createObjectURL(res.data);
            const link = document.createElement("a");
            link.href = url;
            link.download = downloadName;
            link.click();

            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert("Failed to apply watermark");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-900 text-zinc-100 px-4 py-8">
            <div className="max-w-md mx-auto bg-zinc-800 border border-zinc-700 rounded-xl p-6 shadow-lg">

                {/* BACK TO HOME */}
                <button
                    onClick={() => navigate("/dashboard")}
                    title="Back to Home"
                    aria-label="Back to Home"
                    className="
    fixed top-4 left-4 z-50
    p-2 rounded-full
    bg-zinc-800 border border-zinc-700
    text-zinc-300
    hover:text-white hover:bg-zinc-700
    transition
  "
                >
                    <ArrowLeft size={18} />
                </button>


                <h1 className="text-2xl font-semibold text-center mb-6">
                    Add Watermark
                </h1>

                {/* FILE INPUT */}
                <label
                    className="
            w-full flex items-center justify-center
            px-4 py-3 mb-4
            border border-zinc-600 rounded-md
            bg-zinc-900 cursor-pointer
            text-sm text-zinc-300
          "
                >
                    {file ? file.name : "Choose PDF file"}
                    <input
                        type="file"
                        accept="application/pdf"
                        spellCheck={false}
                        onChange={(e) => setFile(e.target.files[0])}
                        className="hidden"
                    />
                </label>

                {/* WATERMARK TEXT */}
                <input
                    type="text"
                    placeholder="Watermark text"
                    spellCheck={false}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="
            w-full mb-4 px-3 py-2
            rounded-md
            bg-zinc-900 border border-zinc-700
          "
                />

                {/* OPACITY */}
                <div className="mb-4">
                    <label className="text-sm text-zinc-400">
                        Opacity: {opacity}
                    </label>
                    <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.1"
                        value={opacity}
                        onChange={(e) => setOpacity(e.target.value)}
                        className="w-full accent-indigo-500"
                    />
                </div>

                {/* ROTATION */}
                <div className="mb-4">
                    <label className="text-sm text-zinc-400">
                        Rotation: {rotation}°
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="90"
                        step="5"
                        value={rotation}
                        onChange={(e) => setRotation(e.target.value)}
                        className="w-full accent-indigo-500"
                    />
                </div>

                {/* POSITION */}
                <div className="mb-4">
                    <label className="text-sm text-zinc-400 mb-1 block">
                        Position
                    </label>
                    <select
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        className="
    w-[80%]
    px-3 py-2
    bg-zinc-900 border border-zinc-700
    rounded-md
    text-zinc-100
    focus:outline-none focus:ring-2 focus:ring-indigo-500
    overflow-hidden
    truncate
    box-border
  "
                    >

                        <option value="center">Center</option>
                        <option value="top">Top</option>
                        <option value="bottom">Bottom</option>
                    </select>
                </div>

                {/* REPEAT */}
                <label className="flex items-center gap-2 mb-5 text-sm">
                    <input
                        type="checkbox"
                        checked={repeat}
                        onChange={(e) => setRepeat(e.target.checked)}
                        className="accent-indigo-500"
                    />
                    Repeat watermark across page
                </label>

                {/* SUBMIT */}
                <button
                    onClick={applyWatermark}
                    disabled={loading}
                    className="
            w-full py-2.5 rounded-md font-medium
            bg-indigo-600 hover:bg-indigo-500
            transition disabled:opacity-50
          "
                >
                    {loading ? "Processing..." : "Apply Watermark"}
                </button>
            </div>
        </div>
    );
}
