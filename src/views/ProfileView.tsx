import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User as UserIcon, Mail, Lock, Shield, Save, Key, MapPin, Phone } from 'lucide-react';
import { User } from '../types';
import PSGCAddressSelectors from '../components/PSGCAddressSelectors';

export default function ProfileView({ user, onUpdate }: { user: User, onUpdate: (user: User) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email || '',
    contactNumber: user.contactNumber || '',
    region: user.region || '',
    province: user.province || '',
    city: user.city || '',
    barangay: user.barangay || '',
    streetAddress: user.streetAddress || '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          email: formData.email || undefined,
          contactNumber: formData.contactNumber,
          region: formData.region,
          province: formData.province,
          city: formData.city,
          barangay: formData.barangay,
          streetAddress: formData.streetAddress,
          password: formData.password || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      onUpdate(data);
      setSuccess('Profile updated successfully.');
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-12"
    >
      <motion.div variants={item}>
        <h2 className="text-3xl lg:text-4xl font-display font-black text-natural-ink tracking-tight">Identity Management</h2>
        <p className="text-slate-500 text-sm lg:text-base font-medium opacity-80 mt-1">Configure your personal credentials and communication preferences.</p>
      </motion.div>

      <div className="grid lg:grid-cols-[1fr_350px] gap-8 items-start">
        <motion.div variants={item}>
          <form onSubmit={handleSubmit} className="organic-card p-8 lg:p-12 space-y-12">
            <div className="space-y-10">
              <div className="space-y-3">
                <label className="text-micro">Full Legal Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                  <input
                    type="text"
                    className="organic-input pl-12 font-medium"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
                <div className="space-y-3">
                  <label className="text-micro">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                    <input
                      type="email"
                      placeholder="New email"
                      className="organic-input pl-12 font-medium"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-micro">Contact Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                    <input
                      type="tel"
                      className="organic-input pl-12 font-medium"
                      value={formData.contactNumber}
                      onChange={e => setFormData({ ...formData, contactNumber: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6 pt-6 border-t border-natural-line">
              <h3 className="text-sm font-bold text-natural-ink uppercase tracking-widest mb-4 flex items-center gap-3">
                <MapPin className="h-4 w-4 text-natural-sage" />
                PSGC Location Details
              </h3>
              
              <PSGCAddressSelectors 
                initialValues={{
                  region: user.region,
                  province: user.province,
                  city: user.city,
                  barangay: user.barangay
                }}
                onChange={(vals) => setFormData({ ...formData, ...vals })}
              />

              <div className="space-y-3">
                <label className="text-micro">Street Address / Building / Unit</label>
                <input
                  type="text"
                  className="organic-input font-medium"
                  value={formData.streetAddress}
                  onChange={e => setFormData({ ...formData, streetAddress: e.target.value })}
                />
              </div>
            </div>

            <div className="pt-8 border-t border-natural-line">
              <h3 className="text-sm font-bold text-natural-ink uppercase tracking-widest mb-8 flex items-center gap-3">
                <Key className="h-4 w-4 text-natural-sage" />
                Security Credentials
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-micro">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="organic-input pl-12"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-micro">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="organic-input pl-12"
                      value={formData.confirmPassword}
                      onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-5 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl flex items-center gap-3 border border-red-100">
                <div className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
                {error}
              </div>
            )}

            {success && (
              <div className="p-5 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl flex items-center gap-3 border border-emerald-100">
                <div className="h-2 w-2 rounded-full bg-emerald-600" />
                {success}
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button
                disabled={loading}
                type="submit"
                className="bg-natural-sidebar text-white font-bold px-10 py-5 rounded-2xl hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl shadow-black/10 uppercase tracking-[0.3em] text-[10px] flex items-center gap-3"
              >
                <Save className="h-4 w-4" />
                {loading ? 'Committing Changes...' : 'Synchronize Profile'}
              </button>
            </div>
          </form>
        </motion.div>

        <motion.div variants={item} className="space-y-6">
          <div className="organic-card p-8 bg-natural-sidebar text-white border-none shadow-2xl shadow-black/20">
            <div className="h-16 w-16 rounded-[2rem] bg-natural-sage/20 border border-natural-sage/40 flex items-center justify-center text-xl font-black text-natural-sage mb-6">
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
            <p className="text-micro text-white/40 mb-1">Authenticated Member</p>
            <h4 className="text-xl font-display font-black truncate">{user.name}</h4>
            <div className="mt-8 pt-8 border-t border-white/10 space-y-4">
              <div className="flex justify-between items-center text-micro">
                <span className="text-white/40">Role Proxy</span>
                <span className="text-natural-sage">{user.role}</span>
              </div>
              <div className="flex justify-between items-center text-micro">
                <span className="text-white/40">Member ID</span>
                <span className="font-mono">{user.memberId}</span>
              </div>
              <div className="flex justify-between items-center text-micro">
                <span className="text-white/40">Contact</span>
                <span className="font-mono">{user.contactNumber || 'Not Set'}</span>
              </div>
              {user.city && user.province && (
                <div className="flex justify-between items-start text-micro">
                  <span className="text-white/40 shrink-0">Jurisdiction</span>
                  <span className="text-right ml-4">{user.city}, {user.province}</span>
                </div>
              )}
            </div>
          </div>

          <div className="organic-card p-8 bg-slate-100 border-none">
            <h4 className="text-micro text-natural-ink mb-4 flex items-center gap-3">
              <Shield className="h-4 w-4 text-natural-sage" />
              Security Protocol
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
              Updating your credentials will regenerate your session token. You may be required to re-authenticate periodically to maintain archival integrity.
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
