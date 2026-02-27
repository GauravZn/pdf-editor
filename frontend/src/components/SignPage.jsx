import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import axios from 'axios';
import { CheckCircle2, ShieldCheck, Upload, Check, ChevronDown, PenTool, Type, Download } from 'lucide-react';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '.';
const API_BASE = 'http://localhost:5000/api';

const formatText = (text) => text ? String(text).trim().replace(/\s+/g, ' ').replace(/\s+([.,!?])/g, '$1') : '';

const calculatePreviewFontSize = (text, isSig) => {
  if (!text) return isSig ? '26px' : '12px';
  const charCount = formatText(text).length;
  if (isSig) {
    return charCount > 10 ? `${Math.max(14, 26 - (charCount - 10) * 1.5)}px` : '26px';
  }
  return charCount > 15 ? '10px' : '12px';
};

// 🔥 PRO MOVE: Canvas now dynamically matches the EXACT aspect ratio of the drop-zone
const generateFinalSignatureImage = async (config, tabMode, field) => {
  await document.fonts.ready;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // High-res multiplier for crisp PDF printing
  const scale = 4;
  const fieldWidth = field.width || 140;
  const fieldHeight = field.height || 40;

  // Canvas size matches the box perfectly
  canvas.width = fieldWidth * scale;
  canvas.height = fieldHeight * scale;

  let fontFamily = 'Pacifico';
  if (config.font === 'font-cursive-1') fontFamily = 'Dancing Script';
  if (config.font === 'font-cursive-3') fontFamily = 'Yellowtail';

  const dateStamp = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  }).toLowerCase();

  ctx.fillStyle = config.color || '#1e293b';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (tabMode === 'type') {
    const text = formatText(config.text);
    // Dynamic font sizing: Name takes up ~55% of the box height
    let fontSize = fieldHeight * scale * 0.55; 
    ctx.font = `${fontSize}px "${fontFamily}"`;
    
    // Scale font down if the name is super long, so it never clips the edges
    while (ctx.measureText(text).width > canvas.width - (10 * scale) && fontSize > 10) {
        fontSize -= 2;
        ctx.font = `${fontSize}px "${fontFamily}"`;
    }
    // Center it vertically in the top half
    ctx.fillText(text, canvas.width / 2, canvas.height * 0.4);

  } else if (config.uploadedImg) {
    await new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
         const availableHeight = canvas.height * 0.65;
         const imgScale = Math.min((canvas.width - 20) / img.width, availableHeight / img.height);
         const w = img.width * imgScale;
         const h = img.height * imgScale;
         ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height * 0.4) - (h / 2), w, h);
         resolve();
      };
      img.onerror = reject;
      img.src = config.uploadedImg;
    });
  }

  // Draw the Date dynamically sized (~25% of the box height) at the bottom
  ctx.font = `${fieldHeight * scale * 0.25}px "${fontFamily}"`;
  ctx.fillText(dateStamp, canvas.width / 2, canvas.height * 0.85);

  return canvas.toDataURL('image/png');
};

