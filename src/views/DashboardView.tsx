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
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { User, Loan } from '../types';

export default function DashboardView({ user }: { user: User }) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/loans', { credentials: 'include' })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setLoans(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setLoans([]);
        setLoading(false);
      });
  }, []);

  const stats = [
    { label: 'Active Loans', value: (Array.isArray(loans) ? loans : []).filter(l => l.status === 'Disbursed').length, icon: Wallet },
    { label: 'Pending Apps', value: (Array.isArray(loans) ? loans : []).filter(l => l.status === 'Pending' || l.status === 'Under Evaluation').length, icon: Clock },
    { label: 'Total Principal', value: `₱${(Array.isArray(loans) ? loans : []).reduce((acc, l) => acc + (l.status === 'Disbursed' ? l.principalAmount : 0), 0).toLocaleString()}`, icon: ArrowUpRight },
  ];

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-natural-pending-bg text-natural-pending-text';
      case 'Under Evaluation': return 'bg-natural-eval-bg text-natural-eval-text';
      case 'Reviewed': return 'bg-purple-50 text-purple-700 border border-purple-100';
      case 'Approved': return 'bg-indigo-50 text-indigo-700 border border-indigo-100';
      case 'Disbursed': return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
      case 'Rejected': return 'bg-red-50 text-red-700 border border-red-100';
      default: return 'bg-slate-50 text-slate-700 border border-slate-100';
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
      className="space-y-12"
    >
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl lg:text-4xl font-display font-black text-natural-ink tracking-tight">Bonjour, {user.name.split(' ')[0]}</h2>
          <p className="text-slate-500 text-sm lg:text-base font-medium opacity-80 mt-1">Your financial stewardship at a glance.</p>
        </div>
        {(user.role === 'Member' || user.role === 'Regular Member' || user.role === 'Associate Member') && (
          <Link
            to="/apply"
            className="flex items-center justify-center gap-2 bg-natural-sage text-white px-6 lg:px-8 py-4 rounded-2xl font-bold hover:bg-natural-sage-600 transition-all shadow-lg shadow-natural-sage/20 active:scale-95 w-full sm:w-auto text-sm"
          >
            <PlusCircle className="h-5 w-5" />
            Initiate Application
          </Link>
        )}
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {stats.map((stat) => (
          <motion.div 
            key={stat.label} 
            variants={item}
            className="organic-card p-8 lg:p-10 flex flex-col items-start gap-4 hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="h-12 w-12 rounded-2xl bg-natural-bg flex items-center justify-center border border-natural-line group-hover:bg-natural-sage/10 transition-colors">
              <stat.icon className="h-6 w-6 text-natural-sage" />
            </div>
            <div>
              <span className="text-micro">{stat.label}</span>
              <p className="text-3xl font-black text-natural-ink font-display mt-1">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Loan History Table */}
      <motion.section variants={item} className="organic-card overflow-hidden">
        <div className="px-6 lg:px-10 py-6 lg:py-8 border-b border-natural-line flex items-center justify-between bg-[#FCFCFA]">
          <h3 className="font-bold text-natural-ink flex items-center gap-3 text-xs lg:text-sm uppercase tracking-[0.2em]">
            <Activity className="h-5 w-5 text-natural-sage" />
            Financial Audit History
          </h3>
          <button 
            onClick={() => window.location.reload()}
            className="text-[10px] uppercase font-bold tracking-widest text-slate-400 hover:text-natural-sage transition-colors underline underline-offset-4"
          >
            Sync Ledger
          </button>
        </div>
        
        {loading ? (
          <div className="p-20 text-center">
            <div className="h-8 w-8 border-4 border-natural-sage/20 border-t-natural-sage rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400 font-medium text-sm">Consulting the ledger...</p>
          </div>
        ) : loans.length === 0 ? (
          <div className="p-20 text-center">
            <div className="h-20 w-20 bg-natural-bg rounded-full flex items-center justify-center mx-auto mb-6 border border-natural-line">
              <Activity className="h-10 w-10 text-natural-line" />
            </div>
            <p className="text-slate-500 font-medium text-lg">The ledger awaits its first entry.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FCFCFA] border-b border-natural-line">
                  <th className="px-6 lg:px-10 py-5 text-micro font-medium normal-case text-slate-500">Processing Date</th>
                  <th className="px-6 lg:px-10 py-5 text-micro font-medium normal-case text-slate-500">Product Class</th>
                  <th className="px-6 lg:px-10 py-5 text-micro font-medium normal-case text-slate-500">Principal</th>
                  <th className="px-6 lg:px-10 py-5 text-micro font-medium normal-case text-slate-500">Status</th>
                  <th className="px-6 lg:px-10 py-5 text-micro font-medium normal-case text-slate-500 text-right">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-natural-line">
                {loans.map((loan) => (
                  <tr key={loan._id} className="hover:bg-natural-bg/40 transition-colors group">
                    <td className="px-6 lg:px-10 py-6">
                      <div className="font-bold text-natural-ink text-sm sm:text-base">{new Date(loan.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                      <div className="text-[9px] sm:text-[10px] text-slate-400 font-mono tracking-wider">SECURED TRANSACTION</div>
                    </td>
                    <td className="px-6 lg:px-10 py-6">
                      <span className="text-sm font-medium text-natural-ink">{loan.loanType}</span>
                    </td>
                    <td className="px-6 lg:px-10 py-6">
                      <div className="text-base lg:text-lg font-black text-natural-ink font-display">₱{loan.principalAmount.toLocaleString()}</div>
                      <div className="text-[9px] sm:text-[10px] text-natural-sage font-bold uppercase tracking-widest mt-0.5">12% Standard Levy</div>
                    </td>
                    <td className="px-6 lg:px-10 py-6">
                      <span className={`px-3 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-bold uppercase tracking-widest ${getStatusStyle(loan.status)} whitespace-nowrap`}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-6 lg:px-10 py-6 text-right">
                      <Link
                        to={`/loan/${loan._id}`}
                        className="text-natural-sage font-mono text-xs hover:underline decoration-2 underline-offset-4 font-bold"
                      >
                        {loan._id.slice(-6).toUpperCase()}
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
