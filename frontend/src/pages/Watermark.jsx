import React, { useState, useEffect, useRef } from 'react';
import { createWatermarkImage } from '../../utils/textToImage.js';
import { processPdf } from '../../hooks/usePdfProcessor.js';
import { Upload, Download, Type, RotateCw, Ghost, Maximize, Palette } from 'lucide-react';

import * as pdfjsLib from 'pdfjs-dist';
import GlobalWorker from 'pdfjs-dist/build/pdf.worker.mjs?url'; // Vite-specific worker loader

pdfjsLib.GlobalWorkerOptions.workerSrc = GlobalWorker;

export default function WatermarkTool() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState("CONFIDENTIAL");
  const [watermarkImg, setWatermarkImg] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [settings, setSettings] = useState({
    color: '#ef4444',
    rotation: -45,
    opacity: 0.4,
    scale: 0.3,
    fontFamily: 'sans-serif',
    position: 'center' // Default
  });

  const positions = [
    'top-left', 'top-center', 'top-right',
    'middle-left', 'center', 'middle-right',
    'bottom-left', 'bottom-center', 'bottom-right'
  ];

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // FIX: Stable PDF Rendering
  useEffect(() => {
    if (!file) return;
    const render = async () => {
      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1.2 });
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: context, viewport }).promise;
    };
    render();
  }, [file]);

  // Sync Watermark Preview
  useEffect(() => {
    createWatermarkImage(text, settings).then(setWatermarkImg);
  }, [text, settings]);

  const handleDownload = async () => {
    if (!file || !watermarkImg) return;
    setIsProcessing(true);
    try {
      const buffer = await file.arrayBuffer();
      const bytes = await processPdf(buffer, watermarkImg, settings);
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `watermarked.pdf`;
      link.click();
    } catch (e) { console.error(e); }
    setIsProcessing(false);
  };

  return (
    <div className="flex h-screen bg-[#09090b] text-zinc-100 font-sans overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-80 bg-[#121214] border-r border-zinc-800 p-6 flex flex-col space-y-6 shadow-2xl z-20">
        <h1 className="text-xl font-bold">Watermark Editor</h1>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2"><Type size={14} /> Text</label>
            <input className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 outline-none focus:ring-1 focus:ring-blue-500" value={text} onChange={(e) => setText(e.target.value)} />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2"><Palette size={14} /> Color</label>
            <div className="flex items-center gap-3 bg-zinc-900 p-2 rounded-lg border border-zinc-800">
              <input type="color" className="w-8 h-8 bg-transparent border-none cursor-pointer" value={settings.color} onChange={(e) => setSettings({ ...settings, color: e.target.value })} />
              <span className="text-sm font-mono uppercase">{settings.color}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-zinc-500 uppercase"><label className="flex items-center gap-2"><RotateCw size={14} /> Rotation</label><span>{settings.rotation}°</span></div>
            <input type="range" min="-180" max="180" className="w-full accent-blue-600" value={settings.rotation} onChange={(e) => setSettings({ ...settings, rotation: parseInt(e.target.value) })} />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-zinc-500 uppercase"><label className="flex items-center gap-2"><Maximize size={14} /> Scale</label><span>{Math.round(settings.scale * 100)}%</span></div>
            <input type="range" min="0.1" max="1" step="0.05" className="w-full accent-blue-600" value={settings.scale} onChange={(e) => setSettings({ ...settings, scale: parseFloat(e.target.value) })} />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-zinc-500 uppercase"><label className="flex items-center gap-2"><Ghost size={14} /> Opacity</label><span>{Math.round(settings.opacity * 100)}%</span></div>
            <input type="range" min="0" max="1" step="0.1" className="w-full accent-blue-600" value={settings.opacity} onChange={(e) => setSettings({ ...settings, opacity: parseFloat(e.target.value) })} />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">Position</label>
            <div className="grid grid-cols-3 gap-2 bg-zinc-900 p-2 rounded-lg border border-zinc-800">
              {positions.map((pos) => (
                <button
                  key={pos}
                  onClick={() => setSettings({ ...settings, position: pos })}
                  className={`h-8 rounded border transition-all ${settings.position === pos
                      ? 'bg-blue-600 border-blue-400'
                      : 'bg-zinc-800 border-zinc-700 hover:border-zinc-500'
                    }`}
                  title={pos}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">Font Style</label>
            <select
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 outline-none"
              value={settings.fontFamily}
              onChange={(e) => setSettings({ ...settings, fontFamily: e.target.value })}
            >
              <option value="sans-serif">Sans Serif</option>
              <option value="serif">Serif</option>
              <option value="monospace">Monospace</option>
              <option value="cursive">Cursive</option>
            </select>
          </div>
        </div>

        <button onClick={handleDownload} disabled={!file || isProcessing} className="w-full mt-auto bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold transition-all disabled:bg-zinc-800">
          {isProcessing ? "Embedding..." : "Download PDF"}
        </button>
      </aside>

      {/* PREVIEW */}
      <main className="flex-1 bg-[#09090b] flex items-center justify-center p-10 overflow-auto bg-[radial-gradient(#1c1c1f_1px,transparent_1px)] [background-size:25px_25px]">
        {file ? (
          <div className="relative shadow-2xl bg-white flex items-center justify-center border border-zinc-800">
            {/* PDF Canvas renders the background */}
            <canvas ref={canvasRef} className="block shadow-inner" />

            {/* Watermark Overlay Layer */}
            
<div className={`absolute inset-0 pointer-events-none flex p-8 ${
  settings.position.includes('top') ? 'items-start' : 
  settings.position.includes('bottom') ? 'items-end' : 'items-center'
} ${
  settings.position.includes('left') ? 'justify-start' : 
  settings.position.includes('right') ? 'justify-end' : 'justify-center'
}`}>
  {watermarkImg && (
    <img 
      src={watermarkImg} 
      style={{
        width: `${settings.scale * 100}%`,
        transform: `rotate(${-settings.rotation}deg)`,
        opacity: settings.opacity,
        transformOrigin: 'center center'
      }}
    />
  )}
</div>
          </div>
        ) : (
          <div onClick={() => fileInputRef.current.click()} className="border-2 border-dashed border-zinc-800 p-20 rounded-3xl cursor-pointer hover:border-blue-500 transition-all text-zinc-500 text-center">
            <Upload size={48} className="mx-auto mb-4 text-zinc-700" />
            <p>Click to upload PDF</p>
          </div>
        )}
      </main>

      <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} />
    </div>
  );
}

//here