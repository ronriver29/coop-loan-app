import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  PlusCircle, 
  ChevronRight, 
  Info, 
  HelpCircle,
  ShieldCheck,
  Zap,
  TrendingDown,
  GraduationCap,
  Store,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { User } from '../types';

export default function LoanApplicationView({ user }: { user: User }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    loanType: 'Providential',
    principalAmount: 50000,
    termMonths: 12,
  });

  const loanTypes = [
    { id: 'Emergency', icon: Zap, desc: 'Medical emergencies, urgent repairs' },
    { id: 'Providential', icon: ShieldCheck, desc: 'Household needs, appliances' },
    { id: 'Educational', icon: GraduationCap, desc: 'Tuition fees, school supplies' },
    { id: 'Business', icon: Store, desc: 'Small business capital, inventory' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    setError('');
    
    try {
      console.log('🚀 Initiating loan application submission:', formData);
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        console.log('✅ Application committed to ledger:', data._id);
        navigate('/');
      } else {
        console.error('❌ Server-side rejection:', data.error);
        setError(data.error || 'The institutional ledger rejected this entry. Check credentials.');
      }
    } catch (err: any) {
      console.error('❌ Communication failure:', err);
      setError('Communication trace interrupted. Please verify database availability or network status.');
    } finally {
      setLoading(false);
    }
  };

  // Monthly breakdown for preview
  const r = 0.12 / 12;
  const n = formData.termMonths;
  const P = formData.principalAmount;
  const M = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, x: 20 },
    show: { opacity: 1, x: 0 }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-5xl mx-auto space-y-12"
    >
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl lg:text-4xl font-display font-black text-natural-ink tracking-tight">Financial Application</h2>
          <p className="text-slate-500 text-sm lg:text-base font-medium opacity-80 mt-1">Configure your credit terms below with institutional precision.</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 lg:gap-12 items-start">
        <motion.form 
          variants={item}
          onSubmit={handleSubmit} 
          className="organic-card p-6 sm:p-8 lg:p-12 space-y-10"
        >
          <div className="space-y-6 text-left">
            <label className="text-micro block">Program Selection</label>
            {error && (
              <div className="p-5 bg-red-50 text-red-600 rounded-2xl text-[10px] font-bold uppercase tracking-widest border border-red-100 flex items-center gap-3">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
              {loanTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, loanType: type.id })}
                  className={`flex flex-col items-start p-6 rounded-2xl text-left transition-all group ${
                    formData.loanType === type.id 
                    ? 'bg-natural-sidebar text-white shadow-lg' 
                    : 'bg-natural-bg text-natural-ink hover:bg-natural-line/50 border border-natural-line'
                  }`}
                >
                  <type.icon className={`h-6 w-6 mb-4 transition-colors ${formData.loanType === type.id ? 'text-white' : 'text-slate-400 group-hover:text-natural-sage'}`} />
                  <p className={`font-bold text-sm uppercase tracking-widest ${formData.loanType === type.id ? 'text-white' : 'text-natural-ink'}`}>{type.id}</p>
                  <p className={`text-[10px] leading-relaxed mt-2 font-medium opacity-60 ${formData.loanType === type.id ? 'text-white' : 'text-slate-500'}`}>{type.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <label className="text-micro">Calculated Principal</label>
              <span className="text-2xl lg:text-3xl font-black text-natural-ink font-display">₱{formData.principalAmount.toLocaleString()}</span>
            </div>
            <div className="relative pt-2">
              <input
                type="range"
                min="1000"
                max="500000"
                step="1000"
                className="w-full h-1.5 bg-natural-bg rounded-lg appearance-none cursor-pointer accent-natural-sage"
                value={formData.principalAmount}
                onChange={(e) => setFormData({ ...formData, principalAmount: parseInt(e.target.value) })}
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-bold tracking-widest mt-4">
                <span>MIN: ₱1,000</span>
                <span>MAX: ₱500,000</span>
              </div>
            </div>
          </div>

          <div className="space-y-6 text-left">
            <label className="text-micro block">Maturity Horizon</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[6, 12, 18, 24].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setFormData({ ...formData, termMonths: m })}
                  className={`py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${
                    formData.termMonths === m 
                    ? 'bg-natural-sage text-white shadow-md' 
                    : 'bg-natural-bg text-natural-ink hover:bg-slate-200/50 border border-natural-line'
                  }`}
                >
                  {m} Mo.
                </button>
              ))}
            </div>
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full bg-natural-sidebar text-white font-bold py-5 rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl shadow-black/10 flex items-center justify-center gap-3 uppercase tracking-[0.3em] text-[10px]"
          >
            {loading ? 'Processing Request...' : 'Commit to Ledger'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </motion.form>

        <motion.div variants={item} className="space-y-8 lg:sticky lg:top-24">
          <div className="organic-card bg-natural-sidebar text-white p-8 lg:p-10 border-none relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-12 -mt-12 h-40 w-40 bg-natural-sage rounded-full blur-3xl opacity-10" />
            
            <h3 className="text-micro text-white/30 mb-8 lg:mb-12 flex items-center gap-2">
              <Zap className="h-4 w-4 text-natural-sage" />
              Pro-forma Estimates
            </h3>
            
            <div className="space-y-8 lg:space-y-12 relative z-10">
              <div>
                <p className="text-micro text-white/40 mb-3">Target Annuity</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl lg:text-4xl font-display font-black">₱{M.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  <span className="text-[10px] lg:text-xs text-white/30 font-medium lowercase italic">/mo</span>
                </div>
              </div>

              <div className="space-y-5 pt-10 border-t border-white/5 font-medium text-sm">
                <div className="flex justify-between items-center text-white/40">
                  <span className="text-micro font-bold">Standard Levy</span>
                  <span className="text-natural-sage font-bold">12.0%</span>
                </div>
                <div className="flex justify-between items-center text-white/40">
                  <span className="text-micro font-bold">Accrued Interest</span>
                  <span className="text-white">₱{(M * n - P).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-white/40 pt-4 border-t border-white/5">
                  <span className="text-micro font-bold text-white/60">Aggregate Exposure</span>
                  <span className="text-2xl font-black text-white font-display">₱{(M * n).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="organic-card p-8 bg-slate-100 border-none flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-sm">
              <ShieldCheck className="h-6 w-6 text-natural-sage" />
            </div>
            <div>
              <h4 className="font-bold text-natural-ink text-xs uppercase tracking-widest mb-2 font-sans ">CDA Compliance Verified</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                Application data is subject to RA 10173 standards. All computations are non-binding until formal underwriting.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
