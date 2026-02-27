import React, { useState, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Type, PenTool, ArrowLeft } from 'lucide-react';
import DraggableField from './DraggableField';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

//  SLATE THEME PALETTE
const SIGNER_COLORS = ['#0e7490', '#be123c', '#047857', '#6d28d9', '#c2410c', '#1e293b', '#b91c1c', '#4338ca', '#a16207', '#15803d'];

const PlacementArena = ({ signers, setSigners, activeSignerIndex, setActiveSignerIndex, pdfFile, onBack, onSave, isSubmitting }) => {
  const [numPages, setNumPages] = useState(null);
  const [activePageNum, setActivePageNum] = useState(1);
  const scrollRef = useRef(null);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const pages = scrollRef.current.querySelectorAll('.pdf-page-wrapper');
    let closestPage = 1;
    let minDistance = Infinity;
    pages.forEach((page, idx) => {
      const rect = page.getBoundingClientRect();
      const distance = Math.abs(rect.top + rect.height / 2 - window.innerHeight / 2);
      if (distance < minDistance) {
        minDistance = distance;
        closestPage = idx + 1;
      }
    });
    setActivePageNum(closestPage);
  };

  //  THE SMART SPAWNER LOGIC
  const getSmartSpawnPosition = () => {
    const container = scrollRef.current;
    if (!container) return { page: 1, x: 50, y: 50 };

    const containerRect = container.getBoundingClientRect();
    const targetScreenY = containerRect.top + 150; // Aim for "Eye Level" (~150px down)
    
    const pages = container.querySelectorAll('.pdf-page-wrapper');

    for (let i = 0; i < pages.length; i++) {
      const pageRect = pages[i].getBoundingClientRect();
      
      // Is the target Y inside this page's vertical bounds?
      if (targetScreenY >= pageRect.top && targetScreenY <= pageRect.bottom) {
        let localY = targetScreenY - pageRect.top;
        return { 
            page: i + 1, 
            y: localY, 
            x: 80 // left indent
        };
      }
    }
    // Fallback if scrolling is weird
    return { page: activePageNum, x: 50, y: 50 };
  };

  const addField = (type) => {
    const activeSigner = signers[activeSignerIndex];
    if (activeSigner.fields?.some(f => f.type === type)) {
      alert(`This signer already has a ${type} placeholder.`);
      return;
    }

    // Get the coordinates
    const spawnCoords = getSmartSpawnPosition();

    const newField = {
      id: `f-${Date.now()}`,
      type,
      // ACTUALLY USE THE COORDINATES HERE!
      x: spawnCoords.x, 
      y: spawnCoords.y, 
      width: type === 'signature' ? 160 : 140,
      height: 45,
      page: spawnCoords.page, 
      required: true
    };

    setSigners(prev => prev.map((s, idx) =>
      idx === activeSignerIndex ? { ...s, fields: [...(s.fields || []), newField] } : s
    ));
  };

  const handleMove = (fieldId, newX, newY) => {
    setSigners(prev => prev.map(signer => ({
      ...signer,
      fields: signer.fields?.map(f => f.id === fieldId ? { ...f, x: newX, y: newY } : f)
    })));
  };

  const handleDelete = (fieldId) => {
    setSigners(prev => prev.map(signer => ({
      ...signer,
      fields: signer.fields?.filter(f => f.id !== fieldId)
    })));
  };

  return (
    <div className="flex h-screen w-screen bg-slate-100 overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-80 bg-white border-r border-slate-200 flex flex-col h-full shadow-xl z-50">
        <div className="p-6 border-b border-slate-100">
          <button onClick={onBack} className="text-xs font-bold text-slate-500 hover:text-slate-800 mb-4 flex items-center gap-1 uppercase tracking-widest transition-colors">
            <ArrowLeft size={14} /> Back
          </button>
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Placement</h3>
          <div className="mt-2 px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-md inline-block uppercase">
            Viewing Page: {activePageNum}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar bg-slate-50">
          {signers.map((s, idx) => (
            <div key={s.id} onClick={() => setActiveSignerIndex(idx)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${activeSignerIndex === idx ? 'bg-white shadow-md border-slate-800 scale-[1.02]' : 'bg-transparent border-transparent opacity-60 hover:opacity-100 hover:bg-white'}`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm" style={{ backgroundColor: SIGNER_COLORS[idx % SIGNER_COLORS.length] }}>
                  {s.name ? s.name[0].toUpperCase() : idx + 1}
                </div>
                <p className="text-xs font-bold text-slate-700 truncate">{s.name || 'Recipient'}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-slate-100 bg-white space-y-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => addField('signature')} className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-slate-100 hover:border-slate-800 hover:bg-slate-50 transition-all group">
              <PenTool size={20} className="text-slate-400 group-hover:text-slate-800 transition-colors" />
              <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-800 uppercase transition-colors">Signature</span>
            </button>
            <button onClick={() => addField('text')} className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-slate-100 hover:border-slate-800 hover:bg-slate-50 transition-all group">
              <Type size={20} className="text-slate-400 group-hover:text-slate-800 transition-colors" />
              <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-800 uppercase transition-colors">Text Box</span>
            </button>
          </div>
          <button onClick={onSave} disabled={isSubmitting} className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 transition-transform active:scale-[0.98]">
            Send Request
          </button>
        </div>
      </aside>

      {/* MAIN PDF ARENA */}
      <main ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto bg-slate-200 p-12 no-scrollbar scroll-smooth">
        <Document file={pdfFile} onLoadSuccess={({ numPages }) => setNumPages(numPages)} className="flex flex-col items-center gap-10">
          {Array.from(new Array(numPages), (el, index) => (
            <div key={index} className="pdf-page-wrapper relative shadow-lg bg-white overflow-hidden ring-1 ring-black/5 w-fit mx-auto">
              <Page pageNumber={index + 1} renderTextLayer={false} renderAnnotationLayer={false} scale={1.2} />

              <div className="absolute inset-0 z-40 pointer-events-none">
                {signers.map((signer, sIdx) =>
                  signer.fields?.filter(f => f.page === index + 1).map(field => (
                    <DraggableField
                      key={field.id}
                      field={field}
                      color={SIGNER_COLORS[sIdx % SIGNER_COLORS.length]}
                      isActive={sIdx === activeSignerIndex}
                      onMove={handleMove}
                      onDelete={handleDelete}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </Document>
      </main>
    </div>
  );
};

export default PlacementArena;