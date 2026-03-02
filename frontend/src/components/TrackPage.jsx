import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { CheckCircle2, ShieldCheck, Check, ChevronDown, Download, Clock, ArrowLeft, FileText, Plus, FileSignature } from 'lucide-react'; // Added Plus and FileSignature

const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '.';

const TrackPage = () => {
  const { workflowId } = useParams();
  const navigate = useNavigate();
  const [myWorkflows, setMyWorkflows] = useState([]);
  const [selectedFlowId, setSelectedFlowId] = useState(workflowId || null);
  const [workflow, setWorkflow] = useState(null);
  const [status, setStatus] = useState('loading');

  // Fetch ALL workflows for the sidebar
  useEffect(() => {
    const fetchMyWorkflows = async () => {
      try {
        const res = await api.get('/esign/my-workflows');
        setMyWorkflows(res.data);
        
        // Auto-select the first workflow if they have one and didn't specify an ID
        if (!selectedFlowId && res.data.length > 0) {
          setSelectedFlowId(res.data[0]._id);
        }
      } catch (err) { console.error(err); }
    };
    fetchMyWorkflows();
  }, []);

  // Fetch DETAILS for the selected workflow
  useEffect(() => {
    if (!selectedFlowId) return;
    const fetchWorkflowData = async () => {
      try {
        setStatus('loading');
        const metaRes = await api.get(`/esign/workflow/${selectedFlowId}`);
        setWorkflow(metaRes.data);
        setStatus('idle');
      } catch (err) { setStatus('error'); }
    };
    fetchWorkflowData();
    const interval = setInterval(fetchWorkflowData, 10000); 
    return () => clearInterval(interval);
  }, [selectedFlowId]);

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

  const handleDownload = async () => {
    try {
      setStatus('downloading');
      const response = await api.get(`/esign/render-document/${selectedFlowId}`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${workflow.title.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      setStatus('idle');
    } catch (error) {
      alert("Failed to download document.");
      setStatus('idle');
    }
  };

  const isFullyCompleted = workflow?.signers.every(s => s.status === 'completed');

  return (
    <div className="h-screen bg-slate-50 flex font-sans overflow-hidden">
      
      {/* SIDEBAR: List of all Workflows */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col h-full shadow-lg z-20">
        <div className="p-6 border-b border-slate-100">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 uppercase tracking-widest mb-6 transition-colors">
            <ArrowLeft size={14} /> Dashboard
          </button>
          
          {/* NEW: The primary "Request Signatures" CTA */}
          <button 
            onClick={() => navigate('/esign')} 
            className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 mb-2"
          >
            <Plus size={18} strokeWidth={3} /> Request Signatures
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {myWorkflows.length === 0 ? (
            <div className="text-center mt-10 px-4">
              <p className="text-sm text-slate-400 font-medium">No active workflows.</p>
            </div>
          ) : (
            myWorkflows.map(flow => (
              <div 
                key={flow._id} 
                onClick={() => { setSelectedFlowId(flow._id); window.history.pushState(null, '', `/track/${flow._id}`); }}
                className={`p-4 rounded-xl cursor-pointer border-2 transition-all ${selectedFlowId === flow._id ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-white border-slate-100 hover:border-slate-300 text-slate-700'}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <FileText size={16} className={selectedFlowId === flow._id ? 'text-indigo-400' : 'text-slate-400'} />
                  <p className="font-bold text-sm truncate">{flow.title}</p>
                </div>
                <p className={`text-[10px] uppercase font-bold tracking-wider ${selectedFlowId === flow._id ? 'text-slate-400' : 'text-slate-400'}`}>
                  {new Date(flow.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MAIN CONTENT: Tracking Details */}
      <div className="flex-1 flex flex-col md:flex-row overflow-y-auto bg-slate-50/50">
        {!workflow ? (
          /* NEW: Beautiful Empty State if nothing is selected or no workflows exist */
          <div className="w-full flex flex-col items-center justify-center text-slate-400 p-8 m-4 rounded-3xl border border-slate-200/60 bg-white/50 border-dashed">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <FileSignature size={40} className="text-slate-300" />
            </div>
            <h2 className="text-2xl font-black text-slate-700 mb-2">No Document Selected</h2>
            {myWorkflows.length === 0 ? (
              <p className="text-sm font-medium text-slate-500 max-w-sm text-center">You haven't initiated any signature requests yet. Click the <strong className="text-indigo-500">Request Signatures</strong> button to upload your first document.</p>
            ) : (
              <p className="text-sm font-medium text-slate-500 max-w-sm text-center">Select a document from the sidebar to track its routing progress and download the finalized file.</p>
            )}
          </div>
        ) : (
          <>
            {/* LEFT: STATUS OVERVIEW */}
            <div className="flex-1 p-12 flex flex-col justify-center border-r border-slate-100 bg-white shadow-[20px_0_40px_-20px_rgba(0,0,0,0.02)] z-10">
              <div className="w-16 h-16 bg-slate-50 shadow-sm border border-slate-100 text-slate-800 rounded-2xl flex items-center justify-center mb-6">
                {isFullyCompleted ? <ShieldCheck size={32} className="text-emerald-500" /> : <Clock size={32} className="text-amber-500" />}
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">{workflow.title}</h1>
              <p className="text-slate-500 text-sm mt-3 font-medium flex items-center gap-2">
                Tracking ID: <span className="font-mono bg-slate-100 border border-slate-200 px-2 py-1 rounded text-xs">{workflow._id}</span>
              </p>
              
              <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Current Status</h3>
                {isFullyCompleted ? (
                  <span className="inline-flex items-center gap-2 text-emerald-700 font-bold bg-emerald-100/50 border border-emerald-200 px-3 py-1.5 rounded-lg text-sm">
                    <CheckCircle2 size={16} /> Fully Executed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 text-amber-700 font-bold bg-amber-100/50 border border-amber-200 px-3 py-1.5 rounded-lg text-sm">
                    <Clock size={16} /> Awaiting Signatures
                  </span>
                )}
              </div>

              <button 
                onClick={handleDownload} 
                disabled={status === 'downloading'} 
                className="mt-8 w-full py-4 bg-slate-900 hover:bg-black text-white font-bold rounded-xl flex justify-center items-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-slate-900/20 disabled:opacity-70 disabled:active:scale-100"
              >
                {status === 'downloading' ? 'Generating Secure PDF...' : <><Download size={18} /> Download Document</>}
              </button>
            </div>

            {/* RIGHT: THE PROGRESS TREE */}
            <div className="w-full md:w-[400px] bg-slate-50 p-10 overflow-y-auto no-scrollbar">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 text-center bg-white py-2 rounded-lg shadow-sm border border-slate-100">Live Routing Order</h3>
              <div className="relative flex flex-col items-center mt-4">
                <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[2px] bg-slate-200 z-0"></div>
                {groupedSteps.map(([seq, group], idx) => (
                  <React.Fragment key={seq}>
                    <div className="w-full relative py-3 flex justify-center z-10">
                      <div className="flex gap-4">
                        {group.map((signer) => {
                          const isDone = signer.status === 'completed';
                          return (
                            <div key={signer._id} className="relative group cursor-default z-10 hover:z-[100]">
                              <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 px-3 py-2 bg-slate-800 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col items-center shadow-xl w-max z-[100]">
                                <span className="text-[11px] font-bold">{signer.name}</span>
                                <span className="text-[9px] text-slate-300">{signer.email}</span>
                                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-slate-800"></div>
                              </div>
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-[12px] font-bold border-2 transition-all shadow-sm relative z-20 ${isDone ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-white border-slate-300 text-slate-500'}`}>
                                {isDone ? <Check size={20} strokeWidth={3} /> : getInitials(signer.name)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {idx !== groupedSteps.length - 1 && (
                      <div className="w-full flex justify-center py-2 relative z-0">
                        <div className="bg-slate-100 p-1 rounded-full border border-slate-200 text-slate-400"><ChevronDown size={14} strokeWidth={3} /></div>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TrackPage;