import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Search, 
  Filter, 
  Eye, 
  Clock,
  ArrowRight,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  X,
  CreditCard
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Loan } from '../types';
import LoadingScreen from '../components/LoadingScreen';

export default function AdminQueueView() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [sortField, setSortField] = useState<'createdAt' | 'principalAmount'>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

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

  const loanTypes = ['All', ...new Set(loans.map(l => l.loanType))];

  const filteredLoans = (Array.isArray(loans) ? loans : [])
    .filter(l => {
      const matchStatus = statusFilter === 'All' || l.status === statusFilter;
      const matchSearch = l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         l.memberId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = typeFilter === 'All' || l.loanType === typeFilter;
      const matchMin = minAmount === '' || l.principalAmount >= Number(minAmount);
      const matchMax = maxAmount === '' || l.principalAmount <= Number(maxAmount);
      
      return matchStatus && matchSearch && matchType && matchMin && matchMax;
    })
    .sort((a, b) => {
      let valA = sortField === 'createdAt' ? new Date(a.createdAt).getTime() : a.principalAmount;
      let valB = sortField === 'createdAt' ? new Date(b.createdAt).getTime() : b.principalAmount;
      
      if (sortDirection === 'asc') return valA - valB;
      return valB - valA;
    });

  const toggleSort = (field: 'createdAt' | 'principalAmount') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('All');
    setMinAmount('');
    setMaxAmount('');
  };

  const activeFiltersCount = [
    searchTerm !== '',
    typeFilter !== 'All',
    minAmount !== '',
    maxAmount !== ''
  ].filter(Boolean).length;

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
      case 'Reviewed': return 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-800/30';
      case 'Approved': return 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/30';
      case 'Disbursed': return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/30';
      case 'Rejected': return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-800/30';
      case 'Closed': return 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700';
      case 'Delinquent': return 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/30 animate-pulse';
      default: return 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-700';
    }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-12"
    >
      <motion.div variants={item} className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="h-2 w-8 bg-natural-sage rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-natural-sage italic">Governance System</span>
          </div>
          <h2 className="text-4xl lg:text-6xl font-display font-black text-natural-ink dark:text-white tracking-tighter leading-none italic uppercase">
            Underwriting <span className="text-natural-sage opacity-50 dark:opacity-30">/</span> Queue
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm lg:text-lg font-medium opacity-80 max-w-xl italic">
            Reviewing and authenticating active credit applications within the cooperative network.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-natural-sage transition-colors" />
            <input 
              type="text"
              placeholder="Locate Credential..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 pr-4 py-4 bg-white dark:bg-slate-900 border border-natural-line dark:border-white/5 rounded-2xl text-[11px] font-black uppercase tracking-widest w-full sm:w-64 focus:outline-none focus:ring-4 focus:ring-natural-sage/5 transition-all shadow-sm italic placeholder:text-slate-300 dark:text-white"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`p-4 rounded-2xl border transition-all relative ${
              showFilters || activeFiltersCount > 0
              ? 'bg-natural-sidebar text-white border-natural-sidebar shadow-2xl shadow-natural-sidebar/20' 
              : 'bg-white dark:bg-slate-900 text-slate-600 border-natural-line dark:border-white/5 hover:bg-natural-bg'
            }`}
          >
            <Filter className="h-5 w-5" />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-natural-sage text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </motion.div>

      {showFilters && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="bg-white dark:bg-slate-900 border border-natural-line dark:border-white/5 rounded-[2rem] p-8 space-y-8 overflow-hidden shadow-2xl shadow-black/5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 italic">Asset Category</label>
              <select 
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full bg-natural-bg dark:bg-white/5 border border-natural-line dark:border-white/10 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest text-natural-ink dark:text-white focus:outline-none focus:ring-2 focus:ring-natural-sage/20 italic"
              >
                {loanTypes.map(type => (
                  <option key={type} value={type} className="bg-white dark:bg-slate-900">{type}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 italic">Min Value</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs uppercase italic">₱</span>
                <input 
                  type="number"
                  placeholder="0"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  className="w-full bg-natural-bg dark:bg-white/5 border border-natural-line dark:border-white/10 rounded-xl pl-8 pr-4 py-3 text-[10px] font-black tracking-widest text-natural-ink dark:text-white focus:outline-none italic"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 italic">Max Value</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs uppercase italic">₱</span>
                <input 
                  type="number"
                  placeholder="Infinity"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  className="w-full bg-natural-bg dark:bg-white/5 border border-natural-line dark:border-white/10 rounded-xl pl-8 pr-4 py-3 text-[10px] font-black tracking-widest text-natural-ink dark:text-white focus:outline-none italic"
                />
              </div>
            </div>

            <div className="flex items-end">
              <button 
                onClick={clearFilters}
                className="w-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 italic"
              >
                <X className="h-3 w-3" />
                Reset Parameters
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div 
        variants={item} 
        className="flex flex-wrap items-center gap-2 bg-white/40 dark:bg-white/[0.03] p-2 rounded-[2rem] border border-natural-line dark:border-white/5 backdrop-blur-md w-full sm:w-fit"
      >
        {['Pending', 'Under Evaluation', 'Reviewed', 'Approved', 'Disbursed', 'Delinquent', 'Closed', 'Rejected', 'All'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`flex-1 sm:flex-none px-6 py-3 rounded-[1.5rem] text-[9px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap italic ${
              statusFilter === s 
              ? 'bg-natural-sidebar text-white shadow-xl shadow-black/10' 
              : 'text-slate-400 hover:text-natural-ink hover:bg-natural-bg dark:hover:bg-white/5'
            }`}
          >
            {s}
          </button>
        ))}
      </motion.div>

      <motion.section variants={item} className="organic-card overflow-hidden border-none shadow-2xl shadow-black/5 dark:shadow-none">
        {filteredLoans.length === 0 ? (
          <div className="p-32 text-center bg-white dark:bg-slate-950">
            <div className="h-20 w-20 bg-natural-bg dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-natural-line dark:border-white/10">
              <Users className="h-10 w-10 text-slate-200 dark:text-white/10" />
            </div>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest italic">Protocol Queue Stabilized. No Active Tasks.</p>
            {activeFiltersCount > 0 && (
              <button 
                onClick={clearFilters}
                className="mt-6 text-natural-sage font-black text-[10px] uppercase tracking-widest hover:underline italic"
              >
                Flush Search Parameters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto bg-white dark:bg-slate-950">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FCFCFA] dark:bg-slate-900/30 border-b border-natural-line dark:border-white/5">
                  <th className="px-8 lg:px-12 py-6 text-micro !text-[9px] italic">Obligor Identity</th>
                  <th className="px-8 lg:px-12 py-6 text-micro !text-[9px] italic">Asset Class</th>
                  <th 
                    className="px-8 lg:px-12 py-6 text-micro !text-[9px] italic cursor-pointer group"
                    onClick={() => toggleSort('principalAmount')}
                  >
                    <div className="flex items-center gap-2">
                      Principal
                      {sortField === 'principalAmount' ? (
                        sortDirection === 'asc' ? <ChevronUp className="h-3 w-3 text-natural-sage" /> : <ChevronDown className="h-3 w-3 text-natural-sage" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-8 lg:px-12 py-6 text-micro !text-[9px] italic cursor-pointer group"
                    onClick={() => toggleSort('createdAt')}
                  >
                    <div className="flex items-center gap-2">
                      Entry Date
                      {sortField === 'createdAt' ? (
                        sortDirection === 'asc' ? <ChevronUp className="h-3 w-3 text-natural-sage" /> : <ChevronDown className="h-3 w-3 text-natural-sage" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </th>
                  <th className="px-8 lg:px-12 py-6 text-micro !text-[9px] italic text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-natural-line dark:divide-white/5">
                {filteredLoans.map((loan) => (
                  <tr key={loan._id} className="hover:bg-natural-bg/30 dark:hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 lg:px-12 py-8">
                      <div className="flex items-center gap-5">
                        <div className="h-10 w-10 lg:h-12 lg:w-12 bg-natural-sidebar text-white/50 rounded-2xl flex items-center justify-center font-black text-[10px] lg:text-[11px] uppercase tracking-tighter shadow-lg shrink-0 italic border border-white/5">
                          {loan.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs lg:text-sm font-black text-natural-ink dark:text-white truncate uppercase tracking-tight italic">{loan.name}</p>
                          <p className="text-[8px] lg:text-[9px] text-slate-400/60 font-mono leading-none mt-1.5 uppercase tracking-widest">{loan.memberId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 lg:px-12 py-8 whitespace-nowrap">
                      <div className="space-y-2">
                        <span className="text-[10px] font-black text-natural-ink dark:text-white block tracking-widest uppercase italic">{loan.loanType}</span>
                        <span className={`inline-flex items-center px-4 py-1.5 rounded-2xl text-[8px] font-black uppercase tracking-[0.2em] italic border ${getStatusStyle(loan.status)}`}>
                          {loan.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 lg:px-12 py-8 whitespace-nowrap">
                      <p className="text-xl font-black text-natural-ink dark:text-white font-display italic tracking-tighter leading-none">₱{loan.principalAmount.toLocaleString()}</p>
                      <p className="text-[8px] lg:text-[9px] text-slate-400/60 font-black uppercase tracking-widest mt-1.5 italic">{loan.termMonths} Cycles</p>
                    </td>
                    <td className="px-8 lg:px-12 py-8">
                      <p className="text-xs font-black text-natural-ink dark:text-white uppercase italic">{new Date(loan.createdAt).toLocaleDateString()}</p>
                      <p className="text-[8px] lg:text-[9px] text-slate-400 font-bold mt-1 tracking-widest uppercase">
                        {new Date(loan.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>
                    <td className="px-8 lg:px-12 py-8 text-right">
                      <Link
                        to={`/loan/${loan._id}`}
                        className="inline-flex items-center gap-2 bg-natural-sidebar text-white text-[9px] px-6 py-3 rounded-2xl font-black uppercase tracking-[0.2em] italic hover:scale-105 active:scale-95 transition-all shadow-xl shadow-natural-sidebar/10"
                      >
                        Execute Review <ArrowRight className="h-3 w-3" />
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
