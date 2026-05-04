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
  ShieldCheck,
  ClipboardCheck,
  XCircle,
  Banknote,
  Stamp,
  User as UserIcon,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { User, Loan, Payment } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import LoadingScreen from '../components/LoadingScreen';

export default function LoanDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loan, setLoan] = useState<Loan | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusComment, setStatusComment] = useState('');
  const [updating, setUpdating] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [expandedPayment, setExpandedPayment] = useState<string | null>(null);

  const REJECTION_REASONS = [
    'Insufficient Collateral',
    'Incomplete Documentation',
    'Low Credit Score',
    'High Debt-to-Income Ratio',
    'Unstable Income Source',
    'Other'
  ];

  useEffect(() => {
    const startTime = Date.now();
    setLoading(true);
    Promise.all([
      fetch('/api/auth/me', { credentials: 'include' }).then(res => res.ok ? res.json() : null),
      fetch(`/api/loans/${id}`, { credentials: 'include' }).then(async res => {
        if (res.status === 403) throw new Error('Forbidden');
        return res.ok ? res.json() : null;
      }),
      fetch(`/api/payments?loanId=${id}`, { credentials: 'include' }).then(res => res.ok ? res.json() : [])
    ]).then(([userData, loanData, paymentData]) => {
      setUser(userData);
      setLoan(loanData);
      setPayments(paymentData);
    }).catch((err) => {
      console.error(err);
      if (err.message === 'Forbidden') {
        navigate('/dashboard');
      }
    }).finally(() => {
      const elapsed = Date.now() - startTime;
      const minimumDelay = 2500;
      const remaining = Math.max(0, minimumDelay - elapsed);
      setTimeout(() => setLoading(false), remaining);
    });
  }, [id, navigate]);

  const handleStatusUpdate = async (status: string) => {
    if (status === 'Rejected' && !rejectionReason) {
      alert('Please select a rejection reason.');
      return;
    }
    setUpdating(true);
    try {
      const res = await fetch(`/api/loans/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          status, 
          comment: statusComment,
          rejectionReason: status === 'Rejected' ? rejectionReason : undefined
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setLoan(updated);
        setStatusComment('');
        setRejectionReason('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleVerifyPayment = async (paymentId: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/payments/${paymentId}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (res.ok) {
        const { payment, loan: updatedLoan } = await res.json();
        setLoan(updatedLoan);
        setPayments(prev => prev.map(p => p._id === paymentId ? payment : p));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading || !loan) return <LoadingScreen />;

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
    },
    'Disbursed': {
      roles: ['System Administrator', 'Admin'],
      options: ['Delinquent', 'Closed']
    },
    'Delinquent': {
      roles: ['System Administrator', 'Admin'],
      options: ['Disbursed', 'Closed']
    }
  };

  const currentStep = workflowConfig[loan.status] || { roles: [], options: [] };
  const canPerformAction = currentStep.roles.includes(role);
  const availableOptions = canPerformAction ? currentStep.options : [];

  const isStaff = ['System Administrator', 'Evaluator', 'Reviewer', 'Approver', 'Disbursement'].includes(role);

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(47, 79, 79); // Natural Sage color approximation
    doc.text('CoopLink Official Loan Record', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Serial Hash: #${id?.slice(-8).toUpperCase()}`, 14, 35);
    
    // Loan Information Section
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('1. Loan Particulars', 14, 45);
    
    autoTable(doc, {
      startY: 50,
      head: [['Field', 'Value']],
      body: [
        ['Borrower Name', loan.name],
        ['Member ID', loan.memberId],
        ['Loan Product', loan.loanType],
        ['Principal Amount', `PHP ${loan.principalAmount.toLocaleString()}`],
        ['Interest Rate', `${(loan.interestRate * 100).toFixed(1)}% P.A.`],
        ['Term', `${loan.termMonths} Months`],
        ['Current Status', loan.status],
        ['Date Applied', new Date(loan.createdAt).toLocaleDateString()]
      ],
      theme: 'striped',
      headStyles: { textColor: [0, 0, 0], fontStyle: 'bold' }
    });

    // Amortization Schedule
    if (loan.amortizationSchedule && loan.amortizationSchedule.length > 0) {
      doc.text('2. Repayment Matrix', 14, (doc as any).lastAutoTable.finalY + 15);
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['Seq', 'Due Date', 'Principal', 'Interest', 'Total', 'Status']],
        body: loan.amortizationSchedule.map(row => [
          `#${row.period.toString().padStart(2, '0')}`,
          new Date(row.dueDate).toLocaleDateString(),
          `PHP ${row.principal.toLocaleString()}`,
          `PHP ${row.interest.toLocaleString()}`,
          `PHP ${row.totalPayment.toLocaleString()}`,
          row.status
        ]),
        headStyles: { fillColor: [47, 79, 79] }
      });
    }

    // History Log
    doc.addPage();
    doc.text('3. Application History Log', 14, 22);
    autoTable(doc, {
      startY: 30,
      head: [['Timestamp', 'Authorized By', 'Action', 'Narrative']],
      body: loan.history.map(h => [
        new Date(h.timestamp).toLocaleString(),
        h.updatedBy,
        h.status,
        h.status === 'Rejected' && h.rejectionReason 
          ? `[REASON: ${h.rejectionReason}] ${h.comment || ''}`
          : h.comment || 'N/A'
      ]),
      headStyles: { fillColor: [47, 79, 79] }
    });

    doc.save(`Loan_Record_${id?.slice(-8).toUpperCase()}.pdf`);
  };

  const statusConfig: Record<string, { icon: any, color: string, bg: string }> = {
    'Pending': { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
    'Under Evaluation': { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' },
    'Reviewed': { icon: ClipboardCheck, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    'Approved': { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    'Disbursed': { icon: Banknote, color: 'text-purple-500', bg: 'bg-purple-50' },
    'Rejected': { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
    'Closed': { icon: ShieldCheck, color: 'text-slate-500', bg: 'bg-slate-50' },
  };

  const groupedHistory = [...loan.history]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .reduce<Record<string, typeof loan.history>>((groups, entry) => {
      const date = new Date(entry.timestamp).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(entry);
      return groups;
    }, {});

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
                <p className="text-micro opacity-40 mb-2 font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 italic">Authenticated Instrument</p>
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black text-natural-ink dark:text-white tracking-tight">
                  <span className="text-2xl sm:text-3xl not-italic font-sans mr-1 opacity-40">₱</span>
                  {loan.principalAmount.toLocaleString()}
                </h2>
                <div className="mt-6 lg:mt-8 flex flex-wrap items-center gap-4 lg:gap-6">
                  <div>
                    <p className="text-micro opacity-40 mb-1 font-bold italic">Product Class</p>
                    <p className="text-xs lg:text-sm font-bold uppercase tracking-widest text-natural-ink dark:text-white italic">{loan.loanType}</p>
                  </div>
                  <div className="h-8 w-px bg-natural-line dark:bg-white/10 hidden sm:block" />
                  <div>
                    <p className="text-micro opacity-40 mb-1 font-bold italic">Serial Hash</p>
                    <p className="text-xs lg:text-sm font-mono text-natural-ink dark:text-white/80">#{id?.slice(-8).toUpperCase()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-natural-bg dark:bg-white/5 p-6 lg:p-8 rounded-2xl border border-natural-line dark:border-white/10 text-center w-full md:min-w-[200px] md:w-auto">
                <p className="text-micro opacity-40 mb-3 lg:mb-4 font-bold italic">Lifecycle Status</p>
                <span className={`block w-full py-2.5 rounded-xl text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] shadow-sm ${
                  loan.status === 'Disbursed' ? 'bg-natural-sage text-white' : 'bg-white dark:bg-slate-900 text-natural-ink dark:text-white border border-natural-line dark:border-white/10'
                }`}>
                  {loan.status}
                </span>
                <p className="text-[9px] lg:text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-3 lg:mt-4 uppercase tracking-widest italic">Verified {new Date(loan.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-12 pt-8 lg:pt-12 border-t border-natural-line dark:border-white/5 relative z-10">
              <div>
                <p className="text-micro opacity-40 mb-1 lg:mb-2 font-bold italic">Cost of Funds</p>
                <p className="text-lg lg:text-xl font-bold text-natural-ink dark:text-white font-display italic">{(loan.interestRate * 100).toFixed(1)}% <span className="text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-[0.1em] font-sans">P.A.</span></p>
              </div>
              <div>
                <p className="text-micro opacity-40 mb-1 lg:mb-2 font-bold italic">Duration</p>
                <p className="text-lg lg:text-xl font-bold text-natural-ink dark:text-white font-display italic">{loan.termMonths} <span className="text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-[0.1em] font-sans">Months</span></p>
              </div>
              <div>
                <p className="text-micro opacity-40 mb-1 lg:mb-2 font-bold italic">Obligor ID</p>
                <p className="text-lg lg:text-xl font-bold text-natural-ink dark:text-white font-display italic">{loan.memberId}</p>
              </div>
              <div>
                <p className="text-micro opacity-40 mb-1 lg:mb-2 font-bold italic">Account Name</p>
                <p className="text-lg lg:text-xl font-bold text-natural-ink dark:text-white font-display truncate italic">{loan.name}</p>
              </div>
            </div>
          </motion.div>

          {/* Amortization Schedule */}
          {loan.status === 'Disbursed' && (
            <motion.div variants={item} className="organic-card overflow-hidden">
              <div className="px-10 py-8 border-b border-natural-line dark:border-white/5 flex items-center justify-between bg-[#FCFCFA] dark:bg-slate-900/50">
                <h3 className="font-bold text-natural-ink dark:text-white flex items-center gap-3 text-sm uppercase tracking-[0.2em] italic">
                  <Calendar className="h-5 w-5 text-natural-sage" />
                  Repayment Matrix
                </h3>
                <button 
                  onClick={exportToPDF}
                  className="flex items-center gap-2 text-micro text-natural-sage hover:underline"
                >
                  <Printer className="h-4 w-4" />
                  Export Ledger (PDF)
                </button>
              </div>
              
              <div className="overflow-x-auto text-left">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FCFCFA] dark:bg-slate-900/10 border-b border-natural-line dark:border-white/5 text-micro font-medium normal-case text-slate-500 dark:text-slate-400 italic">
                      <th className="px-10 py-5">Sequence</th>
                      <th className="px-10 py-5">Maturity Date</th>
                      <th className="px-10 py-5">Repayment Principal</th>
                      <th className="px-10 py-5">Service Fee</th>
                      <th className="px-10 py-5">Total Obligation</th>
                      <th className="px-10 py-5">Settlement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-natural-line dark:divide-white/5 bg-white dark:bg-slate-950">
                    {loan.amortizationSchedule.map((row) => (
                      <tr key={row.period} className="hover:bg-natural-bg/40 dark:hover:bg-white/[0.02] transition-colors group">
                        <td className="px-10 py-6 text-xs font-bold text-slate-300 dark:text-slate-600 font-mono">#{row.period.toString().padStart(2, '0')}</td>
                        <td className="px-10 py-6 text-sm font-medium text-natural-ink dark:text-white italic">
                          {new Date(row.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-10 py-6 text-sm font-bold text-natural-ink dark:text-white font-display italic">₱{row.principal.toLocaleString()}</td>
                        <td className="px-10 py-6 text-xs text-slate-400 dark:text-slate-500 font-mono tracking-tighter italic">₱{row.interest.toLocaleString()}</td>
                        <td className="px-10 py-6 text-base font-black text-natural-sage font-display underline decoration-natural-sage/20 italic">₱{row.totalPayment.toLocaleString()}</td>
                        <td className="px-10 py-6">
                           <span className={`text-[10px] font-bold uppercase tracking-widest italic ${row.status === 'Paid' ? 'text-emerald-600' : 'text-slate-300 dark:text-slate-600'}`}>
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

          {/* Pending Verifications (Authorized Staff) */}
          {(role === 'System Administrator' || role === 'Disbursement') && loan.status === 'Disbursed' && payments.some(p => !p.verified) && (
            <motion.div variants={item} className="organic-card border-amber-200 bg-amber-50/20 overflow-hidden">
              <div className="px-10 py-8 border-b border-amber-200 flex items-center justify-between">
                <h3 className="font-bold text-amber-900 flex items-center gap-3 text-sm uppercase tracking-[0.2em]">
                  <Send className="h-5 w-5 text-amber-500" />
                  Pending Transaction Verifications
                </h3>
                <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-200">
                  {payments.filter(p => !p.verified).length} Action Required
                </span>
              </div>
              <div className="divide-y divide-amber-200/50">
                {payments.filter(p => !p.verified).map((payment) => (
                  <div key={payment._id} className="transition-all">
                    <button 
                      onClick={() => setExpandedPayment(expandedPayment === payment._id ? null : payment._id)}
                      className="w-full px-10 py-6 flex items-center justify-between hover:bg-amber-100/50 transition-colors"
                    >
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col items-start">
                          <span className="text-micro text-amber-700/50 uppercase tracking-widest mb-1">Authorization Amount</span>
                          <span className="text-2xl font-black text-amber-900 font-display">₱{payment.amountPaid.toLocaleString()}</span>
                        </div>
                        <div className="h-10 w-px bg-amber-200/50" />
                        <div className="hidden sm:flex flex-col items-start">
                          <span className="text-micro text-amber-700/50 uppercase tracking-widest mb-1">Source Method</span>
                          <span className="text-xs font-bold text-amber-800 uppercase tracking-widest">{payment.method}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-micro text-amber-600 font-bold uppercase tracking-widest hidden lg:block">#{payment.referenceNumber}</span>
                        {expandedPayment === payment._id ? <ChevronUp className="h-5 w-5 text-amber-400" /> : <ChevronDown className="h-5 w-5 text-amber-400" />}
                      </div>
                    </button>

                    <motion.div
                      initial={false}
                      animate={{ height: expandedPayment === payment._id ? 'auto' : 0, opacity: expandedPayment === payment._id ? 1 : 0 }}
                      className="overflow-hidden bg-white/40"
                    >
                      <div className="px-10 pb-8 pt-2 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                          <div className="space-y-1.5">
                            <span className="text-[9px] font-black text-amber-600/40 uppercase tracking-widest">Reference Identity</span>
                            <p className="text-xs font-mono font-bold text-amber-900">IDENTIFIER: #{payment.referenceNumber}</p>
                          </div>
                          <div className="space-y-1.5">
                            <span className="text-[9px] font-black text-amber-600/40 uppercase tracking-widest">Transmission Date</span>
                            <p className="text-xs font-bold text-amber-900">{new Date(payment.datePaid).toLocaleString()}</p>
                          </div>
                          <div className="space-y-1.5">
                            <span className="text-[9px] font-black text-amber-600/40 uppercase tracking-widest">Protocol</span>
                            <p className="text-xs font-bold text-amber-900">{payment.method} Transfer</p>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-amber-200/50">
                          <div className="flex-1 text-left">
                            <p className="text-[10px] text-amber-800/60 leading-relaxed italic pr-8">
                              "Verification signifies that the funds have been successfully reconciled with the institution's clearing account."
                            </p>
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleVerifyPayment(payment._id); }}
                            disabled={updating}
                            className="w-full sm:w-auto flex items-center justify-center gap-3 bg-amber-500 hover:bg-amber-600 text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-[0.98] shadow-lg shadow-amber-500/20 disabled:opacity-50"
                          >
                            {updating ? 'Validating...' : 'Authorize & Apply'}
                            <ShieldCheck className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Transaction Registry (All Users) */}
          {loan.status === 'Disbursed' && payments.length > 0 && (
            <motion.div variants={item} className="organic-card overflow-hidden">
              <div className="px-10 py-8 border-b border-natural-line flex items-center justify-between bg-[#F8F9F8]">
                <h3 className="font-bold text-natural-ink flex items-center gap-3 text-sm uppercase tracking-[0.2em]">
                  <CreditCard className="h-5 w-5 text-natural-sage" />
                  Transaction Registry
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FAFBF9] border-b border-natural-line text-micro font-medium text-slate-500">
                      <th className="px-10 py-5">Date</th>
                      <th className="px-10 py-5">Reference</th>
                      <th className="px-10 py-5">Method</th>
                      <th className="px-10 py-5 text-right">Amount</th>
                      <th className="px-10 py-5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-natural-line">
                    {payments.sort((a, b) => new Date(b.datePaid).getTime() - new Date(a.datePaid).getTime()).map((p) => (
                      <tr key={p._id} className="hover:bg-natural-bg/40 transition-colors">
                        <td className="px-10 py-6 text-xs text-slate-500 font-medium">
                          {new Date(p.datePaid).toLocaleDateString()}
                        </td>
                        <td className="px-10 py-6 text-xs font-mono font-bold text-natural-ink">
                          {p.referenceNumber}
                        </td>
                        <td className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {p.method}
                        </td>
                        <td className="px-10 py-6 text-right font-black text-natural-ink font-display text-sm">
                          ₱{p.amountPaid.toLocaleString()}
                        </td>
                        <td className="px-10 py-6 text-center">
                          <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ${
                            p.verified ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100 animate-pulse'
                          }`}>
                            {p.verified ? 'Verified' : 'Pending'}
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
            <h3 className="font-bold text-natural-ink dark:text-white flex items-center gap-3 mb-8 lg:mb-12 text-xs lg:text-sm uppercase tracking-[0.2em]">
              <History className="h-5 w-5 text-natural-sage" />
              Application History
            </h3>
            
            <div className="space-y-12">
              {Object.entries(groupedHistory).map(([date, entries]) => (
                <div key={date} className="relative">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="h-px flex-1 bg-natural-line dark:bg-slate-800" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap bg-natural-bg dark:bg-slate-900 px-4 py-1 rounded-full border border-natural-line dark:border-slate-800">
                      {date}
                    </span>
                    <div className="h-px flex-1 bg-natural-line dark:bg-slate-800" />
                  </div>

                  <div className="space-y-8">
                    {entries.map((entry, idx) => {
                      const config = statusConfig[entry.status] || { icon: Info, color: 'text-slate-400', bg: 'bg-slate-50' };
                      return (
                        <div key={idx} className="flex gap-4 sm:gap-8 group relative">
                          <div className="flex flex-col items-center">
                            <div className={`p-2.5 rounded-xl ${config.bg} dark:bg-opacity-10 ${config.color} transition-all shadow-sm`}>
                              <config.icon className="h-4 w-4 lg:h-5 lg:w-5" />
                            </div>
                            {idx < entries.length - 1 && <div className="w-px h-full bg-natural-line dark:bg-slate-800 my-2" />}
                          </div>
                          
                          <div className="flex-1 pb-4">
                            <div className="flex justify-between items-center mb-2">
                              <p className={`font-black text-[10px] lg:text-xs uppercase tracking-widest ${config.color}`}>
                                {entry.status}
                              </p>
                              <p className="text-[10px] font-bold text-slate-300 dark:text-slate-500 uppercase tracking-widest font-mono">
                                {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            
                            <div className="bg-natural-bg dark:bg-slate-800/50 p-5 rounded-2xl border border-natural-line dark:border-slate-800 group-hover:border-natural-sage/30 transition-all text-left">
                              {entry.rejectionReason && (
                                <div className="mb-3 flex items-center gap-2">
                                  <AlertCircle className="h-4 w-4 text-red-500" />
                                  <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Reason: {entry.rejectionReason}</span>
                                </div>
                              )}
                              <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed italic">
                                "{entry.comment || 'Authentication required no narrative.'}"
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-2 mt-4 text-left">
                              <div className="h-5 w-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                <UserIcon className="h-3 w-3 text-slate-500" />
                              </div>
                              <p className="text-[10px] font-bold text-natural-sage/60 uppercase tracking-[0.2em]">
                                Authorized by {entry.updatedBy}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
                  
                  {availableOptions.includes('Rejected') && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 p-4 bg-red-500/5 border border-red-500/20 rounded-2xl text-left"
                    >
                      <label className="text-micro text-red-200/50 block mb-3">Rejection Category (Required if rejecting)</label>
                      <select 
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-[10px] uppercase font-bold tracking-widest text-white focus:outline-none focus:ring-1 focus:ring-red-400 transition-all appearance-none cursor-pointer"
                      >
                        <option value="" className="bg-slate-900">Select Reason...</option>
                        {REJECTION_REASONS.map(reason => (
                          <option key={reason} value={reason} className="bg-slate-900">{reason}</option>
                        ))}
                      </select>
                    </motion.div>
                  )}

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

                  {['Closed', 'Rejected'].includes(loan.status) && (
                    <div className="text-center py-10 px-6 border-2 border-dashed border-white/10 rounded-2xl font-medium text-white/20 text-xs uppercase tracking-widest">
                      Record fully executed and locked in history.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          <motion.div variants={item} className="organic-card p-8 bg-slate-100 dark:bg-white/5 border-none">
            <h4 className="text-micro text-natural-ink dark:text-white mb-6 flex items-center gap-3 italic">
              <Info className="h-4 w-4 text-natural-sage" />
              Information Notice
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium italic">
               All fund movements are journaled in real-time. Repayment non-compliance triggers automatic levy procedures according to Article 12, Section 4.
            </p>
            <div className="mt-8 pt-8 border-t border-natural-line dark:border-white/5 space-y-4">
               <div className="flex justify-between items-center text-micro">
                 <span className="opacity-40 italic">System Env</span>
                 <span className="text-natural-sage font-black italic">Mainnet-Secure</span>
               </div>
               <div className="flex justify-between items-center text-micro">
                 <span className="opacity-40 italic">Privacy Tier</span>
                 <span className="text-natural-sage font-black italic">RA-10173</span>
               </div>
            </div>
          </motion.div>
        </aside>
      </div>
    </motion.div>
  );
}
