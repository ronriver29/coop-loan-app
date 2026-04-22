import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  Clock,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Loan } from '../types';

export default function AdminQueueView() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Pending');

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

  const filteredLoans = (Array.isArray(loans) ? loans : []).filter(l => l.status === filter || filter === 'All');

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

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-natural-pending-bg text-natural-pending-text border border-natural-pending-text/10';
      case 'Under Evaluation': return 'bg-natural-eval-bg text-natural-eval-text border border-natural-eval-text/10';
      case 'Reviewed': return 'bg-purple-50 text-purple-700 border border-purple-100';
      case 'Approved': return 'bg-indigo-50 text-indigo-700 border border-indigo-100';
      case 'Disbursed': return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
      case 'Rejected': return 'bg-red-50 text-red-700 border border-red-100';
      default: return 'bg-slate-50 text-slate-700 border border-slate-100';
    }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-12"
    >
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl lg:text-4xl font-display font-black text-natural-ink tracking-tight">Underwriting Queue</h2>
          <p className="text-slate-500 text-sm lg:text-base font-medium opacity-80 mt-1">Reviewing and authenticating active credit applications.</p>
        </div>
      </motion.div>

      <motion.div 
        variants={item} 
        className="flex flex-wrap items-center gap-2 lg:gap-4 bg-white/50 p-2 rounded-[1.5rem] lg:rounded-[2rem] border border-natural-line backdrop-blur-sm w-full sm:w-fit"
      >
        {['Pending', 'Under Evaluation', 'Reviewed', 'Approved', 'Disbursed', 'Rejected', 'All'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`flex-1 sm:flex-none px-4 lg:px-6 py-2.5 rounded-[1rem] lg:rounded-[1.5rem] text-[9px] lg:text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
              filter === s 
              ? 'bg-natural-sidebar text-white shadow-lg' 
              : 'text-slate-400 hover:text-natural-ink hover:bg-natural-bg'
            }`}
          >
            {s}
          </button>
        ))}
      </motion.div>

      <motion.section variants={item} className="organic-card overflow-hidden">
        {loading ? (
          <div className="p-20 text-center">
            <div className="h-8 w-8 border-4 border-natural-sage/20 border-t-natural-sage rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400 font-medium text-sm">Accessing the central repository...</p>
          </div>
        ) : filteredLoans.length === 0 ? (
          <div className="p-20 text-center">
            <div className="h-20 w-20 bg-natural-bg rounded-full flex items-center justify-center mx-auto mb-6 border border-natural-line">
              <Users className="h-10 w-10 text-natural-line" />
            </div>
            <p className="text-slate-500 font-medium text-lg">No pending instruments in this category.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FCFCFA] border-b border-natural-line">
                  <th className="px-6 lg:px-10 py-5 text-micro font-medium normal-case text-slate-500">Obligor Credentials</th>
                  <th className="px-6 lg:px-10 py-5 text-micro font-medium normal-case text-slate-500">Product Class</th>
                  <th className="px-6 lg:px-10 py-5 text-micro font-medium normal-case text-slate-500">Capital Value</th>
                  <th className="px-6 lg:px-10 py-5 text-micro font-medium normal-case text-slate-500">Lifecycle</th>
                  <th className="px-6 lg:px-10 py-5 text-micro font-medium normal-case text-slate-500 text-right">Adjudication</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-natural-line">
                {filteredLoans.map((loan) => (
                  <tr key={loan._id} className="hover:bg-natural-bg/40 transition-colors group">
                    <td className="px-6 lg:px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 lg:h-11 lg:w-11 bg-natural-sidebar text-slate-300 rounded-2xl flex items-center justify-center font-bold text-[10px] lg:text-xs uppercase tracking-tighter border border-white/5 shadow-md shrink-0">
                          {loan.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-natural-ink truncate max-w-[120px] sm:max-w-none">{loan.name}</p>
                          <p className="text-[9px] lg:text-[10px] text-slate-400 font-mono leading-none mt-1.5 uppercase tracking-widest">{loan.memberId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 lg:px-10 py-6 whitespace-nowrap">
                      <span className="text-sm font-medium text-natural-ink">{loan.loanType}</span>
                    </td>
                    <td className="px-6 lg:px-10 py-6 whitespace-nowrap">
                      <p className="text-base lg:text-lg font-black text-natural-ink font-display">₱{loan.principalAmount.toLocaleString()}</p>
                      <p className="text-[9px] lg:text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1.5">{loan.termMonths} Month Horizon</p>
                    </td>
                    <td className="px-6 lg:px-10 py-6">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-[9px] lg:text-[10px] font-black uppercase tracking-widest ${getStatusStyle(loan.status)} whitespace-nowrap`}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-6 lg:px-10 py-6 text-right">
                      <Link
                        to={`/loan/${loan._id}`}
                        className="bg-natural-bg border border-natural-line text-natural-ink text-[9px] lg:text-[10px] px-4 lg:px-6 py-3 rounded-xl font-bold uppercase tracking-widest hover:bg-natural-sidebar hover:text-white hover:border-natural-sidebar transition-all shadow-sm active:scale-95 inline-block whitespace-nowrap"
                      >
                        Execute Review
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
