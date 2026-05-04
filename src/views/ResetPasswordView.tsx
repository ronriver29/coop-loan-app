import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Lock, CheckCircle2, AlertCircle, ArrowLeft, Briefcase } from 'lucide-react';

export default function ResetPasswordView() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-natural-bg flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-[2rem] shadow-xl border border-natural-line text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-display font-black text-natural-ink mb-2">Invalid Request</h2>
          <p className="text-slate-500 mb-6 font-medium">This password reset link is invalid or missing a token.</p>
          <Link to="/login" className="text-natural-sage font-bold uppercase tracking-widest text-[10px] hover:underline">
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-natural-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 lg:p-12 rounded-[2rem] shadow-2xl border border-natural-line">
        <div className="flex items-center gap-2 mb-10">
          <div className="h-8 w-8 bg-natural-sidebar rounded flex items-center justify-center">
            <Briefcase className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-natural-sidebar">CoopLink</span>
        </div>

        {success ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="h-20 w-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-display font-black text-natural-ink mb-2">Password Reset!</h2>
            <p className="text-slate-500 font-medium mb-6">Your security credentials have been updated. Redirecting to login...</p>
            <Link 
              to="/login"
              className="inline-block bg-natural-sidebar text-white px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest"
            >
              Go to Login Now
            </Link>
          </motion.div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-display font-black text-natural-ink mb-2 tracking-tight">Set New Password</h2>
              <p className="text-slate-400 text-xs font-medium">Update your account credentials to regain access.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <input
                    required
                    type="password"
                    placeholder="••••••••"
                    className="organic-input pl-12"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <input
                    required
                    type="password"
                    placeholder="••••••••"
                    className="organic-input pl-12"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center gap-2 border border-red-100"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </motion.div>
              )}

              <button
                disabled={loading}
                type="submit"
                className="w-full bg-natural-sidebar text-white font-bold py-5 rounded-2xl hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50 mt-4 shadow-lg shadow-black/10 uppercase tracking-[0.3em] text-[10px]"
              >
                {loading ? 'Updating Credentials...' : 'Reset Password'}
              </button>

              <Link 
                to="/login"
                className="flex items-center justify-center gap-2 text-slate-400 font-bold uppercase tracking-widest text-[9px] hover:text-natural-ink transition-colors mt-6"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to Authentication
              </Link>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
