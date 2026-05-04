import React, { useState, useEffect } from 'react';
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
  ArrowRight,
  Home,
  Heart,
  Bus,
  ShoppingBag,
  Briefcase,
  Wrench
} from 'lucide-react';
import { User } from '../types';
import LoadingScreen from '../components/LoadingScreen';

const iconMap: Record<string, any> = {
  Zap,
  ShieldCheck,
  GraduationCap,
  Store,
  Home,
  Heart,
  Bus,
  ShoppingBag,
  Briefcase,
  Wrench,
  Info
};

export default function LoanApplicationView({ user }: { user: User }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [typesLoading, setTypesLoading] = useState(true);
  const [error, setError] = useState('');
  const [loanTypes, setLoanTypes] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    loanType: '',
    principalAmount: 50000,
    termMonths: 12,
  });

  const selectedType = loanTypes.find(t => t.name === formData.loanType);

  useEffect(() => {
    const startTime = Date.now();
    setTypesLoading(true);
    fetch('/api/loan-types')
      .then(res => res.json())
      .then(data => {
        const activeTypes = (Array.isArray(data) ? data : []).filter((t: any) => t.isActive);
        setLoanTypes(activeTypes);
        if (activeTypes.length > 0) {
          setFormData(prev => ({ 
            ...prev, 
            loanType: activeTypes[0].name,
            termMonths: activeTypes[0].allowedTerms?.[0] || 12
          }));
        }
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to fetch loan programs.');
      })
      .finally(() => {
        const elapsed = Date.now() - startTime;
        const minimumDelay = 2500;
        const remaining = Math.max(0, minimumDelay - elapsed);
        setTimeout(() => setTypesLoading(false), remaining);
      });
  }, []);

  // Update default term if selected type changes and current term is invalid
  useEffect(() => {
    if (selectedType && selectedType.allowedTerms) {
      if (!selectedType.allowedTerms.includes(formData.termMonths)) {
        setFormData(prev => ({ ...prev, termMonths: selectedType.allowedTerms[0] }));
      }
    }
  }, [formData.loanType, selectedType]);

  if (typesLoading) return <LoadingScreen />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    setError('');

    // Client-side validation
    if (!formData.loanType) {
      setError('Please select a loan program.');
      setLoading(false);
      return;
    }

    if (formData.principalAmount < 1000 || formData.principalAmount > 500000) {
      setError('Principal amount must be between ₱1,000 and ₱500,000.');
      setLoading(false);
      return;
    }

    if (selectedType && selectedType.allowedTerms && !selectedType.allowedTerms.includes(formData.termMonths)) {
      setError('Selected term is not valid for this loan program.');
      setLoading(false);
      return;
    }
    
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
  const annualRate = selectedType?.interestRate || 0.12;
  const r = annualRate / 12;
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
          <h2 className="text-3xl lg:text-4xl font-display font-black text-natural-ink dark:text-white tracking-tight italic uppercase">Financial Application</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm lg:text-base font-medium opacity-80 mt-1 italic">Configure your credit terms below with institutional precision.</p>
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
              {typesLoading ? (
                <div className="col-span-full py-10 text-center animate-pulse text-micro">Syncing catalog...</div>
              ) : loanTypes.map((type) => {
                const Icon = iconMap[type.icon] || Info;
                return (
                  <button
                    key={type._id}
                    type="button"
                    onClick={() => setFormData({ ...formData, loanType: type.name })}
                    className={`flex flex-col items-start p-6 rounded-2xl text-left transition-all group ${
                      formData.loanType === type.name 
                      ? 'bg-natural-sidebar dark:bg-natural-sage text-white shadow-lg' 
                      : 'bg-natural-bg dark:bg-white/5 text-natural-ink dark:text-white hover:bg-natural-line/50 dark:hover:bg-white/10 border border-natural-line dark:border-white/10'
                    }`}
                  >
                    <Icon className={`h-6 w-6 mb-4 transition-colors ${formData.loanType === type.name ? 'text-white' : 'text-slate-400 group-hover:text-natural-sage'}`} />
                    <p className={`font-bold text-sm uppercase tracking-widest ${formData.loanType === type.name ? 'text-white' : 'text-natural-ink dark:text-white'}`}>{type.name}</p>
                    <p className={`text-[10px] leading-relaxed mt-2 font-medium opacity-60 ${formData.loanType === type.name ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>{type.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <label className="text-micro">Calculated Principal</label>
              <span className="text-2xl lg:text-3xl font-black text-natural-ink dark:text-white font-display">₱{formData.principalAmount.toLocaleString()}</span>
            </div>
            <div className="relative pt-2">
              <input
                type="range"
                min="1000"
                max="500000"
                step="1000"
                className="w-full h-1.5 bg-natural-bg dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-natural-sage"
                value={formData.principalAmount}
                onChange={(e) => setFormData({ ...formData, principalAmount: parseInt(e.target.value) })}
              />
              <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-bold tracking-widest mt-4">
                <span>MIN: ₱1,000</span>
                <span>MAX: ₱500,000</span>
              </div>
            </div>
          </div>

          <div className="space-y-6 text-left">
            <label className="text-micro block">Maturity Horizon</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {(selectedType?.allowedTerms || [6, 12, 18, 24]).map((m: number) => (
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
                <p className="text-micro text-white/40 mb-3 uppercase tracking-widest">Calculated Monthly Installment</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl lg:text-5xl font-display font-black italic">₱{M.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  <span className="text-[10px] lg:text-xs text-white/30 font-bold uppercase italic ml-2">/ month</span>
                </div>
              </div>

              <div className="space-y-6 pt-10 border-t border-white/5">
                <div className="flex justify-between items-center">
                  <span className="text-micro font-bold text-white/40 uppercase tracking-widest">Rate (Annual)</span>
                  <span className="text-natural-sage font-black bg-natural-sage/10 px-3 py-1 rounded-lg border border-natural-sage/20 italic">{(annualRate * 100).toFixed(1)}% APR</span>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-white/40">
                    <span className="text-micro font-bold uppercase tracking-widest">Interest Accrual</span>
                    <span className="text-white font-bold">₱{(M * n - P).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  
                  {/* Visual Breakdown */}
                  <div className="space-y-3">
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden flex shadow-inner">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(P / (M * n)) * 100}%` }}
                        className="h-full bg-white/40"
                      />
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${((M * n - P) / (M * n)) * 100}%` }}
                        className="h-full bg-natural-sage"
                      />
                    </div>
                    <div className="flex justify-between text-[8px] font-black uppercase tracking-[0.2em] text-white/20">
                      <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-white/40" /> Principal: {((P / (M * n)) * 100).toFixed(0)}%</span>
                      <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-natural-sage" /> Interest: {(((M * n - P) / (M * n)) * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-white/10 flex flex-col gap-1">
                  <span className="text-micro font-black text-white/20 uppercase tracking-[0.3em] italic mb-1 text-center">Total Financial Maturity</span>
                  <div className="text-center">
                    <span className="text-4xl lg:text-5xl font-black text-white font-display italic tracking-tight">₱{(M * n).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="organic-card p-8 bg-slate-100 dark:bg-white/5 border-none flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center shrink-0 shadow-sm">
              <ShieldCheck className="h-6 w-6 text-natural-sage" />
            </div>
            <div>
              <h4 className="font-bold text-natural-ink dark:text-white text-xs uppercase tracking-widest mb-2 font-sans italic">CDA Compliance Verified</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Application data is subject to RA 10173 standards. All computations are non-binding until formal underwriting.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
