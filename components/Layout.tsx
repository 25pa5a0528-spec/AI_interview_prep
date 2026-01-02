
import React from 'react';
import { LayoutDashboard, MessageSquare, Code, FileText, Trophy, User, Flame, LogOut, Briefcase, PlusCircle, Zap } from 'lucide-react';
import { UserRole } from '../types';
import { storageService } from '../services/storageService';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  streak: number;
  role: UserRole;
  hideNavigation?: boolean; // New prop to hide down widgets
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, streak, role, hideNavigation, onLogout }) => {
  const candidateNav = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'interview', label: 'Mock', icon: MessageSquare },
    { id: 'coding', label: 'Lab', icon: Code },
    { id: 'resume', label: 'CV AI', icon: FileText },
    { id: 'leaderboard', label: 'Top', icon: Trophy },
  ];

  const recruiterNav = [
    { id: 'recruiter_dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'create_exam', label: 'New Exam', icon: PlusCircle },
    { id: 'company_leaderboard', label: 'Results', icon: Trophy },
  ];

  const navItems = role === UserRole.RECRUITER ? recruiterNav : candidateNav;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-24">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm">
            <Zap size={18} fill="currentColor" />
          </div>
          <h1 className="text-xl font-bold text-indigo-600 flex items-center gap-2">
            HirePulse <span className="text-[10px] bg-indigo-100 px-2 py-0.5 rounded text-indigo-600 font-black uppercase tracking-widest">{role === UserRole.RECRUITER ? 'Recruiter' : 'AI'}</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          {!hideNavigation && role !== UserRole.RECRUITER && (
            <div className="flex items-center gap-3 px-3 py-1.5 bg-orange-50 rounded-full border border-orange-100">
              <Flame className="text-orange-500" size={16} />
              <span className="text-sm font-black text-orange-600">{streak}</span>
            </div>
          )}
          <button 
            onClick={onLogout}
            className="p-2 text-slate-400 hover:text-red-500 transition-colors flex items-center gap-2 font-bold text-xs uppercase tracking-widest"
          >
            <LogOut size={20} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Content Area */}
      <main className={`flex-1 ${hideNavigation ? 'p-0' : 'p-4 md:p-8'} max-w-7xl mx-auto w-full`}>
        {children}
      </main>

      {/* Bottom Navigation */}
      {!hideNavigation && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-3 z-50 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)]">
          <div className="max-w-md mx-auto flex items-center justify-around">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1 px-4 py-1 rounded-xl transition-all duration-300 relative ${
                  activeTab === item.id 
                    ? 'text-indigo-600 scale-110' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className={`p-2 rounded-xl transition-colors ${activeTab === item.id ? 'bg-indigo-50' : 'bg-transparent'}`}>
                  <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${activeTab === item.id ? 'opacity-100' : 'opacity-60'}`}>
                  {item.label}
                </span>
              </button>
            ))}
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center gap-1 px-4 py-1 rounded-xl transition-all duration-300 ${
                activeTab === 'profile' ? 'text-indigo-600' : 'text-slate-400'
              }`}
            >
               <div className={`p-2 rounded-xl ${activeTab === 'profile' ? 'bg-indigo-50' : ''}`}>
                  <User size={22} />
               </div>
               <span className="text-[10px] font-bold uppercase tracking-wider">Profile</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
};

export default Layout;
