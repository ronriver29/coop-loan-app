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
import { ThemeProvider } from './contexts/ThemeContext';
import ThemeToggle from './components/ThemeToggle';
import AuthPage from './components/AuthPage';
import DashboardView from './views/DashboardView';
import LoanApplicationView from './views/LoanApplicationView';
import LoanDetailView from './views/LoanDetailView';
import AdminQueueView from './views/AdminQueueView';
import AdminMembersView from './views/AdminMembersView';
import ProfileView from './views/ProfileView';
import PaymentsView from './views/PaymentsView';
import LoanTypeManagementView from './views/LoanTypeManagementView';
import ResetPasswordView from './views/ResetPasswordView';

import LoadingScreen from './components/LoadingScreen';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const startTime = Date.now();
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        setUser(data);
      })
      .catch(() => {})
      .finally(() => {
        const elapsed = Date.now() - startTime;
        const minimumDelay = 2500; // 2.5 seconds for dramatic effect
        const remaining = Math.max(0, minimumDelay - elapsed);
        setTimeout(() => setLoading(false), remaining);
      });
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <AuthPage onLogin={setUser} />} />
          <Route path="/reset-password" element={<ResetPasswordView />} />
          <Route path="/*" element={user ? <Shell user={user} onLogout={() => setUser(null)} onUpdate={setUser} /> : <Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
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

function ViewTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ 
        type: 'spring', 
        damping: 30, 
        stiffness: 200,
        opacity: { duration: 0.3 }
      }}
      className="w-full"
    >
      {children}
    </motion.div>
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
    { label: 'Approval', icon: Clock, path: '/admin/queue', roles: ['Admin', 'System Administrator', 'Evaluator', 'Reviewer', 'Approver', 'Disbursement'] },
    { label: 'Registry', icon: Users, path: '/admin/members', roles: ['Admin', 'System Administrator'] },
    { label: 'Programs', icon: FileText, path: '/admin/loan-types', roles: ['Admin', 'System Administrator'] },
    { label: 'Payments', icon: Wallet, path: '/payments', roles: ['Member', 'Admin', 'Regular Member', 'Associate Member', 'System Administrator', 'Evaluator', 'Reviewer', 'Approver', 'Disbursement'] },
    { label: 'Profile', icon: Settings, path: '/profile', roles: ['Member', 'Admin', 'Regular Member', 'Associate Member', 'System Administrator', 'Evaluator', 'Reviewer', 'Approver', 'Disbursement'] },
  ];

  const filteredNav = navItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="flex h-screen bg-natural-bg dark:bg-[#020617] overflow-hidden relative font-sans">
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
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-[2px] z-40"
                />
              )}
            </AnimatePresence>
            
            <motion.aside 
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed lg:static inset-y-0 left-0 w-72 bg-natural-sidebar text-natural-bg flex flex-col shrink-0 z-50 lg:z-20 border-r border-white/5`}
            >
              <div className="p-8 flex flex-col h-full overflow-y-auto scrollbar-hide">
                <div className="flex items-center justify-between mb-12 px-2">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-natural-sage rounded-2xl flex items-center justify-center shadow-lg shadow-natural-sage/20">
                      <Briefcase className="h-4.5 w-4.5 text-white" />
                    </div>
                    <span className="font-display font-black text-xl tracking-tight text-white uppercase italic">CoopLink</span>
                  </div>
                  <button 
                    onClick={() => setSidebarOpen(false)}
                    className="lg:hidden p-2 text-white/40 hover:text-white"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <nav className="space-y-2 flex-1">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/10 px-5 mb-4">Operations Center</p>
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

                <div className="mt-auto space-y-6 pt-10">
                  <div className="px-5">
                    <ThemeToggle />
                  </div>
                  
                  <Link 
                    to="/profile"
                    onClick={() => setSidebarOpen(false)}
                    className="block p-5 bg-white/[0.03] rounded-3xl border border-white/[0.03] transition-all hover:bg-white/[0.08] hover:border-white/[0.1] group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-natural-sage flex items-center justify-center text-xs font-black text-white italic group-hover:scale-110 transition-transform shadow-lg shadow-natural-sage/20">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-white truncate uppercase tracking-tight">{user.name}</p>
                        <p className="text-[9px] uppercase tracking-[0.1em] font-bold text-natural-sage/70">{user.role}</p>
                      </div>
                    </div>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-3 w-full py-4 text-[10px] font-black uppercase tracking-[0.3em] text-white/20 rounded-2xl border border-white/5 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all active:scale-[0.98]"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Terminate Session
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
        <header className="h-16 lg:h-20 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-natural-line dark:border-white/5 px-6 lg:px-10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 pl-14 lg:pl-0">
            <h1 className="text-[9px] lg:text-[10px] font-black text-natural-ink/40 dark:text-white/20 uppercase tracking-[0.3em] truncate italic pr-4 border-r border-natural-line dark:border-white/5">
              Secure Nexus
            </h1>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              <span className="text-[9px] lg:text-[10px] font-bold text-natural-ink dark:text-white/60 tracking-widest uppercase">Encryption Active</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 bg-natural-bg dark:bg-white/5 px-4 py-2 rounded-xl border border-natural-line dark:border-white/5">
              <Clock className="h-3.5 w-3.5 text-natural-sage" />
              <div className="h-full w-px bg-natural-line dark:bg-white/10" />
              <span className="text-[10px] font-mono font-bold text-natural-ink dark:text-white/80 tabular-nums">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden pt-6 pb-20 px-6 lg:p-12 scroll-smooth">
          <div className="max-w-7xl mx-auto w-full">
            <AnimatePresence mode="wait">
              <ViewTransition>
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
              </ViewTransition>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
