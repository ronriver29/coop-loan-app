import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  FileText, 
  History, 
  Info, 
  Printer, 
  Send,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import { User, Loan } from '../types';

export default function LoanDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loan, setLoan] = useState<Loan | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusComment, setStatusComment] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/auth/me', { credentials: 'include' }).then(res => res.ok ? res.json() : null),
      fetch(`/api/loans/${id}`, { credentials: 'include' }).then(async res => {
        if (res.status === 403) throw new Error('Forbidden');
        return res.ok ? res.json() : null;
      })
    ]).then(([userData, loanData]) => {
      setUser(userData);
      setLoan(loanData);
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      if (err.message === 'Forbidden') {
        navigate('/dashboard');
      }
      setLoading(false);
    });
  }, [id, navigate]);

  const handleStatusUpdate = async (status: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/loans/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status, comment: statusComment }),
      });
      if (res.ok) {
        const updated = await res.json();
        setLoan(updated);
        setStatusComment('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading || !loan) return <div className="p-12 text-center text-slate-400">Loading loan details...</div>;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, scale: 0.98 },
    show: { opacity: 1, scale: 1 }
  };

  if (loading || !loan) {
    return (
      <div className="flex flex-col items-center justify-center p-20 min-h-[400px]">
        <div className="h-10 w-10 border-4 border-natural-sage/20 border-t-natural-sage rounded-full animate-spin mb-6" />
        <p className="text-slate-400 font-medium">Synchronizing document with central archive...</p>
      </div>
    );
  }

  const role = user?.role || '';
  const isSystemAdmin = role === 'System Administrator';

  const workflowConfig: Record<string, { roles: string[], options: string[] }> = {
    'Pending': { 
      roles: ['Evaluator', 'System Administrator'], 
      options: ['Under Evaluation', 'Rejected'] 
    },
    'Under Evaluation': { 
      roles: ['Reviewer', 'System Administrator'], 
      options: ['Reviewed', 'Rejected'] 
    },
    'Reviewed': { 
      roles: ['Approver', 'System Administrator'], 
      options: ['Approved', 'Rejected'] 
    },
    'Approved': { 
      roles: ['Disbursement', 'System Administrator'], 
      options: ['Disbursed'] 
    }
  };

  const currentStep = workflowConfig[loan.status] || { roles: [], options: [] };
  const canPerformAction = currentStep.roles.includes(role);
  const availableOptions = canPerformAction ? currentStep.options : [];

  const isStaff = ['System Administrator', 'Evaluator', 'Reviewer', 'Approver', 'Disbursement'].includes(role);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-12 pb-32"
    >
      <motion.button 
        variants={item}
        onClick={() => navigate(-1)}
        className="flex items-center gap-3 text-slate-400 hover:text-natural-sage transition-all text-micro group"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        Return to Archives
      </motion.button>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 lg:gap-12 items-start">
        <div className="space-y-8 lg:space-y-12">
          {/* Main Financial Certificate */}
          <motion.div variants={item} className="organic-card p-6 sm:p-8 lg:p-12 relative overflow-hidden">
             {/* Decorative watermark */}
            <div className="absolute -top-10 -right-10 opacity-[0.03] pointer-events-none hidden lg:block">
              <FileText size={400} />
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start gap-8 lg:gap-10 mb-12 lg:mb-16 relative z-10">
              <div>
                <div className="flex items-center gap-3 mb-4 lg:mb-6">
                  <span className="h-2 w-2 rounded-full bg-natural-sage animate-pulse" />
                  <span className="text-micro text-natural-sage">OFFICIAL DISBURSEMENT RECORD</span>
                </div>
                <p className="text-micro opacity-40 mb-2">Authenticated Instrument</p>
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black text-natural-ink tracking-tight">
                  <span className="text-2xl sm:text-3xl not-italic font-sans mr-1">₱</span>
                  {loan.principalAmount.toLocaleString()}
                </h2>
                <div className="mt-6 lg:mt-8 flex flex-wrap items-center gap-4 lg:gap-6">
                  <div>
                    <p className="text-micro opacity-40 mb-1">Product Class</p>
                    <p className="text-xs lg:text-sm font-bold uppercase tracking-widest text-natural-ink">{loan.loanType}</p>
                  </div>
                  <div className="h-8 w-px bg-natural-line hidden sm:block" />
                  <div>
                    <p className="text-micro opacity-40 mb-1">Serial Hash</p>
                    <p className="text-xs lg:text-sm font-mono text-natural-ink">#{id?.slice(-8).toUpperCase()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-natural-bg p-6 lg:p-8 rounded-2xl border border-natural-line text-center w-full md:min-w-[200px] md:w-auto">
                <p className="text-micro opacity-40 mb-3 lg:mb-4">Lifecycle Status</p>
                <span className={`block w-full py-2.5 rounded-xl text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] shadow-sm ${
                  loan.status === 'Disbursed' ? 'bg-natural-sage text-white' : 'bg-white text-natural-ink border border-natural-line'
                }`}>
                  {loan.status}
                </span>
                <p className="text-[9px] lg:text-[10px] text-slate-400 font-medium mt-3 lg:mt-4 uppercase tracking-widest">Verified {new Date(loan.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-12 pt-8 lg:pt-12 border-t border-natural-line relative z-10">
              <div>
                <p className="text-micro opacity-40 mb-1 lg:mb-2">Cost of Funds</p>
                <p className="text-lg lg:text-xl font-bold text-natural-ink">{(loan.interestRate * 100).toFixed(1)}% <span className="text-xs text-slate-400 font-medium uppercase tracking-[0.1em] font-sans">P.A.</span></p>
              </div>
              <div>
                <p className="text-micro opacity-40 mb-1 lg:mb-2">Duration</p>
                <p className="text-lg lg:text-xl font-bold text-natural-ink">{loan.termMonths} <span className="text-xs text-slate-400 font-medium uppercase tracking-[0.1em] font-sans">Months</span></p>
              </div>
              <div>
                <p className="text-micro opacity-40 mb-1 lg:mb-2">Obligor ID</p>
                <p className="text-lg lg:text-xl font-bold text-natural-ink">{loan.memberId}</p>
              </div>
              <div>
                <p className="text-micro opacity-40 mb-1 lg:mb-2">Account Name</p>
                <p className="text-lg lg:text-xl font-bold text-natural-ink truncate">{loan.name}</p>
              </div>
            </div>
          </motion.div>

          {/* Amortization Schedule */}
          {loan.status === 'Disbursed' && (
            <motion.div variants={item} className="organic-card overflow-hidden">
              <div className="px-10 py-8 border-b border-natural-line flex items-center justify-between bg-[#FCFCFA]">
                <h3 className="font-bold text-natural-ink flex items-center gap-3 text-sm uppercase tracking-[0.2em]">
                  <Calendar className="h-5 w-5 text-natural-sage" />
                  Repayment Matrix
                </h3>
                <button className="flex items-center gap-2 text-micro text-natural-sage hover:underline">
                  <Printer className="h-4 w-4" />
                  Export Ledger
                </button>
              </div>
              
              <div className="overflow-x-auto text-left">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FCFCFA] border-b border-natural-line text-micro font-medium normal-case text-slate-500">
                      <th className="px-10 py-5">Sequence</th>
                      <th className="px-10 py-5">Maturity Date</th>
                      <th className="px-10 py-5">Repayment Principal</th>
                      <th className="px-10 py-5">Service Fee</th>
                      <th className="px-10 py-5">Total Obligation</th>
                      <th className="px-10 py-5">Settlement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-natural-line">
                    {loan.amortizationSchedule.map((row) => (
                      <tr key={row.period} className="hover:bg-natural-bg/40 transition-colors group">
                        <td className="px-10 py-6 text-xs font-bold text-slate-300 font-mono">#{row.period.toString().padStart(2, '0')}</td>
                        <td className="px-10 py-6 text-sm font-medium text-natural-ink">
                          {new Date(row.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-10 py-6 text-sm font-bold text-natural-ink font-display">₱{row.principal.toLocaleString()}</td>
                        <td className="px-10 py-6 text-xs text-slate-400 font-mono tracking-tighter">₱{row.interest.toLocaleString()}</td>
                        <td className="px-10 py-6 text-base font-black text-natural-sage font-display underline decoration-natural-sage/20">₱{row.totalPayment.toLocaleString()}</td>
                        <td className="px-10 py-6">
                           <span className={`text-[10px] font-bold uppercase tracking-widest ${row.status === 'Paid' ? 'text-emerald-600' : 'text-slate-300'}`}>
                             {row.status}
                           </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Application History */}
          <motion.div variants={item} className="organic-card p-6 sm:p-8 lg:p-12">
            <h3 className="font-bold text-natural-ink flex items-center gap-3 mb-8 lg:mb-12 text-xs lg:text-sm uppercase tracking-[0.2em]">
              <History className="h-5 w-5 text-natural-sage" />
              Application History
            </h3>
            <div className="space-y-8 lg:space-y-12">
              {[...loan.history]
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .map((entry, idx) => (
                  <div key={idx} className="flex gap-4 sm:gap-8 group">
                    <div className="flex flex-col items-center">
                      <div className={`h-1.5 w-1.5 rounded-full ring-8 ring-natural-bg transition-all ${idx === 0 ? 'bg-natural-sage ring-natural-sage/10 scale-125' : 'bg-slate-300'}`} />
                      {idx < loan.history.length - 1 && <div className="w-px h-full bg-natural-line my-4 flex-1" />}
                    </div>
                    <div className="flex-1 pb-2">
                      <div className="flex justify-between items-center mb-3">
                        <p className={`font-bold text-xs uppercase tracking-widest ${idx === 0 ? 'text-natural-ink' : 'text-slate-400'}`}>{entry.status}</p>
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest font-mono">{new Date(entry.timestamp).toLocaleString()}</p>
                      </div>
                      <div className="bg-natural-bg p-5 rounded-2xl border border-natural-line group-hover:bg-white transition-colors text-left">
                        <p className="text-sm text-slate-600 font-medium leading-relaxed">"{entry.comment || 'Authentication required no narrative.'}"</p>
                      </div>
                      <p className="text-[10px] font-bold text-natural-sage/60 uppercase tracking-[0.2em] mt-4 text-left">Authorized by {entry.updatedBy}</p>
                    </div>
                  </div>
                ))}
            </div>
          </motion.div>
        </div>

        {/* Sidebar Actions */}
        <aside className="space-y-8 lg:sticky lg:top-24">
          {isStaff && (
            <motion.div variants={item} className="organic-card p-6 sm:p-10 bg-natural-sidebar text-white shadow-2xl shadow-black/20 border-none">
              <h3 className="text-micro text-white/30 mb-8 lg:mb-10 flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-natural-sage" />
                Administrative Console
              </h3>
              
              <div className="space-y-8 lg:space-y-10">
                <div className="text-left">
                  <label className="text-micro text-white/40 block mb-4">Observation Narrative</label>
                  <textarea
                    className="w-full p-4 lg:p-6 bg-white/5 border border-white/10 rounded-2xl text-xs lg:text-sm focus:outline-none focus:ring-1 focus:ring-natural-sage transition-all h-32 resize-none font-medium text-white placeholder:text-white/20"
                    placeholder="Document transaction notes..."
                    value={statusComment}
                    onChange={(e) => setStatusComment(e.target.value)}
                  />
                </div>

                <div className="space-y-4">
                  <p className="text-micro text-white/40 mb-4">Decision Tree</p>
                  
                  {availableOptions.map((s) => (
                    <button
                      key={s}
                      disabled={updating}
                      onClick={() => handleStatusUpdate(s)}
                      className={`w-full py-5 rounded-2xl font-bold text-[10px] uppercase tracking-[0.3em] transition-all active:scale-[0.98] shadow-md ${
                        s === 'Rejected' 
                        ? 'bg-red-500/10 text-red-100 border border-red-500/20 hover:bg-red-500/20' 
                        : 'bg-natural-sage text-white hover:opacity-90 shadow-lg shadow-natural-sage/20'
                      }`}
                    >
                      {updating ? 'Processing...' : `Command: ${s}`}
                    </button>
                  ))}

                  {availableOptions.length === 0 && !['Disbursed', 'Rejected'].includes(loan.status) && (
                    <div className="text-center py-10 px-6 border-2 border-dashed border-white/10 rounded-2xl font-medium text-white/30 text-xs sm:text-[10px] uppercase tracking-widest leading-relaxed">
                      Your current role ({role}) is not assigned to the '{loan.status}' workflow stage.
                    </div>
                  )}

                  {['Disbursed', 'Rejected'].includes(loan.status) && (
                    <div className="text-center py-10 px-6 border-2 border-dashed border-white/10 rounded-2xl font-medium text-white/20 text-xs uppercase tracking-widest">
                      Record fully executed and locked in history.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          <motion.div variants={item} className="organic-card p-8 bg-slate-100 border-none">
            <h4 className="text-micro text-natural-ink mb-6 flex items-center gap-3">
              <Info className="h-4 w-4 text-natural-sage" />
              Information Notice
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
               All fund movements are journaled in real-time. Repayment non-compliance triggers automatic levy procedures according to Article 12, Section 4.
            </p>
            <div className="mt-8 pt-8 border-t border-natural-line space-y-4">
               <div className="flex justify-between items-center text-micro">
                 <span className="opacity-40">System Env</span>
                 <span className="text-natural-sage">Mainnet-Secure</span>
               </div>
               <div className="flex justify-between items-center text-micro">
                 <span className="opacity-40">Privacy Tier</span>
                 <span className="text-natural-sage">RA-10173</span>
               </div>
            </div>
          </motion.div>
        </aside>
      </div>
    </motion.div>
  );
}
