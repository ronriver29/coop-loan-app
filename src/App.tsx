import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Briefcase, 
  ChevronRight, 
  LayoutDashboard, 
  LogOut, 
  PieChart, 
  PlusCircle, 
  Settings, 
  Users, 
  Wallet,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from './types';

// Components (To be defined below or in separate files)
import AuthPage from './components/AuthPage';
import DashboardView from './views/DashboardView';
import LoanApplicationView from './views/LoanApplicationView';
import LoanDetailView from './views/LoanDetailView';
import AdminQueueView from './views/AdminQueueView';
import PaymentsView from './views/PaymentsView';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-12 w-12 bg-indigo-600 rounded-xl mb-4" />
        <p className="text-gray-500 font-medium">CoopLoan Manager</p>
      </div>
    </div>
  );

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <AuthPage onLogin={setUser} />} />
        <Route path="/*" element={user ? <Shell user={user} onLogout={() => setUser(null)} /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

interface NavLinkProps {
  to: string;
  icon: any;
  label: string;
  key?: React.Key;
}

function NavLink({ to, icon: Icon, label }: NavLinkProps) {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-all ${
        isActive
        ? 'bg-natural-sage/20 text-white border-l-4 border-natural-sage shadow-inner'
        : 'text-natural-bg/60 hover:text-white hover:bg-white/5'
      }`}
    >
      <Icon className="h-4.5 w-4.5" />
      {label}
    </Link>
  );
}

function Shell({ user, onLogout }: { user: User, onLogout: () => void }) {
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    onLogout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Overview', icon: LayoutDashboard, path: '/', roles: ['Member', 'Admin'] },
    { label: 'New Application', icon: PlusCircle, path: '/apply', roles: ['Member'] },
    { label: 'Loan Tracker', icon: Clock, path: '/tracker', roles: ['Member'] },
    { label: 'Approval Queue', icon: Users, path: '/admin/queue', roles: ['Admin'] },
    { label: 'Disbursements', icon: Wallet, path: '/payments', roles: ['Member', 'Admin'] },
  ];

  const filteredNav = navItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="flex min-h-screen bg-natural-bg">
      {/* Sidebar */}
      <aside className="w-72 bg-natural-sidebar text-natural-bg border-r border-natural-line flex flex-col shrink-0">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-12">
            <div className="h-9 w-9 bg-natural-sage rounded flex items-center justify-center shadow-lg shadow-black/20">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span className="font-serif font-black text-xl tracking-tight italic">CoopTrust v2</span>
          </div>

          <nav className="space-y-1.5">
            {filteredNav.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                icon={item.icon}
                label={item.label}
              />
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6">
          <div className="p-5 bg-white/5 rounded-xl mb-6 border border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-natural-sage/20 border border-natural-sage/40 flex items-center justify-center text-xs font-bold text-natural-sage">
                {user.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{user.name}</p>
                <p className="text-[10px] uppercase tracking-[0.2em] font-black text-natural-sage">{user.role}</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-3 w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 rounded-lg border border-white/5 hover:bg-red-900/20 hover:text-red-400 hover:border-red-900/40 transition-all"
          >
            <LogOut className="h-4 w-4" />
            Terminate Session
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col">
        <header className="h-16 bg-white border-b border-natural-line px-8 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-xl font-serif font-bold text-natural-ink">Loan Management System</h1>
          <div className="flex items-center gap-4">
            <button className="p-2 text-natural-ink/40 hover:text-natural-sage transition-colors">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<DashboardView user={user} />} />
              <Route path="/apply" element={<LoanApplicationView user={user} />} />
              <Route path="/tracker" element={<DashboardView user={user} />} />
              <Route path="/admin/queue" element={<AdminQueueView />} />
              <Route path="/loan/:id" element={<LoanDetailView />} />
              <Route path="/payments" element={<PaymentsView />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
