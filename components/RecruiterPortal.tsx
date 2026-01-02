
import React, { useState, useEffect } from 'react';
import { PlusCircle, Link as LinkIcon, Copy, Check, Users, ShieldCheck, Briefcase, Zap, Loader2, Calendar, FileText, ClipboardList, Mail, Plus, X, UserPlus, Building2, Image as ImageIcon, Save } from 'lucide-react';
import { storageService } from '../services/storageService';
import { SUPPORTED_ROLES, InterviewType, Difficulty, ExamConfig, LeaderboardEntry, CompanyProfile } from '../types';

interface RecruiterPortalProps {
  activeTab: string;
}

const RecruiterPortal: React.FC<RecruiterPortalProps> = ({ activeTab }) => {
  const [role, setRole] = useState(SUPPORTED_ROLES[0]);
  const [type, setType] = useState<InterviewType>(InterviewType.TECHNICAL);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.INTERMEDIATE);
  const [currentEmailInput, setCurrentEmailInput] = useState('');
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);
  const [generatedExam, setGeneratedExam] = useState<ExamConfig | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myExams, setMyExams] = useState<ExamConfig[]>([]);
  
  const [company, setCompany] = useState<CompanyProfile>({ name: '', logo: '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  const recruiterEmail = localStorage.getItem('hirepulse_active_user_email') || '';

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const [leaderData, examData, companyData] = await Promise.all([
        storageService.getLeaderboard(undefined, recruiterEmail),
        storageService.getExamsByRecruiter(recruiterEmail),
        storageService.getCompany(recruiterEmail)
      ]);
      setLeaderboard(leaderData);
      setMyExams(examData);
      setCompany(companyData);
      setIsLoading(false);
    };
    load();
  }, [activeTab, recruiterEmail]);

  const addEmail = () => {
    const email = currentEmailInput.trim().toLowerCase();
    if (!email || !email.includes('@')) return;
    if (invitedEmails.includes(email)) {
      setCurrentEmailInput('');
      return;
    }
    setInvitedEmails([...invitedEmails, email]);
    setCurrentEmailInput('');
  };

  const removeEmail = (emailToRemove: string) => {
    setInvitedEmails(invitedEmails.filter(e => e !== emailToRemove));
  };

  const saveCompanyProfile = async () => {
    setIsSavingProfile(true);
    await storageService.saveCompany(recruiterEmail, company);
    setIsSavingProfile(false);
    alert("Company profile updated successfully!");
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    const newExam: ExamConfig = {
      id: Math.random().toString(36).substr(2, 6).toUpperCase(),
      companyName: company.name || 'My Organization',
      companyLogo: company.logo,
      role,
      difficulty,
      type,
      createdAt: Date.now(),
      creatorEmail: recruiterEmail,
      invitedEmails: invitedEmails.length > 0 ? invitedEmails : undefined
    };
    await storageService.saveExam(newExam);
    setGeneratedExam(newExam);
    setMyExams(prev => [newExam, ...prev]);
    setIsLoading(false);
    setInvitedEmails([]);
    setCurrentEmailInput('');
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (activeTab === 'profile') {
    return (
      <div className="max-w-2xl mx-auto space-y-8 animate-fadeIn">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
          <h2 className="text-3xl font-black text-slate-900 mb-2 flex items-center gap-3">
            <Building2 className="text-indigo-600" />
            Company Identity
          </h2>
          <p className="text-slate-500 mb-10 font-medium">Define how your organization appears to candidates.</p>

          <div className="space-y-8">
            <div className="flex flex-col items-center">
               <div className="relative group cursor-pointer">
                  {company.logo ? (
                    <img src={company.logo} className="w-32 h-32 rounded-[2rem] object-cover border-4 border-indigo-50 shadow-lg" />
                  ) : (
                    <div className="w-32 h-32 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-300 border-4 border-dashed border-slate-200">
                       <ImageIcon size={40} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-indigo-600/60 rounded-[2rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <span className="text-white text-[10px] font-black uppercase tracking-widest">Update Logo</span>
                  </div>
               </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block">Organization Name</label>
                <input 
                  type="text" 
                  value={company.name}
                  onChange={(e) => setCompany({...company, name: e.target.value})}
                  placeholder="e.g. Acme Corporation"
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block">Logo URL</label>
                <div className="relative">
                  <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    value={company.logo}
                    onChange={(e) => setCompany({...company, logo: e.target.value})}
                    placeholder="https://..."
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-bold mt-2 pl-2">Recommended: Square image, minimum 512x512px.</p>
              </div>
            </div>

            <button 
              onClick={saveCompanyProfile}
              disabled={isSavingProfile}
              className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl disabled:opacity-50"
            >
              {isSavingProfile ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Update Global Profile</>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'create_exam') {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-black text-slate-900 mb-2">Create New Assessment</h2>
              <p className="text-slate-500 font-medium">Standardize benchmarks for your candidate pipeline.</p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center gap-3">
              <img src={company.logo} className="w-10 h-10 rounded-xl object-cover" />
              <span className="text-sm font-black text-indigo-700">{company.name}</span>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block">Target Role</label>
              <select 
                value={role} 
                onChange={(e) => setRole(e.target.value)}
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
              >
                {SUPPORTED_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block">Round</label>
                <select 
                  value={type} 
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                >
                  <option value={InterviewType.TECHNICAL}>Technical</option>
                  <option value={InterviewType.CODING}>Coding</option>
                  <option value={InterviewType.SYSTEM_DESIGN}>Architecture (System Design)</option>
                  <option value={InterviewType.APTITUDE}>Aptitude (Logic & Reasoning)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block">Complexity Bar</label>
                <select 
                  value={difficulty} 
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                >
                  {Object.values(Difficulty).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block flex items-center gap-2">
                <UserPlus size={14} /> Participant Management
              </label>
              
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    value={currentEmailInput}
                    onChange={(e) => setCurrentEmailInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addEmail()}
                    placeholder="Candidate email (e.g. name@gmail.com)"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                  />
                </div>
                <button 
                  onClick={addEmail}
                  className="px-6 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center gap-2"
                >
                  <Plus size={20} /> Add
                </button>
              </div>

              {invitedEmails.length > 0 && (
                <div className="flex flex-wrap gap-2 p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl min-h-[60px]">
                  {invitedEmails.map((email) => (
                    <div 
                      key={email} 
                      className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-indigo-200 shadow-sm animate-fadeIn"
                    >
                      <span className="text-xs font-bold text-indigo-700">{email}</span>
                      <button 
                        onClick={() => removeEmail(email)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button 
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white p-5 rounded-[1.5rem] font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 mt-4 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <><PlusCircle size={22} /> Create Restricted Assessment</>}
            </button>
          </div>
        </div>

        {generatedExam && (
          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl animate-slideUp border border-slate-800">
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2 text-emerald-400">
              <Zap size={20} fill="currentColor" /> Assessment Token Generated
            </h3>
            <p className="opacity-60 mb-6 text-sm">Provide this token to candidates to start their assessment.</p>
            <div className="flex items-center gap-4 bg-slate-800 p-4 rounded-2xl border border-slate-700">
              <span className="text-4xl font-black tracking-[0.2em] flex-1 text-center font-mono text-emerald-400">{generatedExam.id}</span>
              <button onClick={() => copyCode(generatedExam.id)} className="bg-emerald-600 text-white p-3 rounded-xl hover:bg-emerald-500 transition-all shadow-lg">
                {copied ? <Check size={20} /> : <Copy size={20} />}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'company_leaderboard' || activeTab === 'recruiter_dashboard') {
    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-slate-900">Company Dashboard</h2>
            <p className="text-slate-400 text-sm font-medium mt-1">Live tracking for <span className="text-indigo-600 font-bold">{company.name}</span></p>
          </div>
          <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-black border border-emerald-100 uppercase tracking-widest flex items-center gap-2">
            <Calendar size={14} /> Recruitment Cycle
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-md">
             <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4"><ClipboardList /></div>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Exams</p>
             <p className="text-3xl font-black mt-1">{myExams.length}</p>
           </div>
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-md">
             <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4"><Users /></div>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Attempts</p>
             <p className="text-3xl font-black mt-1">{leaderboard.length}</p>
           </div>
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-md">
             <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-4"><Zap /></div>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Qualified (80%+)</p>
             <p className="text-3xl font-black mt-1">{leaderboard.filter(l => l.score >= 80).length}</p>
           </div>
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-md">
             <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4"><ShieldCheck /></div>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Average Score</p>
             <p className="text-3xl font-black mt-1">
               {leaderboard.length > 0 
                 ? Math.round(leaderboard.reduce((acc, l) => acc + l.score, 0) / leaderboard.length) 
                 : 0}%
             </p>
           </div>
        </div>

        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-10 py-6 border-b border-slate-50 flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900">Recent Candidate Attempts</h3>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sorted by Score</span>
          </div>
          {isLoading ? (
            <div className="p-24 flex flex-col items-center">
              <Loader2 className="animate-spin text-indigo-600 mb-4" size={32} />
              <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Loading Analytics...</p>
            </div>
          ) : leaderboard.length > 0 ? (
            <table className="w-full">
              <thead className="bg-slate-50/50 text-left">
                <tr>
                  <th className="px-10 py-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Candidate</th>
                  <th className="px-10 py-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Exam ID</th>
                  <th className="px-10 py-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Performance Score</th>
                  <th className="px-10 py-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {leaderboard.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${r.score >= 80 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                           {r.name.charAt(0)}
                         </div>
                         <div>
                           <p className="font-bold text-slate-900">{r.name}</p>
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Session Attempted</p>
                         </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-mono font-bold">
                        {r.examId || 'PRACTICE'}
                      </span>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden max-w-[140px]">
                          <div className={`h-full transition-all duration-1000 ${r.score >= 80 ? 'bg-emerald-500' : r.score >= 50 ? 'bg-indigo-500' : 'bg-red-500'}`} style={{ width: `${r.score}%` }} />
                        </div>
                        <span className={`font-black font-mono ${r.score >= 80 ? 'text-emerald-600' : 'text-slate-900'}`}>{r.score}%</span>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <button className="p-2 text-slate-300 hover:text-indigo-600 transition-all">
                        <FileText size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-24 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                <Users size={32} />
              </div>
              <p className="text-slate-400 font-bold text-lg">No attempts recorded yet.</p>
              <p className="text-slate-300 text-sm mt-1">Share an Exam Token to begin collecting candidate data.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default RecruiterPortal;
