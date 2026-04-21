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
    fetch('/api/loans')
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
    { label: 'Active Loans', value: (Array.isArray(loans) ? loans : []).filter(l => l.status === 'Disbursed').length, icon: Wallet, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Pending Apps', value: (Array.isArray(loans) ? loans : []).filter(l => l.status === 'Pending' || l.status === 'Under Evaluation').length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Total Principal', value: `₱${(Array.isArray(loans) ? loans : []).reduce((acc, l) => acc + (l.status === 'Disbursed' ? l.principalAmount : 0), 0).toLocaleString()}`, icon: ArrowUpRight, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-natural-pending-bg text-natural-pending-text';
      case 'Under Evaluation': return 'bg-natural-eval-bg text-natural-eval-text';
      case 'Approved': return 'bg-indigo-100 text-indigo-700';
      case 'Disbursed': return 'bg-emerald-100 text-emerald-700';
      case 'Rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-serif font-bold text-natural-ink">Welcome, {user.name}</h2>
          <p className="text-gray-500">Managing Cooperative Trust since 2024.</p>
        </div>
        {user.role === 'Member' && (
          <Link
            to="/apply"
            className="flex items-center gap-2 bg-natural-sage text-white px-5 py-3 rounded-lg font-bold hover:opacity-90 transition-all shadow-md"
          >
            <PlusCircle className="h-5 w-5" />
            Apply for Loan
          </Link>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-xl border border-natural-line shadow-sm flex flex-col items-center text-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">{stat.label}</span>
            <p className="text-2xl font-bold text-natural-ink italic font-serif">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Loan History Table */}
      <section className="bg-white rounded-xl shadow-sm border border-natural-line overflow-hidden">
        <div className="p-6 border-b border-natural-line flex items-center justify-between bg-gray-50">
          <h3 className="font-bold text-natural-ink flex items-center gap-2 uppercase text-xs tracking-widest">
            <Activity className="h-4 w-4 text-natural-sage" />
            Member Loan Ledger
          </h3>
          <button className="text-xs font-bold text-natural-sage hover:underline uppercase tracking-widest">Refresh Logs</button>
        </div>
        
        {loading ? (
          <div className="p-12 text-center text-gray-400 font-serif italic">Loading ledger records...</div>
        ) : loans.length === 0 ? (
          <div className="p-12 text-center">
            <div className="h-16 w-16 bg-natural-bg rounded-full flex items-center justify-center mx-auto mb-4">
              <PlusCircle className="h-8 w-8 text-natural-line" />
            </div>
            <p className="text-gray-500 font-serif italic">No loan records found in the ledger.</p>
          </div>
        ) : (
          <div className="overflow-x-auto text-left">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-natural-line">
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Reference</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Loan Product</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Principal</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-natural-line">
                {loans.map((loan) => (
                  <tr key={loan._id} className="hover:bg-natural-bg/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-natural-ink">{new Date(loan.createdAt).toLocaleDateString()}</div>
                      <div className="text-[10px] text-gray-400 font-mono">#{loan._id.slice(-6).toUpperCase()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-natural-ink">{loan.loanType}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-natural-ink">₱{loan.principalAmount.toLocaleString()}</div>
                      <div className="text-[10px] text-natural-sage underline font-bold uppercase tracking-tighter">12% Fixed Int.</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-[4px] text-[10px] font-bold uppercase tracking-widest ${getStatusStyle(loan.status)}`}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/loan/${loan._id}`}
                        className="bg-natural-sage text-white text-[10px] px-3 py-1.5 rounded font-bold uppercase tracking-widest hover:opacity-90 inline-block"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </motion.div>
  );
}
