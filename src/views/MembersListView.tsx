import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Search, Contact2, Phone, MapPin, User as UserIcon, Edit2, X, Save } from 'lucide-react';
import { User, UserRole } from '../types';
import LoadingScreen from '../components/LoadingScreen';

export default function MembersListView() {
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [editingMember, setEditingMember] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const roles: UserRole[] = ['Regular Member', 'Associate Member', 'System Administrator', 'Evaluator', 'Reviewer', 'Approver', 'Disbursement', 'Member', 'Admin'];

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = () => {
    setLoading(true);
    fetch('/api/users', { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch members');
        return res.json();
      })
      .then(data => {
        setMembers(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !editingMember._id) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/users/${editingMember._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingMember),
      });

      if (!res.ok) throw new Error('Failed to update member');
      
      await fetchMembers();
      setEditingMember(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.memberId.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  if (loading && members.length === 0) return <LoadingScreen />;

  return (
    <div className="space-y-8 relative">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
        <input
          type="text"
          placeholder="Search by name, ID, or email..."
          className="organic-input pl-12 font-medium"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {error ? (
        <div className="p-8 organic-card border-red-100 bg-red-50 text-red-600 text-center uppercase tracking-widest text-micro">
          {error}
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="p-20 text-center organic-card opacity-50 space-y-4">
          <Contact2 className="h-10 w-10 mx-auto text-slate-300" />
          <p className="text-micro">No matching archival records found.</p>
        </div>
      ) : (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {filteredMembers.map((member) => (
            <motion.div key={member.memberId} variants={item} className="organic-card p-6 flex flex-col hover:shadow-lg transition-shadow border-natural-line/40 group relative">
              <button 
                onClick={() => setEditingMember(member)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-white border border-natural-line text-slate-400 opacity-0 group-hover:opacity-100 transition-all hover:text-natural-sage hover:border-natural-sage active:scale-95"
              >
                <Edit2 className="h-4 w-4" />
              </button>

              <div className="flex items-start gap-6">
                <div className="h-14 w-14 rounded-2xl bg-natural-sidebar text-natural-sage flex items-center justify-center shrink-0 font-display font-black text-lg border border-white/5 shadow-inner">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0 space-y-4">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="font-display font-black text-natural-ink truncate">{member.name}</h4>
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        (member.role === 'Admin' || member.role === 'System Administrator') ? 'bg-natural-sage/10 text-natural-sage' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {member.role}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-micro text-slate-400 font-mono">
                      <Contact2 className="h-3 w-3" />
                      {member.memberId}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 pt-4 border-t border-natural-line/10">
                    <div className="flex items-center gap-3 text-micro text-slate-500">
                      <Mail className="h-3 w-3 text-natural-sage" />
                      <span className="truncate">{member.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-micro text-slate-500">
                      <Phone className="h-3 w-3 text-natural-sage" />
                      <span>{member.contactNumber || 'No Contact Set'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-micro text-slate-500">
                      <MapPin className="h-3 w-3 text-natural-sage" />
                      <span className="truncate">
                        {member.city ? `${member.city}, ${member.province}` : 'No Location Provided'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {editingMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingMember(null)}
              className="absolute inset-0 bg-natural-ink/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-[#FCFCFA] rounded-[2rem] shadow-2xl border border-white/20 overflow-hidden"
            >
              <div className="p-8 border-b border-natural-line flex items-center justify-between bg-white/50">
                <div>
                  <h3 className="text-xl font-display font-black text-natural-ink">Modify Credentials</h3>
                  <p className="text-micro mt-1">Update institutional records for {editingMember.name}</p>
                </div>
                <button 
                  onClick={() => setEditingMember(null)}
                  className="p-3 rounded-2xl hover:bg-natural-bg transition-colors"
                >
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleUpdate} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-micro font-bold text-slate-400 pl-1 uppercase tracking-widest">Full Name</label>
                    <input 
                      type="text" 
                      className="organic-input font-medium"
                      value={editingMember.name}
                      onChange={e => setEditingMember({...editingMember, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-micro font-bold text-slate-400 pl-1 uppercase tracking-widest">Email Address</label>
                    <input 
                      type="email" 
                      className="organic-input font-medium"
                      value={editingMember.email}
                      onChange={e => setEditingMember({...editingMember, email: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-micro font-bold text-slate-400 pl-1 uppercase tracking-widest">Member ID</label>
                    <input 
                      type="text" 
                      className="organic-input font-mono uppercase"
                      value={editingMember.memberId}
                      onChange={e => setEditingMember({...editingMember, memberId: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-micro font-bold text-slate-400 pl-1 uppercase tracking-widest">Role Assignment</label>
                    <select 
                      className="organic-input font-medium"
                      value={editingMember.role}
                      onChange={e => setEditingMember({...editingMember, role: e.target.value as UserRole})}
                    >
                      {roles.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-natural-line/40">
                  <div className="space-y-2">
                    <label className="text-micro font-bold text-slate-400 pl-1 uppercase tracking-widest">Contact Number</label>
                    <input 
                      type="text" 
                      className="organic-input font-medium"
                      value={editingMember.contactNumber || ''}
                      onChange={e => setEditingMember({...editingMember, contactNumber: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-micro font-bold text-slate-400 pl-1 uppercase tracking-widest">City</label>
                    <input 
                      type="text" 
                      className="organic-input font-medium"
                      value={editingMember.city || ''}
                      onChange={e => setEditingMember({...editingMember, city: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-micro font-bold text-slate-400 pl-1 uppercase tracking-widest">Province</label>
                    <input 
                      type="text" 
                      className="organic-input font-medium"
                      value={editingMember.province || ''}
                      onChange={e => setEditingMember({...editingMember, province: e.target.value})}
                    />
                  </div>
                </div>

                <div className="pt-8 flex items-center justify-end gap-4 border-t border-natural-line">
                  <button 
                    type="button"
                    onClick={() => setEditingMember(null)}
                    className="text-micro font-bold text-slate-400 hover:text-natural-ink uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-natural-sage text-white px-8 py-4 rounded-2xl font-bold text-sm shadow-lg shadow-natural-sage/20 hover:bg-natural-sage-600 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Commit Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
