import React, { useState, useEffect, useRef } from 'react';
import { createWatermarkImage } from '../../utils/textToImage.js';
import { processPdf } from '../../hooks/usePdfProcessor.js';
import { Upload, Type, RotateCw, Ghost, Maximize, Shield, LayoutGrid, Palette } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist'; // import PDF.js library for client-side PDF rendering
import GlobalWorker from 'pdfjs-dist/build/pdf.worker.mjs?url'; // Vite-specific PDF worker loader import

pdfjsLib.GlobalWorkerOptions.workerSrc = GlobalWorker; // tell PDF.js where the worker script is located




export default function WatermarkTool() {


  const getPdfDimensions = async (fileUrl) => {
    if (!fileUrl) return null;
    try {
      // 1. Load the document
      const loadingTask = pdfjsLib.getDocument(fileUrl);
      const pdf = await loadingTask.promise;

      // 2. Get the specific page (1-based index)
      const page = await pdf.getPage(1);

      // 3. Get the viewport at scale 1.0
      const viewport = page.getViewport({ scale: 1 });

      // Width and Height are in points (1pt = 1/72 inch)
      console.log(`Width: ${viewport.width}pt, Height: ${viewport.height}pt`);

      return {
        width: viewport.width,
        height: viewport.height,
        numPages: pdf.numPages
      };
    } catch (error) {
      console.error("Error loading PDF:", error);
    }
  };

  const [file, setFile] = useState(null);
  const [text, setText] = useState("text");
  const [pdfDims, setPdfDims] = useState(null);
  const [watermarkImg, setWatermarkImg] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);

  const [settings, setSettings] = useState({
    color: '#808080',
    rotation: 45,
    opacity: 0.4,
    scale: 0.35,
    fontFamily: 'Times-Roman',
    position: 'center',
    flatten: false,
  });

  useEffect(() => {


    if (pdfDims) {

      if (settings.position.includes('left')) setX(10);
      else if (settings.position.includes('right')) setX(pdfDims.width - settings.scale * 65 * text.length - 10);
      else setX((pdfDims.width / 2) - (settings.scale * 65 * text.length / 2));
      if (settings.position.includes('top')) setY(pdfDims.height - settings.scale * 70 - 10);
      else if (settings.position.includes('bottom')) setY(10);
      else setY((pdfDims.height / 2) - (settings.scale * 70 / 2));
    }
  }, [file,settings,pdfDims])

  const positions = [
    'top-left', 'top-center', 'top-right',
    'middle-left', 'center', 'middle-right',
    'bottom-left', 'bottom-center', 'bottom-right'
  ];

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // when `file` changes, render the first PDF page to canvas
  useEffect(() => {
    if (!file) return; // do nothing if no file selected

    const render = async () => {
      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise; // load PDF document
      const page = await pdf.getPage(1); // get the first page
      const viewport = page.getViewport({ scale: 1.0 }); // set a viewport scale for nicer preview
      const canvas = canvasRef.current; // obtain canvas DOM node
      const context = canvas.getContext('2d'); // get 2D drawing context
      canvas.width = viewport.width; // set canvas pixel width
      canvas.height = viewport.height; // set canvas pixel height
      await page.render({ canvasContext: context, viewport }).promise; // render the PDF page onto canvas
    };

    render();

  }, [file]);

  useEffect(() => {
    if (!file) return;

    const loadDims = async () => {
      const dims = await getPdfDimensions(URL.createObjectURL(file));
      setPdfDims(dims);
    };

    loadDims();
  }, [file]);



  useEffect(() => { // regenerate watermark image whenever text or settings change
    createWatermarkImage(text, settings).then((result) => setWatermarkImg(result)); // create the data URL and store it
  }, [text, settings]);

  const handleDownload = async () => {

    if (!file || !watermarkImg) return;

    setIsProcessing(true);

    try {
      const buffer = await file.arrayBuffer(); // read input PDF as ArrayBuffer
      const bytes = await processPdf(buffer, watermarkImg, settings, text); // embed watermark and get modified bytes
      const blob = new Blob([bytes], { type: 'application/pdf' }); // create a blob from bytes
      const link = document.createElement('a'); // create a temporary anchor
      link.href = URL.createObjectURL(blob); // create object URL for the blob
      link.download = `watermarked.pdf`; // set suggested filename
      link.click(); // trigger download
    } catch (e) { console.error(e); } // log any error
    setIsProcessing(false);
  };

  return ( // component JSX return
    <div className="flex h-screen bg-[#09090b] text-zinc-100 font-sans overflow-hidden"> {/* top-level layout container */}
      {/* SIDEBAR */}
      <aside className="w-80 bg-[#121214] border-r border-zinc-800 p-6 flex flex-col space-y-6 shadow-2xl z-20 h-full">
        <div className="p-6 pb-2">
          <h1 className="text-xl font-bold tracking-tight">Watermark Editor</h1>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pt-4 space-y-8">


          <div className="space-y-4"> {/* group of control blocks */}
            <div className="space-y-2"> {/* text input block */}
              <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2"><Type size={14} /> Text</label> {/* label with icon */}
              <input className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 outline-none focus:ring-1 focus:ring-blue-500" value={text} onChange={(e) => setText(e.target.value)} />
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
                <Palette size={14} /> Watermark Color
              </label>

              {/* Professional Swatches */}
              <div className="flex flex-wrap gap-2 mb-2">
                {[
                  { name: 'Stamp Red', hex: '#ef4444' },
                  { name: 'Security Blue', hex: '#3b82f6' },
                  { name: 'Formal Black', hex: '#18181b' },
                  { name: 'Soft Slate', hex: '#64748b' },
                ].map((preset) => (
                  <button
                    key={preset.hex}
                    onClick={() => setSettings({ ...settings, color: preset.hex })}
                    className={`w-6 h-6 ring-2 ring-zinc-700 rounded-full border-2 transition-transform hover:scale-110 ${settings.color === preset.hex ? 'border-white scale-110' : 'border-transparent'
                      }`}
                    style={{ backgroundColor: preset.hex }}
                    title={preset.name}
                  />
                ))}
              </div>

              {/* Custom Color Control */}
              <div className="flex items-center gap-3 bg-zinc-900 p-2 rounded-xl border border-zinc-800 group hover:border-zinc-700 transition-colors">
                <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-zinc-700">
                  <input
                    type="color"
                    className="absolute -inset-2 w-12 h-12 bg-transparent border-none cursor-pointer"
                    value={settings.color}
                    onChange={(e) => setSettings({ ...settings, color: e.target.value })}
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase leading-none mb-1">Custom Hex</span>
                  <span className="text-sm font-mono uppercase text-zinc-200">{settings.color}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
                    <RotateCw size={14} /> Orientation
                  </label>
                  <p className="text-[10px] text-zinc-600 font-medium">Tilt your watermark</p>
                </div>
                <span className="text-sm font-mono font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded">
                  {settings.rotation}°
                </span>
              </div>

              {/* Quick Snap Angles */}
              <div className="flex justify-between gap-1">
                {[0, 45, 90, -45].map((angle) => (
                  <button
                    key={angle}
                    onClick={() => setSettings({ ...settings, rotation: angle })}
                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-md border transition-all ${settings.rotation === angle
                      ? 'bg-zinc-800 border-zinc-600 text-zinc-100 shadow-sm'
                      : 'bg-transparent border-zinc-800 text-zinc-500 hover:border-zinc-700'
                      }`}
                  >
                    {angle === 0 ? 'Flat' : `${angle}°`}
                  </button>
                ))}
              </div>

              {/* Visual Slider */}
              <div className="relative flex items-center group">
                <input
                  type="range"
                  min="-180"
                  max="180"
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  value={settings.rotation}
                  onChange={(e) => setSettings({ ...settings, rotation: parseInt(e.target.value) })}
                />

                {/* Visual Center Notch */}
                <div className="absolute left-1/2 -bottom-1 w-px h-2 bg-zinc-700 -translate-x-1/2 pointer-events-none" />
              </div>

              {/* Reset Button (only shows when not at 0) */}
              {settings.rotation !== 0 && (
                <button
                  onClick={() => setSettings({ ...settings, rotation: 0 })}
                  className="text-[10px] font-bold text-zinc-500 hover:text-blue-500 transition-colors flex items-center gap-1 mx-auto"
                >
                  Reset to Horizontal
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
                    <Maximize size={14} /> Watermark Size
                  </label>
                </div>
                <span className="text-sm font-mono font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded">
                  {Math.round(settings.scale * 100)}%
                </span>
              </div>

              {/* Semantic Presets */}
              <div className="flex justify-between gap-1">
                {[
                  { label: 'Small', val: 0.15 },
                  { label: 'Standard', val: 0.35 },
                  { label: 'Large', val: 0.65 },
                  { label: 'Full', val: 0.90 }
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => setSettings({ ...settings, scale: preset.val })}
                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-md border transition-all ${Math.abs(settings.scale - preset.val) < 0.01
                      ? 'bg-zinc-800 border-zinc-600 text-zinc-100'
                      : 'bg-transparent border-zinc-800 text-zinc-500 hover:border-zinc-700'
                      }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Precision Slider */}
              <div className="space-y-2">
                <input
                  type="range"
                  min="0.05"
                  max="1"
                  step="0.01"
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  value={settings.scale}
                  onChange={(e) => setSettings({ ...settings, scale: parseFloat(e.target.value) })}
                />
                <div className="flex justify-between text-[9px] text-zinc-600 font-bold px-1 uppercase tracking-tighter">
                  <span>Tiny</span>
                  <span>Cover Page</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
                  <Ghost size={14} /> Transparency
                </label>
                <span className="text-sm font-mono font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded">
                  {Math.round(settings.opacity * 100)}%
                </span>
              </div>

              <div className="relative flex items-center bg-zinc-900/50 p-3 rounded-xl border border-zinc-800">
                {/* Corrected: 0% is Ghost, 100% is Solid */}
                <span className="text-[10px] font-bold text-zinc-600 mr-3 uppercase tracking-tighter">Ghost</span>

                <input
                  type="range"
                  min="0.05"
                  max="1"
                  step="0.05"
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  value={settings.opacity}
                  onChange={(e) => setSettings({ ...settings, opacity: parseFloat(e.target.value) })}
                />

                <span className="text-[10px] font-bold text-zinc-600 ml-3 uppercase tracking-tighter">Solid</span>
              </div>


            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
                  <LayoutGrid size={14} /> Anchor
                </label>
                <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                  {settings.position.replace('-', ' ')}
                </span>
              </div>

              {/* Added max-w-[160px] and mx-auto to tighten the width */}
              <div className="grid grid-cols-3 gap-1.5 bg-[#09090b] p-1.5 rounded-xl border border-zinc-800 shadow-inner max-w-[160px] mx-auto">
                {positions.map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setSettings({ ...settings, position: pos })}
                    className={`h-7 rounded-md border flex items-center justify-center transition-all duration-200 ${settings.position === pos
                      ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.15)]'
                      : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                      }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full transition-all ${settings.position === pos
                      ? 'bg-blue-400 scale-125 shadow-[0_0_5px_#3b82f6]'
                      : 'bg-zinc-700'
                      }`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
                  <Type size={14} /> Typography
                </label>
                <span className="text-[10px] font-mono text-zinc-500 bg-zinc-800/50 px-2 py-0.5 rounded">
                  {settings.fontFamily}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Ag', value: 'Times-Roman', name: 'Serif' },
                  { label: 'Ag', value: 'Helvetica', name: 'Sans' },
                  { label: 'Ag', value: 'Courier', name: 'Mono' },
                  { label: 'Ag', value: 'comic sans ms', name: 'comic' },
                ].map((font) => (
                  <button
                    key={font.value}
                    onClick={() => setSettings({ ...settings, fontFamily: font.value })}
                    className={`flex items-center gap-3 p-2 rounded-xl border transition-all duration-200 ${settings.fontFamily === font.value
                      ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.1)]'
                      : 'bg-[#09090b] border-zinc-800 hover:border-zinc-700'
                      }`}
                  >
                    {/* Visual Preview Square */}
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg shadow-sm ${settings.fontFamily === font.value ? 'bg-blue-500 text-white' : 'bg-zinc-800 text-zinc-400'
                        }`}
                      style={{
                        fontFamily: font.value === 'comic' ? 'comic sans ms' : font.value === 'Times-Roman' || font.value === 'Times-BoldItalic' ? 'serif' :
                          font.value === 'Courier' ? 'monospace' : 'sans-serif',
                        fontStyle: font.value.includes('Italic') ? 'italic' : 'normal',
                        fontWeight: font.value.includes('Bold') ? 'bold' : 'normal'
                      }}
                    >
                      {font.label}
                    </div>

                    <span className={`text-[13px] font-bold  tracking-tight ${settings.fontFamily === font.value ? 'text-blue-400' : 'text-zinc-500'}`}
                      style={{
                        fontFamily: font.value === 'comic' ? 'comic sans ms' : font.value === 'Times-Roman' || font.value === 'Times-BoldItalic' ? 'serif' :
                          font.value === 'Courier' ? 'monospace' : 'sans-serif',
                        fontStyle: font.value.includes('Italic') ? 'italic' : 'normal',
                        fontWeight: font.value.includes('Bold') ? 'bold' : 'normal'
                      }}>
                      {font.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-2 border-t border-zinc-800/50">
              <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${settings.flatten ? 'bg-blue-600/5 border-blue-500/50' : 'bg-zinc-900/30 border-zinc-800'
                }`}>
                <div className="space-y-0.5">
                  <label className="text-xs font-bold text-zinc-200 flex items-center gap-2 uppercase tracking-wider">
                    <Shield size={14} className={settings.flatten ? "text-blue-400" : "text-zinc-500"} />
                    Copy Protection
                  </label>
                  <p className="text-[10px] text-zinc-500 leading-tight">Add gibberish layer to pollute block selection.</p>
                </div>

                <button
                  onClick={() => setSettings({ ...settings, flatten: !settings.flatten })}
                  className={`w-9 h-5 rounded-full transition-colors relative ${settings.flatten ? 'bg-blue-600' : 'bg-zinc-700'
                    }`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all shadow-sm ${settings.flatten ? 'left-5' : 'left-1'
                    }`} />
                </button>
              </div>
            </div>


          </div>
        </div>
        <button onClick={handleDownload} disabled={!file || isProcessing} className="w-full mt-auto bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold transition-all disabled:bg-zinc-800"> {/* download button */}
          {isProcessing ? "Embedding..." : "Download PDF"} {/* show status text when processing */}
        </button>
      </aside>


      <main className="flex-1 bg-[#09090b] flex items-center justify-center p-10 overflow-auto">
        {file ? (
          <div className={`relative shadow-2xl bg-white border-3 border-blue-800 overflow-hidden`} > {/* container for PDF preview with watermark overlay */}

            <canvas ref={canvasRef} />

            {/* Watermark Overlay Layer ${settings.position.includes('top') ? 'items-start' :
              settings.position.includes('bottom') ? 'items-end' : 'items-center'
              } ${settings.position.includes('left') ? 'justify-start' :
                settings.position.includes('right') ? 'justify-end' : 'justify-center'
              } */}

              {watermarkImg && file && pdfDims && (
            <div className={`absolute border border-3 border-red-400 pointer-events-none flex items-center`} style={{height: `${settings.scale * 70}px`, width: `${settings.scale*65*text.length}px`, left:`${x}px`, top:`${pdfDims.height - y - settings.scale * 70}px`, transform: `rotate(${-settings.rotation}deg)`}}>
                <img
                  src={watermarkImg}
                  style={{
                    width: `${settings.scale * 65 * text.length}px`,
                    height: `${settings.scale * 70}px`,
                    // Converting PDF Bottom-Left to CSS Top-Left:
                    opacity: settings.opacity,
                    
                    pointerEvents: 'none',
                    zIndex: 10,
                  }}
                />
            </div>
              )}

          </div>
        ) : (

          //input pdf upload area
          <div onClick={() => fileInputRef.current.click()} className="border-2 border-dashed border-zinc-800 p-20 rounded-3xl cursor-pointer hover:border-blue-500 transition-all text-zinc-500 text-center"> {/* placeholder upload area */}
            <Upload size={48} className="mx-auto mb-4 text-zinc-700" />
            <p>Click to upload PDF</p>
          </div>
        )}
      </main>

      <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} /> {/* hidden file input used to trigger file selection */}
    </div>
  );
}

//here 