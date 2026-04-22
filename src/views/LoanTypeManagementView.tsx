import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  ShieldCheck, 
  GraduationCap, 
  Store, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X,
  Info,
  Home,
  Heart,
  Bus,
  ShoppingBag,
  Briefcase,
  Wrench,
  AlertCircle
} from 'lucide-react';

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

export default function LoanTypeManagementView() {
  const [types, setTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    icon: 'Info',
    description: '',
    interestRate: 0.12,
    allowedTerms: [6, 12, 18, 24],
    isActive: true
  });

  const fetchTypes = async () => {
    try {
      const res = await fetch('/api/loan-types');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTypes(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/loan-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setTypes([...types, data]);
      setIsAdding(false);
      setFormData({ name: '', icon: 'Info', description: '', isActive: true });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdate = async (id: string, updates: any) => {
    setError('');
    try {
      const res = await fetch(`/api/loan-types/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setTypes(types.map(t => t._id === id ? data : t));
      setEditingId(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this loan type?')) return;
    setError('');
    try {
      const res = await fetch(`/api/loan-types/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to delete');
      
      setTypes(types.filter(t => t._id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <div className="p-10 text-center animate-pulse">Synchronizing catalog...</div>;

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl lg:text-4xl font-display font-black text-natural-ink tracking-tight">Product Catalog</h2>
          <p className="text-slate-500 text-sm lg:text-base font-medium opacity-80 mt-1">Configure institutional loan programs and structural variations.</p>
        </div>
        
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-3 px-6 py-4 bg-natural-sidebar text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-black/10 transition-all hover:opacity-90 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Add Program
        </button>
      </div>

      {error && (
        <div className="p-5 bg-red-50 text-red-600 rounded-2xl text-[10px] font-bold uppercase tracking-widest border border-red-100 flex items-center gap-3">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {isAdding && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="organic-card p-8 border-natural-sage ring-2 ring-natural-sage/20"
            >
              <form onSubmit={handleCreate} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-micro">Program Name</label>
                  <input
                    required
                    className="organic-input text-sm"
                    placeholder="e.g. Health Support"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-micro">Visual Token</label>
                  <div className="grid grid-cols-6 gap-2">
                    {Object.keys(iconMap).map(i => {
                      const Icon = iconMap[i];
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setFormData({ ...formData, icon: i })}
                          className={`p-2 rounded-lg border transition-all ${
                            formData.icon === i ? 'bg-natural-sage text-white border-natural-sage' : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                          }`}
                        >
                          <Icon className="h-4 w-4 mx-auto" />
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-micro">Description</label>
                  <textarea
                    className="organic-input text-sm min-h-[100px]"
                    placeholder="Briefly describe the program scope..."
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-micro">Annual Interest Rate</label>
                    <input
                      type="number"
                      step="0.01"
                      className="organic-input text-sm"
                      value={formData.interestRate}
                      onChange={e => setFormData({ ...formData, interestRate: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-micro">Terms (Comma-separated months)</label>
                    <input
                      type="text"
                      className="organic-input text-sm"
                      value={formData.allowedTerms.join(', ')}
                      onChange={e => setFormData({ ...formData, allowedTerms: e.target.value.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v)) })}
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="flex-1 py-3 bg-natural-sidebar text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Commit</button>
                  <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-3 bg-slate-100 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest"><X className="h-4 w-4"/></button>
                </div>
              </form>
            </motion.div>
          )}

          {types.map((type) => {
            const Icon = iconMap[type.icon] || Info;
            const isEditing = editingId === type._id;

            return (
              <motion.div
                layout
                key={type._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="organic-card p-8 group relative overflow-hidden"
              >
                {!isEditing ? (
                  <>
                    <div className="flex justify-between items-start mb-6">
                      <div className="h-12 w-12 rounded-2xl bg-natural-bg border border-natural-line flex items-center justify-center text-natural-sage">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            setEditingId(type._id);
                            setFormData({ 
                              name: type.name, 
                              icon: type.icon, 
                              description: type.description, 
                              interestRate: type.interestRate || 0.12,
                              allowedTerms: type.allowedTerms || [6, 12, 18, 24],
                              isActive: type.isActive 
                            });
                          }}
                          className="p-2 text-slate-300 hover:text-natural-sage transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(type._id)}
                          className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <h4 className="font-display font-black text-xl text-natural-ink mb-2 uppercase tracking-tight">{type.name}</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium mb-6 min-h-[3rem] line-clamp-3 italic opacity-60">"{type.description}"</p>
                    <div className="flex items-center gap-2">
                       <div className={`h-1.5 w-1.5 rounded-full ${type.isActive ? 'bg-natural-sage' : 'bg-slate-300'}`} />
                       <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{type.isActive ? 'Live Program' : 'Inactive'}</span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-4 text-micro text-slate-400 border-t border-natural-line pt-4">
                      <span>Rate: <b className="text-natural-ink">{(type.interestRate * 100).toFixed(1)}%</b></span>
                      <span>Terms: <b className="text-natural-ink">{type.allowedTerms?.join(', ')} mo</b></span>
                    </div>
                  </>
                ) : (
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleUpdate(type._id, formData);
                    }}
                    className="space-y-5"
                  >
                    <input
                      required
                      className="organic-input text-sm"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                    <div className="grid grid-cols-6 gap-1">
                      {Object.keys(iconMap).map(i => {
                        const IconComponent = iconMap[i];
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setFormData({ ...formData, icon: i })}
                            className={`p-1.5 rounded-lg border transition-all ${
                              formData.icon === i ? 'bg-natural-sage text-white' : 'bg-slate-50'
                            }`}
                          >
                            <IconComponent className="h-3 w-3 mx-auto" />
                          </button>
                        );
                      })}
                    </div>
                    <textarea
                      className="organic-input text-sm min-h-[80px]"
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Rate</label>
                        <input
                          type="number"
                          step="0.01"
                          className="organic-input text-xs"
                          value={formData.interestRate}
                          onChange={e => setFormData({ ...formData, interestRate: parseFloat(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Terms</label>
                        <input
                          type="text"
                          className="organic-input text-xs"
                          value={formData.allowedTerms.join(', ')}
                          onChange={e => setFormData({ ...formData, allowedTerms: e.target.value.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v)) })}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        id={`active-${type._id}`}
                        checked={formData.isActive}
                        onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                      />
                      <label htmlFor={`active-${type._id}`} className="text-micro">Active Program</label>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button type="submit" className="flex-1 py-2 bg-natural-sage text-white rounded-lg text-[10px] font-bold uppercase tracking-widest"><Check className="h-4 w-4 mx-auto"/></button>
                      <button type="button" onClick={() => setEditingId(null)} className="flex-1 py-2 bg-slate-100 text-slate-400 rounded-lg text-[10px] font-bold uppercase tracking-widest"><X className="h-4 w-4 mx-auto"/></button>
                    </div>
                  </form>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
