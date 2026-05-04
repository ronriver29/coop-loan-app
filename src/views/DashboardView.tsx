import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Wallet, 
  PlusCircle,
  PlayCircle,
  Eye,
  Activity,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { User, Loan } from '../types';

import LoadingScreen from '../components/LoadingScreen';

export default function DashboardView({ user }: { user: User }) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const startTime = Date.now();
    fetch('/api/loans', { credentials: 'include' })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setLoans(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setLoans([]);
      })
      .finally(() => {
        const elapsed = Date.now() - startTime;
        const minimumDelay = 2500;
        const remaining = Math.max(0, minimumDelay - elapsed);
        setTimeout(() => setLoading(false), remaining);
      });
  }, []);

  if (loading) return <LoadingScreen />;

  const stats = [
    { label: 'Active Loans', value: (Array.isArray(loans) ? loans : []).filter(l => l.status === 'Disbursed' || l.status === 'Delinquent').length, icon: Wallet },
    { label: 'Pending Apps', value: (Array.isArray(loans) ? loans : []).filter(l => l.status === 'Pending' || l.status === 'Under Evaluation').length, icon: Clock },
    { label: 'Total Principal', value: `₱${(Array.isArray(loans) ? loans : []).reduce((acc, l) => acc + (l.status === 'Disbursed' || l.status === 'Delinquent' ? l.principalAmount : 0), 0).toLocaleString()}`, icon: ArrowUpRight },
  ];

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-natural-pending-bg text-natural-pending-text';
      case 'Under Evaluation': return 'bg-natural-eval-bg text-natural-eval-text';
      case 'Reviewed': return 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-800/30';
      case 'Approved': return 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/30';
      case 'Disbursed': return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/30';
      case 'Rejected': return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-800/30';
      case 'Closed': return 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700';
      case 'Delinquent': return 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/30 animate-pulse';
      default: return 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-700';
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-12 pb-12"
    >
      <motion.div variants={item} className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="h-2 w-8 bg-natural-sage rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-natural-sage italic">Operational Dashboard</span>
          </div>
          <h2 className="text-4xl lg:text-6xl font-display font-black text-natural-ink dark:text-white tracking-tighter leading-none italic uppercase">
            Console <span className="text-natural-sage opacity-50 dark:opacity-30">/</span> {user.name.split(' ')[0]}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm lg:text-lg font-medium opacity-80 max-w-xl italic">
            Monitor institutional liquidity and personal financial standing within the CoopLink network.
          </p>
        </div>
        {(user.role === 'Member' || user.role === 'Regular Member' || user.role === 'Associate Member') && (
          <Link
            to="/apply"
            className="flex items-center justify-center gap-3 bg-natural-sage text-white px-8 lg:px-10 py-5 rounded-3xl font-black hover:bg-natural-sage-600 transition-all shadow-2xl shadow-natural-sage/20 active:scale-95 w-full sm:w-auto text-[10px] uppercase tracking-[0.3em] italic group overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <PlusCircle className="h-4 w-4 relative z-10" />
            <span className="relative z-10">Initiate Protocol</span>
          </Link>
        )}
      </motion.div>

      {/* Bento Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div 
          variants={item}
          className="md:col-span-2 organic-card p-10 flex flex-col justify-between group hover:border-natural-sage/30 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8">
            <Wallet className="h-24 w-24 text-natural-sage/5 -rotate-12 group-hover:scale-110 transition-transform" />
          </div>
          <div className="relative z-10">
            <span className="text-micro text-natural-sage italic mb-1 block">Institutional Exposure</span>
            <p className="text-5xl font-black text-natural-ink dark:text-white font-display mt-2 tracking-tighter italic uppercase">
              {stats[2].value}
            </p>
            <div className="mt-8 flex items-center gap-3">
              <span className="h-px w-8 bg-natural-line dark:bg-white/10" />
              <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase italic">Total Active Principal</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          variants={item}
          className="organic-card p-8 flex flex-col justify-between hover:border-amber-500/30"
        >
          <div className="h-10 w-10 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6">
            <Clock className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <span className="text-micro italic block">Task Queue</span>
            <p className="text-4xl font-black text-natural-ink dark:text-white font-display mt-2 italic uppercase">
              {stats[1].value}
            </p>
            <p className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mt-4">Pending Authorization</p>
          </div>
        </motion.div>

        <motion.div 
          variants={item}
          className="organic-card p-8 flex flex-col justify-between hover:border-emerald-500/30"
        >
          <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6">
            <Activity className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <span className="text-micro italic block">Active Contracts</span>
            <p className="text-4xl font-black text-natural-ink dark:text-white font-display mt-2 italic uppercase">
              {stats[0].value}
            </p>
            <p className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mt-4">Verified Assets</p>
          </div>
        </motion.div>
      </div>

      {/* Loan History Table */}
      <motion.section variants={item} className="organic-card overflow-hidden border-none shadow-2xl shadow-black/5 dark:shadow-none">
        <div className="px-8 lg:px-12 py-8 bg-[#FCFCFA] dark:bg-slate-900/50 border-b border-natural-line dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-3 w-3 bg-natural-sage rounded-full animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.4)]" />
            <h3 className="font-black text-natural-ink dark:text-white text-[10px] uppercase tracking-[0.4em] italic mb-0">
              Audit Stream <span className="opacity-30 mx-2">/</span> Historical Ledger
            </h3>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="text-[9px] uppercase font-black tracking-[0.3em] text-natural-sage hover:text-natural-sage-600 transition-all flex items-center gap-2 italic group"
          >
            <PlayCircle className="h-3 w-3 group-hover:rotate-12 transition-transform" />
            Synchronize Data State
          </button>
        </div>
        
        {loans.length === 0 ? (
          <div className="p-32 text-center bg-white dark:bg-slate-950">
            <div className="h-20 w-20 bg-natural-bg dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-natural-line dark:border-white/10 group">
              <Eye className="h-10 w-10 text-slate-200 dark:text-white/10 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest italic">Zero Records Detected in Primary Ledger.</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white dark:bg-slate-950">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FCFCFA] dark:bg-slate-900/30 border-b border-natural-line dark:border-white/5">
                  <th className="px-8 lg:px-12 py-6 text-micro !text-[9px] italic">Timestamp</th>
                  <th className="px-8 lg:px-12 py-6 text-micro !text-[9px] italic">Product Identifier</th>
                  <th className="px-8 lg:px-12 py-6 text-micro !text-[9px] italic">Quantum</th>
                  <th className="px-8 lg:px-12 py-6 text-micro !text-[9px] italic">Current State</th>
                  <th className="px-8 lg:px-12 py-6 text-micro !text-[9px] italic text-right">Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-natural-line dark:divide-white/5">
                {loans.map((loan) => (
                  <tr key={loan._id} className="hover:bg-natural-bg/30 dark:hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 lg:px-12 py-8">
                      <div className="font-black text-natural-ink dark:text-white text-xs uppercase tracking-tight italic">
                        {new Date(loan.createdAt).toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' })}
                      </div>
                      <div className="text-[8px] font-mono font-bold text-slate-400/60 uppercase tracking-widest mt-1">ISO:8601 RECORD</div>
                    </td>
                    <td className="px-8 lg:px-12 py-8">
                      <span className="text-[10px] font-black text-natural-ink dark:text-white uppercase tracking-widest italic">{loan.loanType}</span>
                    </td>
                    <td className="px-8 lg:px-12 py-8">
                      <div className="text-xl font-black text-natural-ink dark:text-white font-display italic tracking-tight">₱{loan.principalAmount.toLocaleString()}</div>
                      <div className="text-[9px] text-natural-sage font-black uppercase tracking-widest mt-1">Verified Principal</div>
                    </td>
                    <td className="px-8 lg:px-12 py-8">
                      <span className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] italic border ${getStatusStyle(loan.status)}`}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-8 lg:px-12 py-8 text-right">
                      <Link
                        to={`/loan/${loan._id}`}
                        className="inline-flex items-center gap-2 bg-natural-bg dark:bg-white/5 border border-natural-line dark:border-white/10 px-4 py-2 rounded-xl text-natural-sage font-mono text-[10px] font-black uppercase hover:bg-natural-sage hover:text-white hover:border-natural-sage transition-all italic tracking-widest"
                      >
                        Details <ChevronRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.section>
    </motion.div>
  );
}
