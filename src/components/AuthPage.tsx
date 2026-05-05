import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Briefcase, Mail, Lock, User as UserIcon, CreditCard, ShieldCheck, ArrowLeft } from 'lucide-react';
import { User } from '../types';

export default function AuthPage({ onLogin }: { onLogin: (user: User) => void }) {
  const [view, setView] = useState<'login' | 'forgot'>('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

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
    setSuccess('');

    if (view === 'login') {
      const endpoint = '/api/auth/login';
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email: formData.email, password: formData.password })
        });
        
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Identity verification failed.');
          onLogin(data);
        } else {
          const text = await res.text();
          console.error('Non-JSON response:', text);
          throw new Error(`Server Protocol Error: Received unexpected response type. Status: ${res.status}`);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    } else {
      try {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email })
        });
        
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Recovery request failed.');
          setSuccess(data.message);
        } else {
          throw new Error(`Server Protocol Error: Status ${res.status}`);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-natural-bg dark:bg-slate-950 flex items-center justify-center p-4 lg:p-8">
      <div className="max-w-[1000px] w-full grid lg:grid-cols-2 bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl border border-natural-line dark:border-white/5">
        {/* Left Side: Branding */}
        <div className="bg-natural-sidebar p-8 lg:p-12 text-natural-bg flex flex-col justify-between relative overflow-hidden min-h-[300px] lg:min-h-0">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 bg-natural-sage rounded-full blur-3xl opacity-20" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 bg-natural-line rounded-full blur-3xl opacity-10" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-16">
              <div className="h-10 w-10 bg-natural-sage rounded flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white">CoopLink</span>
            </div>

            <h1 className="text-2xl lg:text-4xl font-display font-black leading-tight mb-4 lg:mb-8 text-white">
              Empowering Members Through Responsible Financial Solutions.
            </h1>
            <p className="text-natural-bg/60 text-sm lg:text-lg font-sans opacity-80 text-white">
              A modern cooperative loan management platform designed for sustainability and mutual growth.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-3 gap-4 lg:gap-6 pt-8 lg:pt-12 border-t border-white/10 uppercase tracking-widest text-[8px] lg:text-[10px] font-bold">
            <div>
              <p className="text-xl lg:text-2xl font-black font-display text-white">LOW</p>
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
        <div className="p-8 lg:p-16 bg-white dark:bg-slate-900 flex flex-col justify-center">
          <div className="mb-10 lg:mb-14 text-left">
            <h2 className="text-2xl lg:text-4xl font-display font-black text-natural-ink dark:text-white mb-2 lg:mb-3 tracking-tight italic uppercase">
              {view === 'login' ? 'Access Portal' : 'Recovery Center'}
            </h2>
            <p className="text-slate-400 dark:text-slate-500 text-xs lg:text-sm font-medium italic">
              {view === 'login' ? 'Authenticating with the central ledger...' : 'Securing your institutional identity...'}
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

            {view === 'login' && (
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <label className="text-micro">Password</label>
                  <button 
                    type="button"
                    onClick={() => {
                      setView('forgot');
                      setError('');
                      setSuccess('');
                    }}
                    className="text-micro text-natural-sage hover:underline decoration-natural-sage/30 underline-offset-4"
                  >
                    Forgot Security Key?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <input
                    required={view === 'login'}
                    type="password"
                    placeholder="••••••••"
                    className="organic-input pl-12"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>
            )}

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

            {success && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-5 bg-natural-sage/10 text-natural-sage text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl flex items-center gap-3 border border-natural-sage/20"
              >
                <ShieldCheck className="h-4 w-4" />
                {success}
              </motion.div>
            )}

            <div className="space-y-4 pt-4">
              <button
                disabled={loading}
                type="submit"
                className="w-full bg-natural-sidebar dark:bg-natural-sage text-white font-bold py-5 rounded-2xl hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl shadow-black/10 uppercase tracking-[0.3em] text-[10px] italic"
              >
                {loading 
                  ? (view === 'login' ? 'Decrypting Access...' : 'Generating Token...') 
                  : (view === 'login' ? 'Log In' : 'Send Recovery Link')}
              </button>

              {view === 'forgot' && (
                <button
                  type="button"
                  onClick={() => {
                    setView('login');
                    setError('');
                    setSuccess('');
                  }}
                  className="w-full text-slate-400 dark:text-slate-500 font-bold py-2 text-[9px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:text-natural-ink dark:hover:text-white transition-colors"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Return to Portal
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
