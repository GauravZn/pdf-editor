import React, { useState, useEffect, useRef } from 'react'; // import React and hooks used in this component
import { createWatermarkImage } from '../../utils/textToImage.js'; // import helper to render watermark text as an image
import { processPdf } from '../../hooks/usePdfProcessor.js'; // import PDF processing function to embed watermark into PDF bytes
import { Upload, Download, Type, RotateCw, Ghost, Maximize, Palette } from 'lucide-react'; // import icon components from lucide-react

import * as pdfjsLib from 'pdfjs-dist'; // import PDF.js library for client-side PDF rendering
import GlobalWorker from 'pdfjs-dist/build/pdf.worker.mjs?url'; // Vite-specific PDF worker loader import

pdfjsLib.GlobalWorkerOptions.workerSrc = GlobalWorker; // tell PDF.js where the worker script is located

export default function WatermarkTool() { // define and export the main component
  const [file, setFile] = useState(null); // store the uploaded File object
  const [text, setText] = useState("text"); // store watermark text string
  const [watermarkImg, setWatermarkImg] = useState(null); // store data URL of generated watermark image
  const [isProcessing, setIsProcessing] = useState(false); // flag while embedding watermark into PDF
  
  const [settings, setSettings] = useState({ // store watermark appearance and layout settings
    color: '#808080', // default text color
    rotation: 45, // default rotation degrees
    opacity: 0.4, // default opacity 0..1
    scale: 0.3, // default scale (fraction of container)
    fontFamily: 'sans-serif', // default font family
    position: 'center' // default position keyword
  });

  const positions = [ // list of supported position keywords
    'top-left', 'top-center', 'top-right',
    'middle-left', 'center', 'middle-right',
    'bottom-left', 'bottom-center', 'bottom-right'
  ];

  const canvasRef = useRef(null); // ref to the canvas used for PDF preview
  const fileInputRef = useRef(null); // ref to the hidden file input element

  // FIX: Stable PDF Rendering
  useEffect(() => { // when `file` changes, render the first PDF page to canvas
    if (!file) return; // do nothing if no file selected
    const render = async () => { // async function to read and render PDF
      const buffer = await file.arrayBuffer(); // read file into an ArrayBuffer
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise; // load PDF document
      const page = await pdf.getPage(1); // get the first page
      const viewport = page.getViewport({ scale: 1.2 }); // set a viewport scale for nicer preview
      const canvas = canvasRef.current; // obtain canvas DOM node
      const context = canvas.getContext('2d'); // get 2D drawing context
      canvas.width = viewport.width; // set canvas pixel width
      canvas.height = viewport.height; // set canvas pixel height
      await page.render({ canvasContext: context, viewport }).promise; // render the PDF page onto canvas
    };
    render(); // call the async renderer
  }, [file]); // re-run when `file` changes

  // Sync Watermark Preview
  useEffect(() => { // regenerate watermark image whenever text or settings change
    createWatermarkImage(text, settings).then(setWatermarkImg); // create the data URL and store it
  }, [text, settings]); // dependencies for watermark generation

  const handleDownload = async () => { // called when user clicks Download PDF
    if (!file || !watermarkImg) return; // require file and watermark image
    setIsProcessing(true); // set processing flag
    try {
      const buffer = await file.arrayBuffer(); // read input PDF as ArrayBuffer
      const bytes = await processPdf(buffer, watermarkImg, settings); // embed watermark and get modified bytes
      const blob = new Blob([bytes], { type: 'application/pdf' }); // create a blob from bytes
      const link = document.createElement('a'); // create a temporary anchor
      link.href = URL.createObjectURL(blob); // create object URL for the blob
      link.download = `watermarked.pdf`; // set suggested filename
      link.click(); // trigger download
    } catch (e) { console.error(e); } // log any error
    setIsProcessing(false); // clear processing flag
  };

  return ( // component JSX return
    <div className="flex h-screen bg-[#09090b] text-zinc-100 font-sans overflow-hidden"> {/* top-level layout container */}
      {/* SIDEBAR */}
      <aside className="w-80 bg-[#121214] border-r border-zinc-800 p-6 flex flex-col space-y-6 shadow-2xl z-20"> {/* left sidebar for controls */}
        <h1 className="text-xl font-bold">Watermark Editor</h1> {/* title */}

        <div className="space-y-4"> {/* group of control blocks */}
          <div className="space-y-2"> {/* text input block */}
            <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2"><Type size={14} /> Text</label> {/* label with icon */}
            <input className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 outline-none focus:ring-1 focus:ring-blue-500" value={text} onChange={(e) => setText(e.target.value)} /> {/* text input bound to `text` state */}
          </div>

          <div className="space-y-2"> {/* color picker block */}
            <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2"><Palette size={14} /> Color</label> {/* label with palette icon */}
            <div className="flex items-center gap-3 bg-zinc-900 p-2 rounded-lg border border-zinc-800"> {/* color control container */}
              <input type="color" className="w-8 h-8 bg-transparent border-none cursor-pointer" value={settings.color} onChange={(e) => setSettings({ ...settings, color: e.target.value })} /> {/* native color input updating settings.color */}
              <span className="text-sm font-mono uppercase">{settings.color}</span> {/* show hex color value */}
            </div>
          </div>

          <div className="space-y-2"> {/* rotation slider block */}
            <div className="flex justify-between text-xs font-bold text-zinc-500 uppercase"><label className="flex items-center gap-2"><RotateCw size={14} /> Rotation</label><span>{settings.rotation}°</span></div> {/* label + value */}
            <input type="range" min="-180" max="180" className="w-full accent-blue-600" value={settings.rotation} onChange={(e) => setSettings({ ...settings, rotation: parseInt(e.target.value) })} /> {/* slider to set rotation */}
          </div>

          <div className="space-y-2"> {/* scale slider block */}
            <div className="flex justify-between text-xs font-bold text-zinc-500 uppercase"><label className="flex items-center gap-2"><Maximize size={14} /> Scale</label><span>{Math.round(settings.scale * 100)}%</span></div> {/* label + percent */}
            <input type="range" min="0.1" max="1" step="0.05" className="w-full accent-blue-600" value={settings.scale} onChange={(e) => setSettings({ ...settings, scale: parseFloat(e.target.value) })} /> {/* slider to control scale */}
          </div>

          <div className="space-y-2"> {/* opacity slider block */}
            <div className="flex justify-between text-xs font-bold text-zinc-500 uppercase"><label className="flex items-center gap-2"><Ghost size={14} /> Opacity</label><span>{Math.round(settings.opacity * 100)}%</span></div> {/* label + percent */}
            <input type="range" min="0" max="1" step="0.1" className="w-full accent-blue-600" value={settings.opacity} onChange={(e) => setSettings({ ...settings, opacity: parseFloat(e.target.value) })} /> {/* slider to control opacity */}
          </div>

          <div className="space-y-2"> {/* position picker block */}
            <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">Position</label> {/* label */}
            <div className="grid grid-cols-3 gap-2 bg-zinc-900 p-2 rounded-lg border border-zinc-800"> {/* grid of position buttons */}
              {positions.map((pos) => (
                <button
                  key={pos} // unique key for list rendering
                  onClick={() => setSettings({ ...settings, position: pos })} // set chosen position
                  className={`h-8 rounded border transition-all ${settings.position === pos
                      ? 'bg-blue-600 border-blue-400'
                      : 'bg-zinc-800 border-zinc-700 hover:border-zinc-500'
                    }`} // toggle styles for selected state
                  title={pos} // accessibility/title text
                />
              ))}
            </div>
          </div>

          <div className="space-y-2"> {/* font family selector */}
            <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">Font Style</label> {/* label */}
            <select
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 outline-none"
              value={settings.fontFamily}
              onChange={(e) => setSettings({ ...settings, fontFamily: e.target.value })}
            >
              <option value="sans-serif">Sans Serif</option> {/* option */}
              <option value="serif">Serif</option> {/* option */}
              <option value="monospace">Monospace</option> {/* option */}
              <option value="cursive">Cursive</option> {/* option */}
            </select>
          </div>
        </div>

        <button onClick={handleDownload} disabled={!file || isProcessing} className="w-full mt-auto bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold transition-all disabled:bg-zinc-800"> {/* download button */}
          {isProcessing ? "Embedding..." : "Download PDF"} {/* show status text when processing */}
        </button>
      </aside>

      {/* PREVIEW */}
      <main className="flex-1 bg-[#09090b] flex items-center justify-center p-10 overflow-auto bg-[radial-gradient(#1c1c1f_1px,transparent_1px)] [background-size:25px_25px]"> {/* preview area */}
        {file ? ( // if a file is selected, show the preview */)
          <div className="relative shadow-2xl bg-white flex items-center justify-center border border-zinc-800"> {/* paper-like container */}
            {/* PDF Canvas renders the background */}
            <canvas ref={canvasRef} className="block shadow-inner" />{/* canvas used for PDF page rendering */}

            {/* Watermark Overlay Layer */}
            
            <div className={`absolute inset-0 pointer-events-none flex p-8 ${
              settings.position.includes('top') ? 'items-start' : 
              settings.position.includes('bottom') ? 'items-end' : 'items-center'
            } ${
              settings.position.includes('left') ? 'justify-start' : 
              settings.position.includes('right') ? 'justify-end' : 'justify-center'
            }`}>{/* overlay container positioned according to settings */}
              {watermarkImg && ( // only render the img element if watermark image is ready
                <img 
                  src={watermarkImg} 
                  style={{
                    width: `${settings.scale * 100}%`, // scale width based on settings
                    transform: `rotate(${-settings.rotation}deg)`, // rotate according to settings (note sign)
                    opacity: settings.opacity, // apply opacity
                    transformOrigin: 'center center' // keep rotation origin centered
                  }}
                />
              )}
            </div>
          </div>
        ) : (
          <div onClick={() => fileInputRef.current.click()} className="border-2 border-dashed border-zinc-800 p-20 rounded-3xl cursor-pointer hover:border-blue-500 transition-all text-zinc-500 text-center"> {/* placeholder upload area */}
            <Upload size={48} className="mx-auto mb-4 text-zinc-700" /> {/* upload icon */}
            <p>Click to upload PDF</p> {/* user hint */}
          </div>
        )}
      </main>

      <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} /> {/* hidden file input used to trigger file selection */}
    </div>
  );
}

//here (end of file) - leftover marker preserved