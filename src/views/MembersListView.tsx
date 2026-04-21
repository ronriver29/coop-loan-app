import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mail, Search, Contact2, Phone, MapPin, User as UserIcon } from 'lucide-react';
import { User } from '../types';

export default function MembersListView() {
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
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
  }, []);

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="h-10 w-10 border-4 border-natural-sage border-t-transparent rounded-full animate-spin" />
        <p className="text-micro animate-pulse">Syncing institutional records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
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
            <motion.div key={member.memberId} variants={item} className="organic-card p-6 flex items-start gap-6 hover:shadow-lg transition-shadow border-natural-line/40">
              <div className="h-14 w-14 rounded-2xl bg-natural-sidebar text-natural-sage flex items-center justify-center shrink-0 font-display font-black text-lg border border-white/5 shadow-inner">
                {member.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0 space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-display font-black text-natural-ink truncate">{member.name}</h4>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      member.role === 'Admin' ? 'bg-natural-sage/10 text-natural-sage' : 'bg-slate-100 text-slate-400'
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
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
