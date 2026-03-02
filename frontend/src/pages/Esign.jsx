import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { CheckCircle2, ShieldCheck, Check, ChevronDown, Download, Clock, ArrowLeft, FileText, Plus, FileSignature, LayoutDashboard, Send } from 'lucide-react';

const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '.';

const EsignHub = () => {
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
        // BUG FIX: Removed the auto-selection logic so it defaults to the Empty State
      } catch (err) { console.error(err); }
    };
    fetchMyWorkflows();
  }, []);

  // Fetch DETAILS for the selected workflow
  useEffect(() => {
    if (!selectedFlowId) {
      setWorkflow(null); // Ensure workflow is cleared if nothing is selected
      return;
    }
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
    <div className="h-screen bg-[#F8FAFC] flex font-sans overflow-hidden">

      {/* SIDEBAR: Premium List of Workflows */}
      <div className="w-[340px] bg-white border-r border-slate-200 flex flex-col h-full shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20">
        <div className="p-6 border-b border-slate-100 bg-white">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-indigo-600 uppercase tracking-widest mb-6 transition-colors">
            <LayoutDashboard size={14} /> Back to Dashboard
          </button>

          <button
            onClick={() => navigate('/request-signature')}
            className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-semibold py-3.5 px-4 rounded-xl shadow-[0_4px_12px_rgba(79,70,229,0.25)] transition-all flex items-center justify-center gap-2"
          >
            <Send size={16} strokeWidth={2.5} /> Request Signatures
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar py-4 px-3 space-y-1">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 mb-3">Active Documents</h3>
          {myWorkflows.length === 0 ? (
            <div className="text-center mt-10 px-4">
              <p className="text-sm text-slate-400 font-medium">No workflows found.</p>
            </div>
          ) : (
            myWorkflows.map(flow => {
              const isActive = selectedFlowId === flow._id;
              return (
                <div
                  key={flow._id}
                  onClick={() => { setSelectedFlowId(flow._id); navigate(`/esign/${flow._id}`, { replace: true }); }}
                  className={`relative p-4 rounded-xl cursor-pointer transition-all duration-200 group flex items-start gap-3 ${isActive
                      ? 'bg-indigo-50/80 shadow-sm ring-1 ring-indigo-100'
                      : 'bg-transparent hover:bg-slate-50'
                    }`}
                >
                  {/* Active Indicator Line */}
                  {isActive && <div className="absolute left-0 top-3 bottom-3 w-1 bg-indigo-600 rounded-r-full" />}

                  <div className={`mt-0.5 p-2 rounded-lg ${isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400 group-hover:text-slate-600'}`}>
                    <FileText size={16} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm truncate ${isActive ? 'text-indigo-950' : 'text-slate-700'}`}>
                      {flow.title}
                    </p>
                    <p className="text-[11px] font-medium text-slate-400 mt-1">
                      {new Date(flow.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MAIN CONTENT: The Hub / Tracking Details */}
      <div className="flex-1 flex flex-col overflow-y-auto relative">
        {!workflow ? (
          /* Premium Empty State */
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="max-w-md w-full bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-12 text-center animate-in fade-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-indigo-50/50">
                <FileSignature size={32} className="text-indigo-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-3 tracking-tight">E-Sign Command Center</h2>
              {myWorkflows.length === 0 ? (
                <p className="text-sm leading-relaxed text-slate-500 mb-8">
                  You haven't initiated any signature requests yet. Upload a document, assign signers, and track the progress securely.
                </p>
              ) : (
                <p className="text-sm leading-relaxed text-slate-500 mb-8">
                  Select a document from the sidebar to track its live routing progress, view signer status, and download the cryptographic final file.
                </p>
              )}
              <button
                onClick={() => navigate('/request-signature')}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 px-4 rounded-xl transition-all shadow-md active:scale-95 flex justify-center items-center gap-2"
              >
                <Plus size={18} /> Create New Request
              </button>
            </div>
          </div>
        ) : (
          /* Premium Tracking View */
          <div className="flex-1 flex flex-col md:flex-row h-full">

            {/* LEFT: STATUS OVERVIEW CARD */}
            <div className="flex-1 p-8 md:p-12 flex flex-col justify-center">
              <div className="max-w-xl mx-auto w-full">
                <div className="mb-8">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm border ${isFullyCompleted ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-white border-slate-200 text-amber-500'}`}>
                    {isFullyCompleted ? <ShieldCheck size={28} /> : <Clock size={28} />}
                  </div>
                  <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight mb-4">{workflow.title}</h1>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tracking ID:</span>
                    <span className="font-mono bg-white border border-slate-200 text-slate-500 px-2.5 py-1 rounded-md text-xs shadow-sm select-all">
                      {workflow._id}
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 mb-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Document Status</h3>
                      <p className="text-sm font-medium text-slate-500">Real-time cryptographic status</p>
                    </div>
                    {isFullyCompleted ? (
                      <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-100 font-bold text-sm">
                        <CheckCircle2 size={18} /> Executed
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-xl border border-amber-100 font-bold text-sm">
                        <Clock size={18} /> Pending
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleDownload}
                  disabled={status === 'downloading' || !isFullyCompleted}
                  className={`w-full py-4 font-bold rounded-xl flex justify-center items-center gap-3 transition-all shadow-md
                    ${isFullyCompleted
                      ? 'bg-slate-900 hover:bg-black text-white active:scale-[0.98]'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                    }
                  `}
                >
                  {status === 'downloading' ? 'Decrypting & Generating PDF...' : <><Download size={18} /> Download Sealed Document</>}
                </button>
                {!isFullyCompleted && (
                  <p className="text-center text-xs font-medium text-slate-400 mt-4">
                    Document can only be downloaded once all parties have signed.
                  </p>
                )}
              </div>
            </div>

            {/* RIGHT: THE PROGRESS TREE */}
            <div className="w-full md:w-[400px] bg-white border-l border-slate-200 p-8 overflow-y-auto no-scrollbar shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-8 text-center">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Live Routing Order</h3>
              </div>

              <div className="relative flex flex-col items-center mt-6">
                <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-slate-100 z-0"></div>
                {groupedSteps.map(([seq, group], idx) => (
                  <React.Fragment key={seq}>
                    <div className="w-full relative py-4 flex justify-center z-10">
                      <div className="flex gap-4">
                        {group.map((signer) => {
                          const isDone = signer.status === 'completed';
                          return (
                            <div key={signer._id} className="relative group cursor-default z-10 hover:z-[100]">
                              <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 px-4 py-2.5 bg-slate-800 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col items-center shadow-xl w-max z-[100] transform translate-y-2 group-hover:translate-y-0">
                                <span className="text-[12px] font-bold tracking-wide">{signer.name}</span>
                                <span className="text-[10px] text-slate-300 mt-0.5 font-medium">{signer.email}</span>
                                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-slate-800"></div>
                              </div>
                              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-[14px] font-bold border-4 transition-all shadow-sm relative z-20 bg-white
                                ${isDone ? 'border-emerald-400 text-emerald-600' : 'border-slate-100 text-slate-400'}
                              `}>
                                {isDone ? <Check size={24} strokeWidth={3} /> : getInitials(signer.name)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {idx !== groupedSteps.length - 1 && (
                      <div className="w-full flex justify-center py-1 relative z-0">
                        <div className="bg-white p-1 rounded-full border border-slate-200 text-slate-300 shadow-sm z-10">
                          <ChevronDown size={14} strokeWidth={3} />
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EsignHub;