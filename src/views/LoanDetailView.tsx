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
  AlertCircle
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
      fetch('/api/auth/me').then(res => res.ok ? res.json() : null),
      fetch(`/api/loans`).then(res => res.ok ? res.json() : [])
    ]).then(([userData, loansData]) => {
      setUser(userData);
      const foundLoan = Array.isArray(loansData) ? loansData.find((l: any) => l._id === id) : null;
      setLoan(foundLoan);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [id]);

  const handleStatusUpdate = async (status: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/loans/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
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

  if (loading || !loan) return <div className="p-12 text-center text-gray-400">Loading loan details...</div>;

  const isAdmin = user?.role === 'Admin';
  const nextStatusOptions = {
    'Pending': ['Under Evaluation', 'Rejected'],
    'Under Evaluation': ['Approved', 'Rejected'],
    'Approved': ['Disbursed'],
    'Disbursed': [],
    'Rejected': []
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-8 pb-20"
    >
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors font-bold text-sm uppercase tracking-widest"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </button>

      <div className="grid lg:grid-cols-[1fr_350px] gap-8">
        <div className="space-y-8">
          {/* Main Info Card */}
          <div className="bg-white rounded-xl border border-natural-line shadow-sm p-10">
            <div className="flex justify-between items-start mb-12">
              <div>
                <span className="inline-flex items-center px-2 py-1 rounded-[4px] text-[10px] font-black uppercase tracking-widest bg-natural-bg text-natural-sage mb-4 border border-natural-line">
                  {loan.loanType} Product
                </span>
                <h2 className="text-5xl font-black text-natural-ink tracking-tight italic font-serif">
                  ₱{loan.principalAmount.toLocaleString()}
                </h2>
                <p className="text-gray-400 font-mono text-xs mt-2 uppercase tracking-widest">Ref: {id?.slice(-8).toUpperCase()}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">Current Lifecycle</p>
                <span className={`inline-flex items-center h-8 px-5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-natural-sidebar text-white shadow-md`}>
                  {loan.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-10 pt-10 border-t border-natural-line">
              <div>
                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-2">Annual Rate</p>
                <p className="text-xl font-bold text-natural-ink">{(loan.interestRate * 100).toFixed(0)}% P.A.</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-2">Repayment Term</p>
                <p className="text-xl font-bold text-natural-ink">{loan.termMonths} Months</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-2">Member Reference</p>
                <p className="text-xl font-bold text-natural-ink">{loan.memberId}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-2">Obligor</p>
                <p className="text-xl font-bold text-natural-ink">{loan.name}</p>
              </div>
            </div>
          </div>

          {/* Amortization Table */}
          {loan.status === 'Disbursed' && (
            <div className="bg-white rounded-xl border border-natural-line shadow-sm overflow-hidden">
              <div className="p-8 border-b border-natural-line flex items-center justify-between bg-gray-50">
                <h3 className="font-bold text-natural-ink flex items-center gap-2 text-sm uppercase tracking-widest">
                  <Calendar className="h-5 w-5 text-natural-sage" />
                  Repayment Matrix
                </h3>
                <button className="flex items-center gap-2 text-[10px] font-bold text-natural-sage hover:underline uppercase tracking-widest">
                  <Printer className="h-4 w-4" />
                  Generate Ledger PDF
                </button>
              </div>
              
              <div className="overflow-x-auto text-left">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-natural-line text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <th className="px-8 py-4">#</th>
                      <th className="px-8 py-4">Due Date</th>
                      <th className="px-8 py-4">Principal</th>
                      <th className="px-8 py-4">Interest</th>
                      <th className="px-8 py-4">Total Due</th>
                      <th className="px-8 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-natural-line">
                    {loan.amortizationSchedule.map((row) => (
                      <tr key={row.period} className="hover:bg-natural-bg/50 transition-colors">
                        <td className="px-8 py-4 text-xs font-bold text-gray-400">{row.period.toString().padStart(2, '0')}</td>
                        <td className="px-8 py-4 text-xs font-medium text-natural-ink">
                          {new Date(row.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-8 py-4 text-xs font-bold text-natural-ink">₱{row.principal.toLocaleString()}</td>
                        <td className="px-8 py-4 text-xs font-bold text-gray-400">₱{row.interest.toLocaleString()}</td>
                        <td className="px-8 py-4 text-xs font-black text-natural-sage">₱{row.totalPayment.toLocaleString()}</td>
                        <td className="px-8 py-4 text-xs font-bold text-gray-300 uppercase tracking-widest">{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* History / Audit Log */}
          <div className="bg-white rounded-xl border border-natural-line shadow-sm p-10">
            <h3 className="font-bold text-natural-ink flex items-center gap-2 mb-10 text-sm uppercase tracking-widest">
              <History className="h-5 w-5 text-natural-sage" />
              Compliance Audit Trail
            </h3>
            <div className="space-y-8">
              {loan.history.map((entry, idx) => (
                <div key={idx} className="flex gap-6">
                  <div className="flex flex-col items-center">
                    <div className={`h-6 w-6 rounded flex items-center justify-center shrink-0 border ${idx === 0 ? 'bg-natural-sage border-natural-sage text-white' : 'bg-white border-natural-line text-gray-300'}`}>
                      {entry.status === 'Disbursed' ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                    </div>
                    {idx < loan.history.length - 1 && <div className="w-px h-full bg-natural-line my-2" />}
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-bold text-sm text-natural-ink uppercase tracking-widest">{entry.status}</p>
                      <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest font-mono">{new Date(entry.timestamp).toLocaleString()}</p>
                    </div>
                    <p className="text-sm text-gray-500 font-serif italic leading-relaxed">"{entry.comment || 'No processing notes'}"</p>
                    <p className="text-[10px] font-bold text-natural-sage uppercase tracking-widest mt-3">Verified by {entry.updatedBy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar: Admin Actions */}
        <aside className="space-y-6">
          {isAdmin && (
            <div className="bg-white rounded-xl border border-natural-line shadow-sm p-8 sticky top-24">
              <h3 className="text-xs font-black text-natural-ink uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-natural-sage" />
                Review Console
              </h3>
              
              <div className="space-y-8">
                <div className="text-left">
                  <label className="text-[10px] font-bold text-gray-300 uppercase tracking-widest block mb-3">Internal Decision Notes</label>
                  <textarea
                    className="w-full p-4 bg-natural-bg border border-natural-line rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-natural-sage focus:bg-white transition-all h-32 resize-none font-serif italic"
                    placeholder="Enter observations..."
                    value={statusComment}
                    onChange={(e) => setStatusComment(e.target.value)}
                  />
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest text-left">Transition Commands</p>
                  {(nextStatusOptions[loan.status as keyof typeof nextStatusOptions] || []).map((s) => (
                    <button
                      key={s}
                      disabled={updating}
                      onClick={() => handleStatusUpdate(s)}
                      className={`w-full py-4 rounded-lg font-bold text-[11px] uppercase tracking-widest transition-all active:scale-[0.98] shadow-sm ${
                        s === 'Rejected' 
                        ? 'text-red-600 border border-red-50 hover:bg-red-50' 
                        : 'bg-natural-sage text-white hover:opacity-90'
                      }`}
                    >
                      {updating ? 'Executing...' : `Command: ${s}`}
                    </button>
                  ))}
                  {(nextStatusOptions[loan.status as keyof typeof nextStatusOptions] || []).length === 0 && (
                    <p className="text-[10px] text-center text-gray-400 py-6 italic border-2 border-dashed border-natural-line rounded-xl font-serif">
                      Record finalized in ledger.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="bg-natural-bg border border-natural-line rounded-xl p-8">
            <h4 className="font-bold text-natural-ink text-xs uppercase tracking-widest mb-4 flex items-center gap-2 leading-none">
              <Info className="h-4 w-4 text-natural-sage" />
              Policy Bulletin
            </h4>
            <p className="text-[10px] text-gray-500 leading-relaxed italic font-serif mb-6">
              All disbursements verified against RA 10173 and CDA operational standards.
            </p>
            <div className="space-y-3 pt-6 border-t border-natural-line">
              <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <span>Verification</span>
                <span className="text-natural-sage">L2 Secured</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <span>Authority</span>
                <span className="text-natural-sage">CoopTrust v2</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </motion.div>
  );
}
