import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle2, ShieldCheck, Check, ChevronDown, Download, Clock } from 'lucide-react';

const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '.';

const TrackPage = () => {
  const { workflowId } = useParams();
  const [workflow, setWorkflow] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const fetchWorkflowData = async () => {
      try {
        const metaRes = await axios.get(`http://localhost:5000/api/esign/workflow/${workflowId}`);
        setWorkflow(metaRes.data);
        setStatus('idle');
      } catch (err) { setStatus('error'); }
    };
    if (workflowId) {
      fetchWorkflowData();
      const interval = setInterval(fetchWorkflowData, 10000); 
      return () => clearInterval(interval);
    }
  }, [workflowId]);

  const groupedSteps = useMemo(() => {
    if (!workflow?.signers) return [];
    return Object.entries(
      workflow.signers.reduce((acc, s) => {
        if (!acc[s.seq]) acc[s.seq] = [];
        acc[s.seq].push(s);
        return acc;
      }, {})
    ).sort(([a], [b]) => Number(a) - Number(b));
  }, [workflow]);

  // 🔥 ROCK-SOLID DOWNLOAD LOGIC
  const handleDownload = async () => {
    try {
      setStatus('downloading');
      const response = await axios.get(`http://localhost:5000/api/render-document/${workflowId}`, { 
        responseType: 'blob' 
      });
      
      // Explicitly declare the Blob type
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${workflow.title.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link); // Required for Firefox
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setStatus('idle');
    } catch (error) {
      console.error("Download Error:", error);
      alert("Failed to download document.");
      setStatus('idle');
    }
  };

  if (!workflow) return <div className="h-screen flex items-center justify-center bg-slate-50 font-sans text-slate-500">Loading tracking data...</div>;

  const isFullyCompleted = workflow.signers.every(s => s.status === 'completed');

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8 font-sans">
      <div className="bg-white max-w-4xl w-full rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        
        {/* LEFT: STATUS OVERVIEW */}
        <div className="flex-1 p-12 flex flex-col justify-center border-r border-slate-100">
          <div className="w-16 h-16 bg-slate-100 text-slate-800 rounded-2xl flex items-center justify-center mb-6">
            {isFullyCompleted ? <ShieldCheck size={32} /> : <Clock size={32} />}
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">{workflow.title}</h1>
          <p className="text-slate-500 text-sm mt-3 font-medium">Tracking ID: <span className="font-mono bg-slate-100 px-2 py-1 rounded text-xs">{workflowId}</span></p>
          
          <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-200">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Current Status</h3>
            {isFullyCompleted ? (
              <span className="inline-flex items-center gap-2 text-slate-800 font-bold bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
                <CheckCircle2 size={16} /> Fully Executed
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 text-slate-600 font-bold bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
                <Clock size={16} /> Awaiting Signatures
              </span>
            )}
          </div>

          <button 
            onClick={handleDownload}
            disabled={status === 'downloading'}
            className="mt-8 w-full py-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-2xl flex justify-center items-center gap-3 transition-all active:scale-[0.98] shadow-lg disabled:opacity-70"
          >
            {status === 'downloading' ? 'Generating PDF...' : <><Download size={18} /> Download Document</>}
          </button>
        </div>

        {/* RIGHT: THE PROGRESS TREE (UNIFIED) */}
        <div className="w-full md:w-[350px] bg-slate-50 p-10 overflow-y-auto max-h-[600px] no-scrollbar">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 text-center">Live Routing Order</h3>
          
          <div className="relative flex flex-col items-center">
            {/* The structural vertical line */}
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
                          
                          {/* The Signer Node */}
                          <div className={`w-11 h-11 bg-white rounded-full flex items-center justify-center text-[11px] font-bold border-2 transition-all shadow-sm relative z-20
                            ${isDone ? 'border-slate-800 text-slate-800' : 'border-slate-300 text-slate-400'}`}>
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
      </div>
    </div>
  );
};

export default TrackPage;