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
  Store
} from 'lucide-react';
import { User } from '../types';

export default function LoanApplicationView({ user }: { user: User }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    loanType: 'Providential',
    principalAmount: 50000,
    termMonths: 12,
  });

  const loanTypes = [
    { id: 'Emergency', icon: Zap, theme: 'indigo', desc: 'Medical emergencies, urgent repairs' },
    { id: 'Providential', icon: ShieldCheck, theme: 'emerald', desc: 'Household needs, appliances' },
    { id: 'Educational', icon: GraduationCap, theme: 'amber', desc: 'Tuition fees, school supplies' },
    { id: 'Business', icon: Store, theme: 'rose', desc: 'Small business capital, inventory' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) navigate('/');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Monthly breakdown for preview
  const r = 0.12 / 12;
  const n = formData.termMonths;
  const P = formData.principalAmount;
  const M = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-serif font-bold text-natural-ink">New Loan Application</h2>
          <p className="text-gray-500">Managing Cooperative Trust since 2024.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-[1.5fr_1fr] gap-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-natural-line shadow-sm p-10 space-y-8">
          <div className="space-y-4 text-left">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] block">Loan Product Selection</label>
            <div className="grid grid-cols-2 gap-4">
              {loanTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, loanType: type.id })}
                  className={`flex flex-col items-start p-4 border rounded-lg text-left transition-all ${
                    formData.loanType === type.id 
                    ? 'border-natural-sage bg-natural-sage/10 ring-1 ring-natural-sage' 
                    : 'border-natural-line hover:border-natural-sage/50'
                  }`}
                >
                  <type.icon className={`h-5 w-5 mb-2 ${formData.loanType === type.id ? 'text-natural-sage' : 'text-gray-400'}`} />
                  <p className={`font-bold text-sm ${formData.loanType === type.id ? 'text-natural-ink' : 'text-gray-600'}`}>{type.id}</p>
                  <p className="text-[10px] text-gray-400 leading-tight mt-1">{type.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] block">Principal Amount</label>
              <span className="text-2xl font-black text-natural-ink italic font-serif">₱{formData.principalAmount.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="1000"
              max="500000"
              step="1000"
              className="w-full h-1.5 bg-natural-bg rounded-lg appearance-none cursor-pointer accent-natural-sage"
              value={formData.principalAmount}
              onChange={(e) => setFormData({ ...formData, principalAmount: parseInt(e.target.value) })}
            />
          </div>

          <div className="space-y-4 text-left">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] block">Repayment Term (Months)</label>
            <div className="grid grid-cols-4 gap-2">
              {[6, 12, 18, 24].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setFormData({ ...formData, termMonths: m })}
                  className={`py-3 rounded-lg font-bold text-xs uppercase tracking-widest transition-all ${
                    formData.termMonths === m 
                    ? 'bg-natural-sage text-white shadow-md' 
                    : 'bg-natural-bg text-gray-400 hover:bg-natural-line'
                  }`}
                >
                  {m} Months
                </button>
              ))}
            </div>
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full bg-natural-sage text-white font-bold py-4 rounded-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 mt-8 shadow-md flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
          >
            {loading ? 'Processing...' : 'Submit Application'}
          </button>
        </form>

        <div className="space-y-6">
          <div className="bg-natural-sidebar rounded-xl p-8 text-natural-bg shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-12 -mt-12 h-32 w-32 bg-natural-sage rounded-full blur-3xl opacity-20" />
            
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-10 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Calculated Annuity
            </h3>
            
            <div className="space-y-10 relative z-10">
              <div>
                <p className="text-[10px] uppercase font-bold text-white/50 tracking-widest mb-2">Estimated Monthly Payment</p>
                <p className="text-4xl font-black italic font-serif">₱{M.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>

              <div className="space-y-4 pt-8 border-t border-white/10 uppercase tracking-widest text-[10px] font-bold">
                <div className="flex justify-between items-center text-white/40">
                  <span>Policy Rate</span>
                  <span className="text-white">12.0% P.A.</span>
                </div>
                <div className="flex justify-between items-center text-white/40">
                  <span>Interest Cost</span>
                  <span className="text-white">₱{(M * n - P).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-white/40">
                  <span>Total Liability</span>
                  <span className="text-white">₱{(M * n).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="stat-card p-6 bg-natural-bg border-natural-line rounded-xl border flex items-start gap-4 shadow-sm">
            <div className="h-10 w-10 bg-white rounded flex items-center justify-center shrink-0 border border-natural-line">
              <ShieldCheck className="h-5 w-5 text-natural-sage" />
            </div>
            <div>
              <h4 className="font-bold text-natural-ink text-sm mb-1 uppercase tracking-widest">RA 10173 Compliance</h4>
              <p className="text-[10px] text-gray-500 leading-relaxed font-serif italic">
                Your data is managed under strict privacy guidelines. Encryption active for all financial identifiers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
