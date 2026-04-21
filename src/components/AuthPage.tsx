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

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isLogin ? { email: formData.email, password: formData.password } : formData)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (isLogin) {
        onLogin(data);
      } else {
        setIsLogin(true);
        setError('Registration successful. Please log in.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-natural-bg flex items-center justify-center p-4">
      <div className="max-w-[1000px] w-full grid md:grid-cols-2 bg-white rounded-xl overflow-hidden shadow-xl border border-natural-line">
        {/* Left Side: Branding */}
        <div className="bg-natural-sidebar p-12 text-natural-bg flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 bg-natural-sage rounded-full blur-3xl opacity-20" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 bg-natural-line rounded-full blur-3xl opacity-10" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-16">
              <div className="h-10 w-10 bg-natural-sage rounded flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight">CoopTrust v2</span>
            </div>

            <h1 className="text-4xl font-serif font-black leading-tight mb-8 italic">
              Empowering Members Through Responsible Financial Solutions.
            </h1>
            <p className="text-natural-bg/60 text-lg font-serif">
              A modern cooperative management platform designed for sustainability and mutual growth.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-3 gap-6 pt-12 border-t border-white/10 uppercase tracking-widest text-[10px] font-bold">
            <div>
              <p className="text-2xl font-black italic font-serif text-white">12%</p>
              <p className="text-white/40">Fixed APR</p>
            </div>
            <div>
              <p className="text-2xl font-black italic font-serif text-white">24h</p>
              <p className="text-white/40">Queue Time</p>
            </div>
            <div>
              <ShieldCheck className="h-8 w-8 text-natural-sage mb-1" />
              <p className="text-white/40">Audit Ready</p>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="p-12 bg-white">
          <div className="mb-12">
            <h2 className="text-3xl font-serif font-black text-natural-ink mb-3 italic">
              {isLogin ? 'Access Portal' : 'Join Cooperative'}
            </h2>
            <p className="text-gray-400 text-sm">
              {isLogin ? 'Enter your credentials to manage records' : 'Begin your financial membership today'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 text-left">
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Member ID</label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                      <input
                        required
                        type="text"
                        placeholder="M-0001"
                        className="w-full pl-10 pr-4 py-3 bg-natural-bg border border-natural-line rounded-lg focus:outline-none focus:ring-1 focus:ring-natural-sage focus:bg-white transition-all text-sm font-mono"
                        value={formData.memberId}
                        onChange={e => setFormData({ ...formData, memberId: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Legal Name</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                      <input
                        required
                        type="text"
                        placeholder="Juana Dela Cruz"
                        className="w-full pl-10 pr-4 py-3 bg-natural-bg border border-natural-line rounded-lg focus:outline-none focus:ring-1 focus:ring-natural-sage focus:bg-white transition-all text-sm"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Account Authority</label>
                  <select 
                    className="w-full px-4 py-3 bg-natural-bg border border-natural-line rounded-lg focus:outline-none focus:ring-1 focus:ring-natural-sage focus:bg-white transition-all text-sm font-bold uppercase tracking-widest"
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                  >
                    <option value="Member">General Member</option>
                    <option value="Admin">Administrator</option>
                  </select>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                <input
                  required
                  type="email"
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-natural-bg border border-natural-line rounded-lg focus:outline-none focus:ring-1 focus:ring-natural-sage focus:bg-white transition-all text-sm"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Secret Key</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                <input
                  required
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-natural-bg border border-natural-line rounded-lg focus:outline-none focus:ring-1 focus:ring-natural-sage focus:bg-white transition-all text-sm"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-widest rounded-lg flex items-center gap-2 border border-red-100"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-red-600" />
                {error}
              </motion.div>
            )}

            <button
              disabled={loading}
              type="submit"
              className="w-full bg-natural-sage text-white font-bold py-4 rounded-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 mt-4 shadow-md uppercase tracking-[0.2em] text-[11px]"
            >
              {loading ? 'Processing Transaction...' : (isLogin ? 'Establish Session' : 'Register Member')}
            </button>

            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="w-full py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-natural-sage transition-all"
            >
              {isLogin ? "Generate New Membership" : "Access Existing Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
