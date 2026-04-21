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

  const filteredLoans = (Array.isArray(loans) ? loans : []).filter(l => l.status === filter || filter === 'All');

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
          <h2 className="text-3xl font-serif font-bold text-natural-ink">Loan Approval Queue</h2>
          <p className="text-gray-500">Reviewing pending applications for the current cycle.</p>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-natural-line shadow-sm">
        {['Pending', 'Under Evaluation', 'Approved', 'Disbursed', 'Rejected', 'All'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
              filter === s 
              ? 'bg-natural-sidebar text-white shadow-md' 
              : 'text-gray-500 hover:bg-natural-bg'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <section className="bg-white rounded-xl shadow-sm border border-natural-line overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 font-serif italic">Loading application queue...</div>
        ) : filteredLoans.length === 0 ? (
          <div className="p-12 text-center text-gray-400 font-serif italic">No applications found in this category.</div>
        ) : (
          <div className="overflow-x-auto text-left">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-natural-line">
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Member Details</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Loan Type</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Principal</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-natural-line">
                {filteredLoans.map((loan) => (
                  <tr key={loan._id} className="hover:bg-natural-bg/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-natural-bg text-natural-ink rounded flex items-center justify-center font-bold text-xs uppercase tracking-tighter border border-natural-line">
                          {loan.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-natural-ink">{loan.name}</p>
                          <p className="text-[10px] text-gray-400 font-mono leading-none mt-1 uppercase tracking-widest">ID: {loan.memberId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-natural-ink">{loan.loanType}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-natural-ink">₱{loan.principalAmount.toLocaleString()}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">{loan.termMonths} Months</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-[4px] text-[10px] font-black uppercase tracking-widest ${getStatusStyle(loan.status)}`}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/loan/${loan._id}`}
                        className="bg-natural-sage text-white text-[10px] px-4 py-2 rounded font-bold uppercase tracking-widest hover:opacity-90 inline-block transition-all"
                      >
                        Review Application
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
