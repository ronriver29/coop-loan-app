import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Briefcase, Mail, Lock, User as UserIcon, CreditCard, ShieldCheck } from 'lucide-react';
import { User } from '../types';

export default function AuthPage({ onLogin }: { onLogin: (user: User) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    memberId: '',
    name: '',
    email: '',
    password: '',
    role: 'Member' as 'Member' | 'Admin'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = '/api/auth/login';
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: formData.email, password: formData.password })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      onLogin(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-natural-bg flex items-center justify-center p-4 lg:p-8">
      <div className="max-w-[1000px] w-full grid lg:grid-cols-2 bg-white rounded-[2rem] overflow-hidden shadow-2xl border border-natural-line">
        {/* Left Side: Branding */}
        <div className="bg-natural-sidebar p-8 lg:p-12 text-natural-bg flex flex-col justify-between relative overflow-hidden min-h-[300px] lg:min-h-0">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 bg-natural-sage rounded-full blur-3xl opacity-20" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 bg-natural-line rounded-full blur-3xl opacity-10" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-16">
              <div className="h-10 w-10 bg-natural-sage rounded flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight">CoopTrust v2</span>
            </div>

            <h1 className="text-2xl lg:text-4xl font-display font-black leading-tight mb-4 lg:mb-8">
              Empowering Members Through Responsible Financial Solutions.
            </h1>
            <p className="text-natural-bg/60 text-sm lg:text-lg font-sans opacity-80">
              A modern cooperative management platform designed for sustainability and mutual growth.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-3 gap-4 lg:gap-6 pt-8 lg:pt-12 border-t border-white/10 uppercase tracking-widest text-[8px] lg:text-[10px] font-bold">
            <div>
              <p className="text-xl lg:text-2xl font-black font-display text-white">12%</p>
              <p className="text-white/40">Fixed APR</p>
            </div>
            <div>
              <p className="text-xl lg:text-2xl font-black font-display text-white">24h</p>
              <p className="text-white/40">Queue Time</p>
            </div>
            <div>
              <ShieldCheck className="h-6 w-6 lg:h-8 lg:w-8 text-natural-sage mb-1" />
              <p className="text-white/40">Audit Ready</p>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="p-8 lg:p-16 bg-white flex flex-col justify-center">
          <div className="mb-10 lg:mb-14 text-left">
            <h2 className="text-2xl lg:text-4xl font-display font-black text-natural-ink mb-2 lg:mb-3 tracking-tight">
              Access Portal
            </h2>
            <p className="text-slate-400 text-xs lg:text-sm font-medium">
              Authenticating with the central ledger...
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 lg:space-y-8 text-left">
            <div className="space-y-2.5">
              <label className="text-micro">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                <input
                  required
                  type="email"
                  placeholder="name@example.com"
                  className="organic-input pl-12 font-medium"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="text-micro">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                <input
                  required
                  type="password"
                  placeholder="••••••••"
                  className="organic-input pl-12"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-5 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl flex items-center gap-3 border border-red-100"
              >
                <div className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
                {error}
              </motion.div>
            )}

            <button
              disabled={loading}
              type="submit"
              className="w-full bg-natural-sidebar text-white font-bold py-5 rounded-2xl hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50 mt-6 shadow-xl shadow-black/10 uppercase tracking-[0.3em] text-[10px]"
            >
              {loading ? 'Decrypting Access...' : 'Log In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