const SignPage = () => {
  const { workflowId, signerId } = useParams();

  const [workflowData, setWorkflowData] = useState({ workflow: null, pdfBlob: null, numPages: null });
  const [status, setStatus] = useState('loading');
  
  const [tab, setTab] = useState('type');
  const [signatureConfig, setSignatureConfig] = useState({
    text: "", color: "#1e293b", font: "font-cursive-2", uploadedImg: null
  });
  const [textValues, setTextValues] = useState({});

  const currentSigner = workflowData.workflow?.signers?.find(s => s._id === signerId);
  const groupedSteps = useMemo(() => {
    if (!workflowData.workflow?.signers) return [];
    const groups = workflowData.workflow.signers.reduce((acc, s) => {
      acc[s.seq] = acc[s.seq] || [];
      acc[s.seq].push(s);
      return acc;
    }, {});
    return Object.entries(groups).sort(([a], [b]) => Number(a) - Number(b));
  }, [workflowData.workflow]);

  useEffect(() => {
    if (!workflowId) return;
    const fetchWorkflowData = async () => {
      try {
        const [metaRes, pdfRes] = await Promise.all([
          axios.get(`${API_BASE}/esign/workflow/${workflowId}`),
          axios.get(`${API_BASE}/esign/view-pdf/${workflowId}`, { responseType: 'blob' })
        ]);
        setWorkflowData(prev => ({ ...prev, workflow: metaRes.data, pdfBlob: URL.createObjectURL(pdfRes.data) }));
        setStatus('idle');
      } catch (error) {
        setStatus('error');
      }
    };
    fetchWorkflowData();
  }, [workflowId]);

  const handleTextChange = (fieldId, val) => setTextValues(prev => ({ ...prev, [fieldId]: val }));

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setSignatureConfig(prev => ({ ...prev, uploadedImg: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleDownload = async () => {
    try {
      setStatus('loading');
      const response = await axios.get(`${API_BASE}/esign/render-document/${workflowId}`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Document_${workflowId.slice(-6)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setStatus('idle');
    } catch (error) {
      alert("Failed to download document.");
      setStatus('idle');
    }
  };

  const handleSignSubmit = async () => {
    const hasSigField = currentSigner?.fields?.some(f => ['signature', 'type', 'upload'].includes(f.type));
    if (hasSigField) {
      if (tab === 'type' && !signatureConfig.text.trim()) return alert("Please type your signature name.");
      if (tab === 'upload' && !signatureConfig.uploadedImg) return alert("Please upload your signature image.");
    }

    setStatus('loading');

    // 🔥 FIX: Generate a custom image mapped perfectly to EACH field's dimensions using Promise.all
    const fieldsData = await Promise.all(currentSigner.fields.map(async f => {
      if (['signature', 'type', 'upload'].includes(f.type)) {
        const finalSignaturePayload = await generateFinalSignatureImage(signatureConfig, tab, f);
        return { 
          fieldId: f.id, 
          value: finalSignaturePayload, 
          type: tab, 
          color: signatureConfig.color, 
          font: signatureConfig.font 
        };
      }
      return { fieldId: f.id, value: formatText(textValues[f.id]), type: 'text', color: '#1e293b', font: 'font-sans' };
    }));

    try {
      await axios.post(`${API_BASE}/esign/sign-step`, { workflowId, signerId, fieldsData });
      const metaRes = await axios.get(`${API_BASE}/esign/workflow/${workflowId}`);
      setWorkflowData(prev => ({ ...prev, workflow: metaRes.data }));
      setStatus('success');
    } catch (error) { 
      setStatus('error'); 
    }
  };

  const renderFieldBox = (field, isMe, isCompleted) => {
    const isSigField = ['signature', 'type', 'upload'].includes(field.type);
    let boxClasses = "absolute flex flex-col items-center justify-center overflow-visible pointer-events-none ";
    let content = null;

    const previewDateStamp = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    }).toLowerCase();

    if (isCompleted || (isMe && status === 'success')) {
      boxClasses += "bg-transparent";
      if (String(field.value).startsWith('data:image')) {
        content = (
          <div className="flex flex-col items-center justify-center w-full h-full">
            <img src={field.value} className="max-h-full max-w-full object-contain mix-blend-multiply" alt="Signature" />
          </div>
        );
      } else {
        const displayText = formatText(field.value);
        const previewSize = calculatePreviewFontSize(displayText, isSigField);
        content = (
          <div className="flex flex-col items-center justify-center w-full h-full">
            <span className={`${field.font || 'font-sans'} px-2 text-center w-full whitespace-nowrap`} style={{ color: field.color || '#1e293b', fontSize: previewSize, lineHeight: 1 }}>{displayText}</span>
          </div>
        );
      }
    } else if (isMe && !isCompleted) {
      boxClasses += "bg-slate-200/50 border-2 border-slate-800 shadow-sm";
      if (isSigField) {
        if (tab === 'type') {
          const displayText = formatText(signatureConfig.text);
          const previewSize = calculatePreviewFontSize(displayText, true);
          content = displayText 
            ? (
              <div className="flex flex-col items-center justify-center w-full h-full">
                <span className={`${signatureConfig.font} px-2 text-center w-full whitespace-nowrap`} style={{ color: signatureConfig.color, fontSize: previewSize, lineHeight: 1 }}>{displayText}</span>
                <span className={`${signatureConfig.font} text-center whitespace-nowrap mt-1`} style={{ color: signatureConfig.color, fontSize: '10px', lineHeight: 1 }}>{previewDateStamp}</span>
              </div>
            )
            : <span className="font-sans font-bold text-slate-800 text-[10px] uppercase tracking-widest text-center w-full">Sign Here</span>;
        } else {
          content = signatureConfig.uploadedImg 
            ? (
              <div className="flex flex-col items-center justify-center w-full h-full">
                <img src={signatureConfig.uploadedImg} className="max-h-full max-w-full object-contain mix-blend-multiply" alt="preview" /> 
                <span className={`${signatureConfig.font} text-center whitespace-nowrap mt-1`} style={{ color: signatureConfig.color, fontSize: '10px', lineHeight: 1 }}>{previewDateStamp}</span>
              </div>
            )
            : <span className="font-sans font-bold text-slate-800 text-[10px] uppercase tracking-widest text-center w-full">Image Here</span>;
        }
      } else {
        const displayText = formatText(textValues[field.id]);
        const previewSize = calculatePreviewFontSize(displayText, false);
        content = displayText 
          ? <span className="font-sans font-medium text-black px-2 text-center w-full whitespace-nowrap" style={{ fontSize: previewSize, lineHeight: 1 }}>{displayText}</span> 
          : <span className="font-sans font-bold text-slate-800 text-[10px] uppercase tracking-widest text-center w-full">Text Here</span>;
      }
    } else if (!isMe && !isCompleted) {
      boxClasses += "bg-slate-50/80 border-2 border-dashed border-slate-300";
      content = (
        <div className="flex flex-col items-center justify-center w-full h-full text-center">
          <p className="font-sans font-bold text-slate-400 text-[8px] uppercase tracking-widest leading-tight px-1 truncate w-full">{field.signerName}</p>
          <p className="font-sans font-medium text-slate-400 text-[6px] uppercase leading-tight mt-0.5 w-full">({isSigField ? 'Signature' : 'Text Box'})</p>
        </div>
      );
    }

    return (
      <div key={field.id} className={boxClasses} style={{ left: field.x, top: field.y, width: field.width, height: field.height }}>
        {content}
      </div>
    );
  };

  return (
    <div className="flex h-screen w-screen bg-slate-900 overflow-hidden font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Pacifico&family=Yellowtail&display=swap');
        .font-cursive-1 { font-family: 'Dancing Script', cursive; font-weight: 400; font-kerning: none; }
        .font-cursive-2 { font-family: 'Pacifico', cursive; font-weight: 400; font-kerning: none; }
        .font-cursive-3 { font-family: 'Yellowtail', cursive; font-weight: 400; font-kerning: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      {/* LEFT: VIEWER */}
      <div className="flex-1 h-full overflow-y-auto p-12 no-scrollbar bg-slate-800 scroll-smooth">
        <Document 
          file={workflowData.pdfBlob} 
          onLoadSuccess={({ numPages }) => setWorkflowData(prev => ({ ...prev, numPages }))} 
          className="flex flex-col items-center gap-4"
        >
          {Array.from(new Array(workflowData.numPages), (el, index) => (
            <div key={index} className="relative shadow-2xl border-blue-800 bg-green-200 overflow-hidden ring-1 ring-black/5 w-fit mx-auto">
              <Page pageNumber={index + 1} renderTextLayer={false} renderAnnotationLayer={false} scale={1.2} />
              
              <div className="absolute inset-0 z-40 pointer-events-none">
                {workflowData.workflow?.signers?.map(signer => {
                  const isMe = signer._id === currentSigner?._id;
                  const isCompleted = signer.status === 'completed';

                  return signer.fields
                    ?.filter(f => f.page === index + 1)
                    .map(field => renderFieldBox({ ...field, signerName: signer.name }, isMe, isCompleted));
                })}
              </div>
            </div>
          ))}
        </Document>
      </div>

      {/* RIGHT: SIDEBAR */}
      <aside className="w-[450px] bg-white border-l border-slate-200 flex flex-col shadow-2xl z-50 relative">
        <header className="p-8 border-b border-slate-100 bg-white relative">
          <div className="w-12 h-12 bg-slate-100 text-slate-800 rounded-2xl flex items-center justify-center mb-5 shadow-sm">
            <ShieldCheck size={28} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">Action Required</h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase mt-2 tracking-widest">Doc ID: {workflowId.slice(-8)}</p>

          <button onClick={handleDownload} title="Download Document" className="absolute top-8 right-8 p-3 bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-800 rounded-xl transition-all active:scale-95">
            <Download size={20} strokeWidth={2.5} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-50">
          <div className="p-8 border-b border-slate-200 bg-white">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 text-center">Workflow Progress</h3>
            <div className="relative flex flex-col items-center">
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[2px] bg-slate-200 z-0"></div>
              {groupedSteps.map(([seq, group], idx) => (
                <React.Fragment key={seq}>
                  <div className="w-full relative py-2 flex justify-center z-10">
                    <div className="flex gap-4">
                      {group.map((signer) => {
                        const isDone = signer.status === 'completed';
                        return (
                          <div key={signer._id} className="relative group cursor-default z-10 hover:z-[100]">
                            <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 px-3 py-2 bg-slate-800 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none flex flex-col items-center shadow-xl w-max z-[100]">
                              <span className="text-[11px] font-bold">{signer.name}</span>
                              <span className="text-[9px] text-slate-300">{isDone ? 'Signed' : 'Pending'}</span>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-slate-800"></div>
                            </div>
                            <div className={`w-11 h-11 bg-white rounded-full flex items-center justify-center text-[11px] font-bold border-2 transition-all shadow-sm relative z-20 ${isDone ? 'border-slate-800 text-slate-800' : 'border-slate-300 text-slate-400'}`}>
                              {isDone ? <Check size={18} strokeWidth={3} /> : getInitials(signer.name)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {idx !== groupedSteps.length - 1 && (
                    <div className="w-full flex justify-center py-2 relative z-0 pointer-events-none">
                      <div className="bg-white p-1 rounded-full border-2 border-slate-100 text-slate-300">
                        <ChevronDown size={14} strokeWidth={3} />
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {currentSigner?.status !== 'completed' && status !== 'success' && (
            <div className="p-8 space-y-8 animate-in fade-in duration-500">
              {currentSigner?.fields?.filter(f => f.type === 'text').map((field, idx) => (
                <div key={field.id} className="space-y-3">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <Type size={14} className="text-slate-500" /> Text Field {idx + 1}
                  </label>
                  <input 
                    className="w-full p-4 border-2 border-slate-200 rounded-xl text-sm outline-none focus:border-slate-800 transition-all bg-white shadow-sm font-medium" 
                    placeholder="Enter required text..." 
                    value={textValues[field.id] || ''} 
                    onChange={(e) => handleTextChange(field.id, e.target.value)} 
                  />
                </div>
              ))}

              {currentSigner?.fields?.some(f => ['signature', 'type', 'upload'].includes(f.type)) && (
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <PenTool size={14} className="text-slate-500" /> Signature
                  </label>
                  <div className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="flex border-b border-slate-100">
                      <button onClick={() => setTab('type')} className={`flex-1 py-4 font-black text-[10px] tracking-widest transition-colors ${tab === 'type' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:bg-slate-50'}`}>TYPE</button>
                      <button onClick={() => setTab('upload')} className={`flex-1 py-4 font-black text-[10px] tracking-widest transition-colors ${tab === 'upload' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:bg-slate-50'}`}>UPLOAD</button>
                    </div>
                    <div className="p-5 space-y-5">
                      {tab === 'type' ? (
                        <>
                          <input 
                            className="w-full p-4 border-2 border-slate-100 rounded-xl text-xl text-center outline-none focus:border-slate-800 transition-all font-medium bg-slate-50" 
                            placeholder="Your full name" 
                            value={signatureConfig.text} 
                            onChange={(e) => setSignatureConfig(prev => ({ ...prev, text: e.target.value }))} 
                          />
                          <div className="grid grid-cols-3 gap-2">
                            {['font-cursive-1', 'font-cursive-2', 'font-cursive-3'].map((f, i) => (
                              <button key={f} onClick={() => setSignatureConfig(prev => ({ ...prev, font: f }))} className={`p-3 border-2 rounded-xl text-lg transition-all ${f} ${signatureConfig.font === f ? 'bg-slate-800 border-slate-800 text-white shadow-md' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'}`}>Style {i + 1}</button>
                            ))}
                          </div>
                          <div className="flex gap-4 justify-center items-center pt-2">
                            {['#1e293b', '#000080', '#2563eb'].map(c => (
                              <div key={c} onClick={() => setSignatureConfig(prev => ({ ...prev, color: c }))} className={`w-8 h-8 rounded-full cursor-pointer border-4 transition-transform ${signatureConfig.color === c ? 'border-slate-300 scale-110 shadow-sm' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center relative hover:bg-slate-50 transition-all bg-white">
                          {signatureConfig.uploadedImg ? (
                            <img src={signatureConfig.uploadedImg} className="max-h-24 object-contain" alt="Uploaded signature" />
                          ) : (
                            <>
                              <Upload size={24} className="text-slate-300 mb-2" />
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Image</p>
                            </>
                          )}
                          <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-8 bg-white border-t border-slate-200 z-10 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
          {(currentSigner?.status === 'completed' || status === 'success') ? (
            <div className="text-center py-4 bg-green-50 rounded-2xl border border-green-100 animate-in zoom-in">
              <CheckCircle2 size={32} className="text-green-500 mx-auto mb-2" />
              <h2 className="text-sm font-black text-green-900 uppercase tracking-widest">Complete</h2>
              <p className="text-[10px] text-green-600 font-bold uppercase mt-1">Your signature is saved</p>
            </div>
          ) : (
            <button onClick={handleSignSubmit} disabled={status === 'loading'} className="w-full bg-slate-800 text-white py-5 rounded-[1.2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-slate-900 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:bg-slate-400 disabled:shadow-none">
              {status === 'loading' ? 'Processing...' : <><Check size={20} strokeWidth={3} /> Adopt & Sign</>}
            </button>
          )}
        </div>
      </aside>
    </div>
  );
};

export default SignPage;