
import React, { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import InterviewSession from './components/InterviewSession';
import ResumeAnalyzer from './components/ResumeAnalyzer';
import CodingLab from './components/CodingLab';
import RecruiterPortal from './components/RecruiterPortal';
import { storageService } from './services/storageService';
import { UserProfile, InterviewSession as IInterviewSession, SUPPORTED_ROLES, InterviewType, UserRole, CompanyProfile, ExamConfig, LeaderboardEntry } from './types';
import { Trophy, Briefcase, Zap, ShieldCheck, ArrowRight, User, Terminal, Loader2, Key, Mail, Lock, Building2, X, AlertCircle } from 'lucide-react';

interface AuthPortalProps {
  role: UserRole;
  authMode: 'login' | 'signup';
  setAuthMode: (mode: 'login' | 'signup') => void;
  onAuth: (role: UserRole, email: string, pass: string, name?: string) => void;
  onBack: () => void;
  examContext?: ExamConfig;
}

const AuthPortal: React.FC<AuthPortalProps> = ({ role, authMode, setAuthMode, onAuth, onBack, examContext }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = () => {
    setError(null);

    if (authMode === 'signup' && !name.trim()) {
      return setError("Full name is required to create an account.");
    }

    if (!email) {
      return setError("Please enter your email address.");
    }

    if (!validateEmail(email)) {
      return setError("Please enter a valid email address (e.g., name@domain.com).");
    }

    if (!email.toLowerCase().endsWith('@gmail.com')) {
      return setError("Currently, only @gmail.com addresses are supported.");
    }

    if (password.length !== 10) {
      return setError("Security policy: Password must be exactly 10 characters.");
    }

    onAuth(role, email, password, name);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 animate-fadeIn">
      <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 max-w-md w-full">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md">
              <Zap size={24} fill="currentColor" />
            </div>
            <span className="text-2xl font-black text-indigo-600 tracking-tight">HirePulse</span>
          </div>
        </div>

        {examContext && (
          <div className="mb-8 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center gap-4">
             {examContext.companyLogo ? (
               <img src={examContext.companyLogo} className="w-12 h-12 rounded-xl object-cover border border-indigo-100" />
             ) : (
               <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                 <Building2 size={24} />
               </div>
             )}
             <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Applying for</p>
               <p className="font-bold text-slate-900">{examContext.companyName}</p>
             </div>
          </div>
        )}
        
        <div className="text-center mb-10">
          <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 ${role === UserRole.CANDIDATE ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
            {role === UserRole.CANDIDATE ? <User size={32} /> : <Briefcase size={32} />}
          </div>
          <h2 className="text-3xl font-black text-slate-900">{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="text-slate-500 font-medium mt-1">{role === UserRole.RECRUITER ? 'Recruiter' : 'Candidate'} Suite</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 animate-fadeIn">
            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
            <p className="text-sm font-bold text-red-600 leading-tight">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {authMode === 'signup' && (
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Full Name" 
                value={name}
                onChange={(e) => { setName(e.target.value); setError(null); }}
                className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-indigo-600 outline-none font-bold text-slate-700"
              />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="email" 
              placeholder="Email (name@gmail.com)" 
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-indigo-600 outline-none font-bold text-slate-700"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="password" 
              placeholder="Password (10 characters)" 
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-indigo-600 outline-none font-bold text-slate-700"
            />
          </div>

          <button 
            onClick={handleSubmit}
            className={`w-full py-4 rounded-2xl text-white font-black shadow-xl transition-all active:scale-95 mt-4 ${role === UserRole.CANDIDATE ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
          >
            {authMode === 'login' ? 'Sign In' : 'Join HirePulse'}
          </button>
        </div>

        <div className="mt-8 text-center">
          <button 
            onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setError(null); }}
            className="text-slate-400 font-bold hover:text-indigo-600 transition-colors"
          >
            {authMode === 'login' ? "New here? Create account" : "Already have an account? Login"}
          </button>
        </div>

        <button onClick={onBack} className="w-full mt-6 text-slate-300 hover:text-slate-400 font-bold text-xs uppercase tracking-widest">Back to Hub</button>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [sessions, setSessions] = useState<IInterviewSession[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [examMode, setExamMode] = useState<{ active: boolean; config?: ExamConfig; candidateName?: string }>({ active: false });
  const [view, setView] = useState<'landing' | 'candidate_auth' | 'recruiter_auth' | 'app'>('landing');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const storedEmail = localStorage.getItem('hirepulse_active_user_email');
      if (storedEmail) {
        const userData = await storageService.getUser(storedEmail);
        setUser(userData);
        const sessionData = await storageService.getSessions(storedEmail);
        setSessions(sessionData);
        if (userData.role !== UserRole.GUEST) setView('app');
      } else {
        setUser({
          name: 'Guest User',
          email: '',
          education: '',
          skills: [],
          targetRole: 'Software Engineer',
          experienceLevel: 'Junior',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=guest`,
          streak: 0,
          lastInterviewDate: null,
          totalScore: 0,
          role: UserRole.GUEST
        });
      }
      const boardData = await storageService.getLeaderboard();
      setLeaderboard(boardData);
      setIsLoading(false);
    };
    init();
  }, []);

  const handleLogout = () => {
    storageService.logout(); 
    setUser({
      name: 'Guest User',
      email: '',
      education: '',
      skills: [],
      targetRole: 'Software Engineer',
      experienceLevel: 'Junior',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=guest`,
      streak: 0,
      lastInterviewDate: null,
      totalScore: 0,
      role: UserRole.GUEST
    });
    setSessions([]);
    setExamMode({ active: false });
    setView('landing');
    setActiveTab('dashboard');
  };

  const handleStartExamFlow = async (code: string) => {
    if (!code) return;
    setIsLoading(true);
    const exam = await storageService.getExamById(code.toUpperCase());
    if (exam) {
      setExamMode({ active: true, config: exam });
      setAuthMode('login'); 
      setView('candidate_auth'); 
    } else {
      alert("Invalid Access Code. Please check with your recruiter.");
    }
    setIsLoading(false);
  };

  const handleAuth = async (role: UserRole, email: string, pass: string, name?: string) => {
    const userEmail = email.toLowerCase();

    if (examMode.active && examMode.config?.invitedEmails) {
      if (!examMode.config.invitedEmails.includes(userEmail)) {
        return alert("Access Denied: You are not invited to this private assessment.");
      }
    }

    setIsLoading(true);
    
    try {
      localStorage.setItem('hirepulse_active_user_email', userEmail);
      const existingUser = await storageService.getUser(userEmail);
      const updatedUser = { 
        ...existingUser, 
        email: userEmail, 
        role,
        name: authMode === 'signup' ? (name || existingUser.name) : (existingUser.name || 'User') 
      };
      
      setUser(updatedUser);
      await storageService.saveUser(updatedUser);
      
      if (examMode.active && role === UserRole.CANDIDATE) {
        setExamMode(prev => ({ ...prev, candidateName: updatedUser.name }));
        setActiveTab('interview');
      } else if (role === UserRole.RECRUITER) {
        setActiveTab('recruiter_dashboard');
      } else {
        setActiveTab('dashboard');
      }
      setView('app');
    } catch (err) {
      alert("Authentication failed. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const incrementScore = useCallback(async (scoreGain: number) => {
    if (!user || !user.email) return;
    const updatedUser = {
      ...user,
      totalScore: user.totalScore + scoreGain,
      streak: user.streak + 1,
      lastInterviewDate: new Date().toISOString()
    };
    setUser(updatedUser);
    await storageService.saveUser(updatedUser);
  }, [user]);

  const handleCompleteInterview = async (newSession: any) => {
    const session: IInterviewSession = { 
      id: `s-${Date.now()}`, 
      ...newSession,
      examId: examMode.config?.id,
      userEmail: user?.email,
      candidateName: examMode.candidateName || user?.name
    };
    setSessions(prev => [session, ...prev]);
    await storageService.saveSession(session);
    
    if (examMode.active) {
      alert("Assessment complete! Your results are now visible to the recruiter.");
      handleLogout();
    } else {
      setActiveTab('dashboard');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-6 animate-pulse shadow-xl shadow-indigo-100">
           <Zap size={32} fill="currentColor" />
        </div>
        <Loader2 className="animate-spin text-indigo-600 mb-4" size={32} />
        <p className="text-slate-500 font-bold tracking-widest uppercase text-xs">Syncing Cloud Workspace...</p>
      </div>
    );
  }

  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 space-y-12 animate-fadeIn">
        <div className="text-center space-y-4 max-w-2xl">
          <div className="w-24 h-24 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white mx-auto shadow-2xl shadow-indigo-200 mb-6">
            <Zap size={48} fill="currentColor" />
          </div>
          <h1 className="text-6xl font-black text-slate-900 tracking-tight">HirePulse</h1>
          <p className="text-xl text-slate-400 font-medium tracking-tight">The Intelligent Hiring Operating System.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
          <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 hover:border-indigo-200 transition-all group flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm mb-6 group-hover:scale-110 transition-transform">
              <User size={28} />
            </div>
            <h3 className="text-3xl font-black mb-4 text-slate-900">Candidate Center</h3>
            <p className="text-slate-500 mb-8 font-medium">Master interviews, track skills, and get hired by top companies.</p>
            <button 
              onClick={() => {
                setExamMode({ active: false }); 
                setView('candidate_auth');
              }}
              className="w-full bg-indigo-600 text-white p-5 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 mb-4"
            >
              Enter Dashboard
            </button>
            <div className="w-full flex gap-3 mt-4 pt-6 border-t border-slate-200">
               <input 
                id="exam-code-input"
                placeholder="EXAM ACCESS CODE" 
                className="flex-1 p-4 rounded-xl border-2 border-slate-200 bg-white text-slate-900 focus:border-indigo-600 outline-none uppercase font-black tracking-widest text-center !bg-white"
              />
              <button 
                onClick={() => {
                  const val = (document.getElementById('exam-code-input') as HTMLInputElement)?.value;
                  handleStartExamFlow(val);
                }}
                className="bg-slate-900 text-white p-4 rounded-xl hover:bg-slate-800"
              >
                <ArrowRight />
              </button>
            </div>
          </div>

          <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 hover:border-emerald-200 transition-all group flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm mb-6 group-hover:scale-110 transition-transform">
              <Briefcase size={28} />
            </div>
            <h3 className="text-3xl font-black mb-4 text-slate-900">Recruiter Suite</h3>
            <p className="text-slate-500 mb-8 font-medium">Create assessments, automate screening, and scale your talent pipeline.</p>
            <button 
              onClick={() => {
                setExamMode({ active: false });
                setView('recruiter_auth');
              }}
              className="w-full bg-emerald-600 text-white p-5 rounded-2xl font-black hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100"
            >
              Access Employer Tools
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'candidate_auth') return (
    <AuthPortal 
      role={UserRole.CANDIDATE} 
      authMode={authMode} 
      setAuthMode={setAuthMode} 
      onAuth={handleAuth} 
      onBack={() => setView('landing')} 
      examContext={examMode.config}
    />
  );
  
  if (view === 'recruiter_auth') return (
    <AuthPortal 
      role={UserRole.RECRUITER} 
      authMode={authMode} 
      setAuthMode={setAuthMode} 
      onAuth={handleAuth} 
      onBack={() => setView('landing')} 
    />
  );

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      streak={user?.streak || 0} 
      role={user?.role || UserRole.GUEST}
      hideNavigation={examMode.active} 
      onLogout={handleLogout}
    >
      {user?.role === UserRole.RECRUITER ? (
        <RecruiterPortal activeTab={activeTab} />
      ) : (
        <>
          {activeTab === 'dashboard' && <Dashboard user={user!} sessions={sessions} onStartInterview={() => setActiveTab('interview')} />}
          {activeTab === 'interview' && (
            <InterviewSession 
              user={user!} 
              onComplete={handleCompleteInterview} 
              onCancel={() => setActiveTab('dashboard')} 
              onAnswerEvaluated={incrementScore} 
              examConfig={examMode.config}
            />
          )}
          {activeTab === 'resume' && <ResumeAnalyzer user={user!} />}
          {activeTab === 'coding' && <CodingLab user={user!} onComplete={incrementScore} />}
          {activeTab === 'leaderboard' && (
            <div className="space-y-6 animate-fadeIn pb-12">
              <h2 className="text-2xl font-bold text-slate-900">Global Cloud Ranking</h2>
              <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-slate-100">
                <table className="w-full">
                  <thead className="bg-slate-50 text-left">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Rank</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Candidate</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Cloud XP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {leaderboard.map((entry) => (
                      <tr key={entry.name} className={entry.isCurrentUser ? 'bg-indigo-50/50' : ''}>
                        <td className="px-6 py-4 font-black text-slate-400">{entry.rank}</td>
                        <td className="px-6 py-4 font-bold text-slate-900">{entry.name}</td>
                        <td className="px-6 py-4 font-mono font-bold text-indigo-600">{entry.score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {activeTab === 'profile' && (
            <div className="max-w-2xl mx-auto py-4 pb-12 animate-fadeIn">
              <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
                <div className="flex flex-col items-center mb-10">
                  <img src={user?.avatar} className="w-24 h-24 rounded-3xl mb-4 border-2 border-indigo-100 shadow-md" />
                  <h2 className="text-2xl font-bold text-slate-900">{user?.name}</h2>
                  <p className="text-indigo-600 font-bold uppercase tracking-widest text-[10px] bg-indigo-50 px-3 py-1 rounded-full mt-2">{user?.role}</p>
                </div>
                <div className="space-y-6">
                   <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Career Objective</label>
                    <select value={user?.targetRole} onChange={(e) => setUser({...user!, targetRole: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-2xl mt-1 font-bold text-slate-700 outline-none">
                      {SUPPORTED_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                    </select>
                  </div>
                  <button onClick={handleLogout} className="w-full p-4 bg-red-50 text-red-600 rounded-2xl font-black mt-4 hover:bg-red-100 transition-colors uppercase tracking-widest text-xs">Terminate Session</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </Layout>
  );
};

export default App;
