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
  FileText,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from './types';

// Components (To be defined below or in separate files)
import AuthPage from './components/AuthPage';
import DashboardView from './views/DashboardView';
import LoanApplicationView from './views/LoanApplicationView';
import LoanDetailView from './views/LoanDetailView';
import AdminQueueView from './views/AdminQueueView';
import AdminMembersView from './views/AdminMembersView';
import ProfileView from './views/ProfileView';
import PaymentsView from './views/PaymentsView';
import LoanTypeManagementView from './views/LoanTypeManagementView';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-natural-bg">
      <div className="flex flex-col items-center">
        <div className="h-16 w-16 bg-natural-sidebar rounded-[2rem] mb-6 flex items-center justify-center animate-pulse shadow-xl shadow-natural-sidebar/10">
          <FileText className="h-7 w-7 text-natural-sage" />
        </div>
        <p className="text-natural-ink font-display font-black text-xl tracking-tight mb-2">CoopTrust v2</p>
        <div className="h-1 w-40 bg-natural-line rounded-full overflow-hidden">
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            className="h-full w-1/3 bg-natural-sage"
          />
        </div>
      </div>
    </div>
  );

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <AuthPage onLogin={setUser} />} />
        <Route path="/*" element={user ? <Shell user={user} onLogout={() => setUser(null)} onUpdate={setUser} /> : <Navigate to="/login" />} />
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
      className={`flex items-center justify-between px-5 py-4 text-xs font-bold uppercase tracking-[0.2em] rounded-[2rem] transition-all group ${
        isActive
        ? 'bg-natural-sage text-white shadow-xl shadow-natural-sage/10 translate-x-2'
        : 'text-white/40 hover:text-white hover:bg-white/5'
      }`}
    >
      <div className="flex items-center gap-4">
        <Icon className={`h-4 w-4 transition-colors ${isActive ? 'text-white' : 'text-natural-sage/50 group-hover:text-natural-sage'}`} />
        {label}
      </div>
      {isActive && <ChevronRight className="h-3 w-3" />}
    </Link>
  );
}

function Shell({ user, onLogout, onUpdate }: { user: User, onLogout: () => void, onUpdate: (user: User) => void }) {
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    onLogout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Summary', icon: LayoutDashboard, path: '/', roles: ['Member', 'Admin', 'Regular Member', 'Associate Member', 'System Administrator', 'Evaluator', 'Reviewer', 'Approver', 'Disbursement'] },
    { label: 'Application', icon: PlusCircle, path: '/apply', roles: ['Member', 'Regular Member', 'Associate Member'] },
    { label: 'Approval', icon: Users, path: '/admin/queue', roles: ['Admin', 'System Administrator', 'Evaluator', 'Reviewer', 'Approver', 'Disbursement'] },
    { label: 'Registry', icon: Briefcase, path: '/admin/members', roles: ['Admin', 'System Administrator'] },
    { label: 'Programs', icon: Briefcase, path: '/admin/loan-types', roles: ['Admin', 'System Administrator'] },
    { label: 'Payments', icon: Wallet, path: '/payments', roles: ['Member', 'Admin', 'Regular Member', 'Associate Member', 'System Administrator', 'Evaluator', 'Reviewer', 'Approver', 'Disbursement'] },
    { label: 'Profile', icon: Settings, path: '/profile', roles: ['Member', 'Admin', 'Regular Member', 'Associate Member', 'System Administrator', 'Evaluator', 'Reviewer', 'Approver', 'Disbursement'] },
  ];

  const filteredNav = navItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="flex h-screen bg-natural-bg overflow-hidden relative">
      {/* Mobile Toggle Button */}
      <button 
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-6 left-6 z-30 p-3 bg-natural-sidebar text-white rounded-2xl shadow-xl active:scale-95 transition-all"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Sidebar - Desktop & Mobile */}
      <AnimatePresence>
        {(isSidebarOpen || window.innerWidth >= 1024) && (
          <>
            {/* Backdrop for mobile */}
            {isSidebarOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              />
            )}
            
            <motion.aside 
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed lg:static inset-y-0 left-0 w-80 bg-natural-sidebar text-natural-bg flex flex-col shrink-0 z-50 lg:z-20`}
            >
              <div className="p-10 flex flex-col h-full">
                <div className="flex items-center justify-between mb-16 px-2">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-natural-sage rounded-2xl flex items-center justify-center shadow-lg shadow-black/20">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-display font-black text-2xl tracking-tighter text-white">CoopLink</span>
                  </div>
                  <button 
                    onClick={() => setSidebarOpen(false)}
                    className="lg:hidden p-2 text-white/40 hover:text-white"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <nav className="space-y-4 flex-1">
                  <p className="text-micro text-white/20 px-5 mb-6">Master Ledger</p>
                  {filteredNav.map((item) => (
                    <div key={item.path} onClick={() => setSidebarOpen(false)}>
                      <NavLink
                        to={item.path}
                        icon={item.icon}
                        label={item.label}
                      />
                    </div>
                  ))}
                </nav>

                <div className="space-y-8">
                  <Link 
                    to="/profile"
                    onClick={() => setSidebarOpen(false)}
                    className="block p-6 bg-white/5 rounded-[2rem] border border-white/5 transition-all hover:bg-white/10 group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-natural-sage/20 border border-natural-sage/40 flex items-center justify-center text-xs font-bold text-natural-sage tracking-tighter group-hover:scale-110 transition-transform">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{user.name}</p>
                        <p className="text-[10px] uppercase tracking-[0.2em] font-black text-natural-sage mt-0.5">{user.role}</p>
                      </div>
                    </div>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-3 w-full py-5 text-[10px] font-black uppercase tracking-[0.3em] text-white/30 rounded-[2rem] border border-white/5 hover:bg-red-900/20 hover:text-red-400 hover:border-red-900/40 transition-all active:scale-[0.98]"
                  >
                    <LogOut className="h-4 w-4" />
                    Log Out
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-natural-line px-6 lg:px-10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 pl-12 lg:pl-0">
            <div className="h-2 w-2 rounded-full bg-natural-sage hidden sm:block" />
            <h1 className="text-[10px] lg:text-sm font-bold text-natural-ink uppercase tracking-[0.2em] lg:tracking-[0.3em] truncate">Institutional Repository</h1>
          </div>
          <div className="flex items-center gap-4 lg:gap-6">
            <div className="flex flex-col items-end hidden sm:flex">
              <p className="text-micro leading-none mb-1">System Health</p>
              <p className="text-[10px] font-bold text-natural-sage uppercase tracking-widest">Active & Secured</p>
            </div>
            <button className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-natural-bg transition-colors border border-natural-line">
              <Settings className="h-4 w-4 text-natural-ink" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 lg:p-12 bg-pattern">
          <div className="max-w-6xl mx-auto w-full">
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<DashboardView user={user} />} />
                <Route path="/apply" element={<LoanApplicationView user={user} />} />
                <Route path="/tracker" element={<DashboardView user={user} />} />
                <Route path="/admin/queue" element={<AdminQueueView />} />
                <Route path="/admin/members" element={<AdminMembersView />} />
                <Route path="/admin/loan-types" element={<LoanTypeManagementView />} />
                <Route path="/profile" element={<ProfileView user={user} onUpdate={onUpdate} />} />
                <Route path="/loan/:id" element={<LoanDetailView />} />
                <Route path="/payments" element={<PaymentsView />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
