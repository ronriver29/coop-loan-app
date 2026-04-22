import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserPlus, Mail, Lock, User as UserIcon, CreditCard, ShieldCheck, MapPin, Phone, ListChecks, Check } from 'lucide-react';
import PSGCAddressSelectors from '../components/PSGCAddressSelectors';
import MembersListView from './MembersListView';

export default function AdminMembersView() {
  const [activeTab, setActiveTab] = useState<'generate' | 'list'>('generate');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    memberId: '',
    name: '',
    email: '',
    contactNumber: '',
    region: '',
    province: '',
    city: '',
    barangay: '',
    streetAddress: '',
    password: '',
    role: 'Regular Member' as 'Regular Member' | 'Associate Member' | 'System Administrator' | 'Evaluator' | 'Reviewer' | 'Approver' | 'Disbursement'
  });

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const [generatedPassword, setGeneratedPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    const password = generatePassword();

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...formData, password })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setGeneratedPassword(password);
      setSuccess('Account generated successfully.');
      setFormData({
        memberId: '',
        name: '',
        email: '',
        contactNumber: '',
        region: '',
        province: '',
        city: '',
        barangay: '',
        streetAddress: '',
        password: '',
        role: 'Regular Member'
      });
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
      className="space-y-10"
    >
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl lg:text-4xl font-display font-black text-natural-ink tracking-tight">Archives & Access</h2>
          <p className="text-slate-500 text-sm lg:text-base font-medium opacity-80 mt-1">Manage institutional membership records and credentials.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-natural-line w-fit self-start md:self-end">
          <button 
            onClick={() => setActiveTab('generate')}
            className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'generate' 
              ? 'bg-white text-natural-ink shadow-lg shadow-black/5' 
              : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <UserPlus className="h-4 w-4" />
            Generation
          </button>
          <button 
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'list' 
              ? 'bg-white text-natural-ink shadow-lg shadow-black/5' 
              : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <ListChecks className="h-4 w-4" />
            Registry List
          </button>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {activeTab === 'generate' ? (
          <motion.div 
            key="generate"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="max-w-2xl mx-auto w-full"
          >
            <form onSubmit={handleSubmit} className="organic-card p-8 lg:p-12 space-y-12 text-left">
              <div className="space-y-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-micro">Member Serial</label>
                    <div className="relative">
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                      <input
                        required
                        type="text"
                        placeholder="M-0001"
                        className="organic-input pl-12 font-mono text-xs tracking-wider"
                        value={formData.memberId}
                        onChange={e => setFormData({ ...formData, memberId: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-micro">Legal Identity</label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                      <input
                        required
                        type="text"
                        placeholder="Juana Dela Cruz"
                        className="organic-input pl-12 font-medium"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-micro block">Permission Tier</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 pointer-events-none" />
                    <select 
                      className="organic-input pl-12 appearance-none bg-no-repeat bg-[right_1rem_center] cursor-pointer font-medium"
                      value={formData.role}
                      onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                    >
                      <option value="Regular Member">Regular Member</option>
                      <option value="Associate Member">Associate Member</option>
                      <option value="System Administrator">System Administrator</option>
                      <option value="Evaluator">Evaluator</option>
                      <option value="Reviewer">Reviewer</option>
                      <option value="Approver">Approver</option>
                      <option value="Disbursement">Disbursement</option>

                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-micro">Email Address</label>
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
                  <div className="space-y-3">
                    <label className="text-micro">Contact Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                      <input
                        required
                        type="tel"
                        placeholder="09XX XXX XXXX"
                        className="organic-input pl-12 font-medium"
                        value={formData.contactNumber}
                        onChange={e => setFormData({ ...formData, contactNumber: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-8 pt-8 border-t border-natural-line">
                <h3 className="text-[10px] font-black text-natural-ink uppercase tracking-[0.3em] flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-natural-sage" />
                  PSGC Geolocation
                </h3>
                
                <PSGCAddressSelectors 
                  onChange={(vals) => setFormData({ ...formData, ...vals })}
                />

                <div className="space-y-3">
                  <label className="text-micro">Street / Unit / Bldg</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. 123 Heritage St."
                    className="organic-input font-medium"
                    value={formData.streetAddress}
                    onChange={e => setFormData({ ...formData, streetAddress: e.target.value })}
                  />
                </div>
              </div>

              {success ? (
                <div className="p-8 bg-emerald-50 rounded-3xl border border-emerald-100 space-y-4">
                  <div className="flex items-center gap-3 text-emerald-600">
                    <Check className="h-5 w-5" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{success}</span>
                  </div>
                  <div className="p-6 bg-white rounded-2xl border border-emerald-100/50 text-center">
                    <p className="text-micro text-slate-400 mb-2 uppercase">Initial Access Token</p>
                    <p className="text-2xl font-mono font-black text-natural-ink tracking-widest select-all">{generatedPassword}</p>
                  </div>
                  <p className="text-[10px] text-emerald-600/60 font-medium italic text-center">Please provide this token to the member. It will not be shown again.</p>
                </div>
              ) : (
                <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 space-y-3">
                  <h3 className="text-[10px] font-black text-natural-ink uppercase tracking-[0.3em] flex items-center gap-3">
                    <Lock className="h-4 w-4 text-natural-sage" />
                    Security Protocol
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    A secure, high-entropy access token will be automatically generated upon record commitment. 
                    This token must be rotated by the member during their initial authentication sequence.
                  </p>
                </div>
              )}

              {error && (
                <div className="p-5 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl flex items-center gap-3 border border-red-100">
                  <div className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
                  {error}
                </div>
              )}

              <button
                disabled={loading}
                type="submit"
                className="w-full bg-natural-sidebar text-white font-bold py-5 rounded-2xl hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50 mt-6 shadow-xl shadow-black/10 uppercase tracking-[0.3em] text-[10px] flex items-center justify-center gap-3"
              >
                <UserPlus className="h-4 w-4" />
                {loading ? 'Encrypting Record...' : 'Generate Membership Account'}
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div 
            key="list"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <MembersListView />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
