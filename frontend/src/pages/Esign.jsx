import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, GripVertical, ChevronDown, UploadCloud, FileText, Command, ArrowRight } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import PlacementArena from '../components/PlacementArena.jsx';
import { CSS } from '@dnd-kit/utilities';
import { pdfjs } from 'react-pdf';
import axios from "axios";

// Styles for PDF rendering
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// sortable card (White Card on Grey Background) ---

const SortableSignerCard = ({ s, hoveredId, setHoveredId, updateSigner, removeSigner, indexRef, isNew }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: s.id });
  const nameInputRef = useRef(null);

  useEffect(() => {
    if (isNew && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isNew]);

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: transition || 'transform 200ms ease',
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onMouseEnter={() => setHoveredId(s.id)}
      onMouseLeave={() => setHoveredId(null)}
      className={`group relative flex items-start gap-3 p-4 rounded-xl border transition-all duration-200 
        ${isDragging ? 'bg-white shadow-2xl border-slate-800 scale-[1.02] cursor-grabbing z-50' : 'bg-white border-slate-200 hover:border-slate-300'}
        ${hoveredId === s.id && !isDragging ? 'shadow-md border-slate-300' : 'shadow-sm'}`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        tabIndex={-1}
        className="mt-2 cursor-grab active:cursor-grabbing p-1.5 rounded-md hover:bg-slate-100 text-slate-300 hover:text-slate-600 transition-colors touch-none outline-none"
      >
        <GripVertical size={16} />
      </div>

      {/* Step Number */}
      <div className="flex flex-col items-center">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Step</span>
        <div className="flex items-center justify-center w-10 h-10 bg-slate-50 border border-slate-200 rounded-lg focus-within:border-slate-800 focus-within:bg-white transition-all">
          <input
            ref={indexRef}
            type="number"
            value={s.seq === 0 ? '' : s.seq}
            onChange={(e) => updateSigner(s.id, 'seq', e.target.value === '' ? 0 : parseInt(e.target.value))}
            className="w-full text-center bg-transparent font-bold text-slate-700 outline-none no-spinner text-sm"
          />
        </div>
      </div>

      {/* Data Inputs */}
      <div className="flex-1 grid grid-cols-1 gap-3">
        <div>
          <input
            ref={nameInputRef}
            className="w-full px-0 py-1 bg-transparent border-b border-slate-100 text-sm font-bold text-slate-800 placeholder-slate-300 outline-none focus:border-slate-800 transition-colors"
            placeholder="Recipient Name"
            value={s.name}
            onChange={(e) => updateSigner(s.id, 'name', e.target.value)}
          />
        </div>
        <div>
          <input
            className="w-full px-0 py-0.5 bg-transparent text-xs font-medium text-slate-500 placeholder-slate-300 outline-none focus:text-slate-800 transition-colors"
            placeholder="recipient@email.com"
            value={s.email}
            onChange={(e) => updateSigner(s.id, 'email', e.target.value)}
          />
        </div>
      </div>

      {/* Delete Action */}
      <button
        onClick={() => removeSigner(s.id)}
        tabIndex={-1}
        className="mt-1 opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all focus:opacity-100"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};

// MAIN WORKFLOW PAGE
const Esign = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [view, setView] = useState('config');
  const [newestSignerId, setNewestSignerId] = useState(null);
  const [signers, setSigners] = useState([{ id: '1', name: '', email: '', seq: 1 }]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [activeSignerIndex, setActiveSignerIndex] = useState(0);
  const [hoveredId, setHoveredId] = useState(null);
  const indexRefs = useRef({});

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 3 } }));

  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '.';

  const groupedSteps = useMemo(() => {
    return Object.entries(
      signers.reduce((acc, s) => {
        if (!acc[s.seq]) acc[s.seq] = [];
        acc[s.seq].push(s);
        return acc;
      }, {})
    ).sort(([a], [b]) => Number(a) - Number(b));
  }, [signers]);

  const handleNodeClick = (id) => {
    const targetInput = indexRefs.current[id];
    if (targetInput) {
      targetInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      targetInput.focus();
      targetInput.select();
      setHoveredId(id);
    }
  };

  const updateSigner = (id, field, value) => {
    setSigners(prev => {
      let updated = prev.map(s => s.id === id ? { ...s, [field]: value } : s);
      if (field === 'seq') {
        updated = updated.sort((a, b) => a.seq - b.seq);
      }
      return updated;
    });
  };

  const addSigner = () => {
    const newId = Date.now().toString();
    const newSeq = signers.length > 0 ? signers[signers.length - 1].seq + 1 : 1;
    setNewestSignerId(newId);
    setSigners([...signers, { id: newId, name: '', email: '', seq: newSeq }]);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setSigners((prev) => {
        const oldIndex = prev.findIndex((i) => i.id === active.id);
        const newIndex = prev.findIndex((i) => i.id === over.id);
        const reordered = arrayMove(prev, oldIndex, newIndex);

        const prevNeighbor = reordered[newIndex - 1];
        const nextNeighbor = reordered[newIndex + 1];

        if (prevNeighbor && nextNeighbor && prevNeighbor.seq === nextNeighbor.seq) {
          return reordered.map(item => item.id === active.id ? { ...item, seq: prevNeighbor.seq } : item);
        }

        let currentSeq = 1;
        const result = [];
        for (let i = 0; i < reordered.length; i++) {
          if (i > 0) {
            const prevItem = reordered[i - 1];
            const isDraggedItem = reordered[i].id === active.id;
            if (isDraggedItem || reordered[i].seq !== prevItem.seq) {
              currentSeq++;
            }
          }
          result.push({ ...reordered[i], seq: currentSeq });
        }
        return result;
      });
    }
  };

  const handleSave = async () => {
    if (!selectedFile) return alert("Please upload a PDF document first.");
    if (signers.length === 0) return alert("Please add at least one recipient.");

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', 'Signature Request');
    formData.append('signers', JSON.stringify(signers));

    setIsSubmitting(true);

    try {
      const response = await axios.post('http://localhost:5000/api/esign/save-flow', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      navigate(`/track/${response.data.id}`);
    } catch (error) {
      console.error("Error saving workflow:", error);
      alert(error.response?.data?.message || "Failed to save workflow.");
      setIsSubmitting(false);
    }
  };

  const proceedToPlacement = () => {
    if (!selectedFile || signers.length === 0) {
      alert("Upload a PDF and add at least one signer.");
      return;
    }
    setSigners(prev => prev.map(s => ({ ...s, fields: s.fields || [] })));
    setView('placement');
  };

  if (view === 'placement') {
    return (
      <PlacementArena
        signers={signers}
        setSigners={setSigners}
        activeSignerIndex={activeSignerIndex}
        setActiveSignerIndex={setActiveSignerIndex}
        pdfFile={selectedFile}
        onBack={() => setView('config')}
        onSave={handleSave}
        isSubmitting={isSubmitting}
      />
    );
  }

  return (
    <div className="flex h-screen w-screen bg-slate-100 text-slate-800 font-sans overflow-hidden">
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-spinner::-webkit-inner-spin-button, .no-spinner::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }`}</style>

      {/* LEFT PANEL: CONFIGURATION */}
      {/* Background set to slate-50 (light grey) instead of white */}
      <div className="w-[500px] h-full border-r border-slate-200 flex flex-col bg-slate-50 shadow-xl z-20">

        {/* 1. BRAND HEADER */}
        <header className="px-8 py-6 border-b border-slate-200/60 flex items-center gap-3 bg-slate-50">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-slate-300">
            <Command size={20} />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-lg tracking-tight leading-none">e-Sign</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Enterprise Edition</p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto space-y-8 p-8 no-scrollbar scroll-smooth">

          {/* 2. MODERN UPLOAD ZONE (White card on grey bg) */}
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 tracking-wide">Upload PDF to request signatures</label>
            <div className="relative group">
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all duration-300 shadow-sm
                        ${selectedFile ? 'border-indigo-500 bg-white' : 'border-slate-300 bg-white group-hover:border-slate-400 group-hover:bg-slate-50'}`}>
                {selectedFile ? (
                  <>
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-3"><FileText size={24} /></div>
                    <p className="text-sm font-bold text-indigo-900 truncate max-w-[250px]">{selectedFile.name}</p>
                    <p className="text-[10px] text-indigo-500 mt-1 font-medium">Ready to process</p>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-slate-50 border border-slate-200 text-slate-400 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><UploadCloud size={24} /></div>
                    <p className="text-sm font-bold text-slate-600">Click to upload PDF</p>
                    <p className="text-[10px] text-slate-400 mt-1">Or drag and drop file here</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 3. SIGNER LIST */}
          <div className="space-y-4">
            <div className="flex justify-between items-end border-b border-slate-200 pb-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Recipients & Order</label>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-200/50 px-2 py-1 rounded-md">{signers.length} Recipients</span>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={signers} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {signers.map((s) => (
                    <SortableSignerCard
                      key={s.id}
                      s={s}
                      isNew={s.id === newestSignerId}
                      hoveredId={hoveredId}
                      setHoveredId={setHoveredId}
                      updateSigner={updateSigner}
                      removeSigner={(id) => setSigners(signers.filter(sig => sig.id !== id))}
                      indexRef={(el) => (indexRefs.current[s.id] = el)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <button
              onClick={addSigner}
              className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:text-slate-800 hover:border-slate-800 hover:bg-white transition-all flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider bg-slate-50"
            >
              <Plus size={14} strokeWidth={3} /> Add Next Recipient
            </button>
          </div>
        </div>

        {/* 4. FOOTER ACTION */}
        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <button
            onClick={proceedToPlacement}
            disabled={!selectedFile || signers.length === 0}
            className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-slate-300 disabled:opacity-50 disabled:shadow-none"
          >
            Configure Fields <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* RIGHT PANEL: VISUALIZATION */}
      {/* Darker background: slate-100, Clean (No Dots) */}
      <div className="flex-1 h-full flex flex-col bg-slate-100 relative overflow-hidden">

        {/* Soft Gradient Overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-200/40 via-transparent to-transparent pointer-events-none"></div>

        <div className="flex-1 overflow-y-auto no-scrollbar relative flex flex-col items-center pt-24 px-10 z-10">
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[2px] bg-slate-300 z-0"></div>
          <div className="w-full z-10 max-w-md">
            {groupedSteps.map(([seq, group], idx) => (
              <React.Fragment key={seq}>
                <div className="w-full relative py-4 flex flex-col items-center">
                  <div className="flex justify-center items-center gap-6">
                    {group.map((signer) => (
                      <div key={signer.id}
                        onMouseEnter={() => setHoveredId(signer.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        onClick={() => handleNodeClick(signer.id)}
                        className="relative group cursor-pointer"
                      >
                        {/* Tooltip */}
                        <div className={`absolute -top-14 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-800 text-white rounded-lg transition-all duration-200 pointer-events-none z-50 flex flex-col items-center shadow-xl w-max ${hoveredId === signer.id ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                          <span className="text-[11px] font-bold whitespace-nowrap">{signer.name || 'Recipient'}</span>
                          <span className="text-[9px] text-slate-300 whitespace-nowrap">{signer.email || 'No email'}</span>
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                        </div>

                        {/* Node */}
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xs font-bold border-[3px] transition-all duration-300 shadow-md bg-white
                            ${hoveredId === signer.id ? 'border-slate-800 text-slate-800 scale-110 ring-4 ring-slate-800/10' : 'border-slate-300 text-slate-400 group-hover:border-slate-400'}`}>
                          {getInitials(signer.name)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {idx !== groupedSteps.length - 1 && (
                  <div className="w-full flex justify-center py-2 relative z-20">
                    <div className="bg-slate-100 p-1.5 rounded-full border-2 border-slate-300 text-slate-400 shadow-sm">
                      <ChevronDown size={14} strokeWidth={3} />
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Esign;