
import React, { useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { TrendingUp, Target, Zap, ShieldCheck, PlayCircle, Code, MessageSquare, Flame, History } from 'lucide-react';
import { UserProfile, InterviewSession, InterviewType } from '../types';
import SessionHistory from './SessionHistory';

interface DashboardProps {
  user: UserProfile;
  sessions: InterviewSession[];
  onStartInterview: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, sessions, onStartInterview }) => {
  const [showHistory, setShowHistory] = useState(false);
  const totalSessions = sessions.length;
  
  const avgScore = totalSessions > 0 
    ? Math.round(sessions.reduce((acc, s) => {
        const sessionAvg = s.answers.reduce((sum, a) => sum + a.score, 0) / (s.answers.length || 1);
        return acc + sessionAvg;
      }, 0) / totalSessions)
    : 0;

  const hasCoding = sessions.some(s => s.type === InterviewType.CODING);
  const hasTechnical = sessions.some(s => s.type === InterviewType.TECHNICAL);
  const readiness = totalSessions > 0 
    ? Math.min(100, Math.round((avgScore * 0.7) + (totalSessions * 2) + (hasCoding && hasTechnical ? 10 : 0))) 
    : 0;

  const chartData = sessions.length > 0 
    ? sessions.slice(-10).map((s, i) => ({
        name: s.type === InterviewType.CODING ? 'Code' : 'Mock',
        score: Math.round(s.answers.reduce((sum, a) => sum + a.score, 0) / (s.answers.length || 1))
      }))
    : [{ name: 'N/A', score: 0 }];

  const getDomainAvg = (type: InterviewType) => {
    const domainSessions = sessions.filter(s => s.type === type);
    if (domainSessions.length === 0) return 0;
    return Math.round(domainSessions.reduce((acc, s) => {
      return acc + (s.answers.reduce((sum, a) => sum + a.score, 0) / (s.answers.length || 1));
    }, 0) / domainSessions.length);
  };

  const skillData = [
    { name: 'Technical', value: getDomainAvg(InterviewType.TECHNICAL), color: '#4F46E5' },
    { name: 'System Design', value: getDomainAvg(InterviewType.SYSTEM_DESIGN), color: '#F59E0B' },
    { name: 'Coding', value: getDomainAvg(InterviewType.CODING), color: '#EC4899' },
    { name: 'Consistency', value: Math.min(100, user.streak * 10), color: '#10B981' },
  ];

  const recentSessions = sessions.slice(-4).reverse();

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {showHistory && (
        <SessionHistory 
          sessions={sessions} 
          isModal={true} 
          onClose={() => setShowHistory(false)} 
        />
      )}

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Performance Hub</h2>
          <p className="text-slate-500 mt-1 font-medium">Tracking progress for <span className="text-indigo-600">{user.targetRole}</span></p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowHistory(true)}
            className="flex items-center justify-center gap-2 bg-white text-slate-600 border border-slate-200 px-6 py-4 rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <History size={20} />
            <span className="font-bold">History</span>
          </button>
          <button 
            onClick={onStartInterview}
            className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 transform hover:-translate-y-1 active:scale-95"
          >
            <PlayCircle size={20} />
            <span className="font-bold">Start Session</span>
          </button>
        </div>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total XP', value: user.totalScore.toLocaleString(), icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Avg. Accuracy', value: `${avgScore}%`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Daily Streak', value: user.streak, icon: Flame, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Readiness', value: `${readiness}%`, icon: ShieldCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center text-center transition-all hover:shadow-md">
            <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4`}>
              <stat.icon size={28} />
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{stat.label}</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-900">Performance Trends</h3>
            <span className="text-xs font-bold text-slate-400 uppercase">Last 10 Activities</span>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#4f46e5" 
                  strokeWidth={4} 
                  dot={{ r: 6, fill: '#4f46e5', strokeWidth: 3, stroke: '#fff' }}
                  activeDot={{ r: 8, strokeWidth: 0 }}
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h3 className="text-xl font-bold text-slate-900 mb-8">Skill Matrix</h3>
          <div className="space-y-8">
            {skillData.map((skill, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-600">{skill.name}</span>
                  <span className="text-sm font-black text-indigo-600">{skill.value}%</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${skill.value}%`, backgroundColor: skill.color }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
            <p className="text-xs text-indigo-700 font-medium leading-relaxed">
              <ShieldCheck size={14} className="inline mr-1 mb-1" />
              Your system design scores are trending up. Focus on high-level architecture to reach 90% readiness.
            </p>
          </div>
        </div>
      </div>

      {/* Recent History */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-bold text-slate-900">Recent Activity</h3>
          <button onClick={() => setShowHistory(true)} className="text-indigo-600 text-sm font-bold hover:underline">View All</button>
        </div>
        {recentSessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-[2rem] border border-transparent hover:border-indigo-100 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 border-white shadow-sm ${
                    session.type === InterviewType.CODING ? 'bg-pink-100 text-pink-600' : 'bg-indigo-100 text-indigo-600'
                  }`}>
                    {session.type === InterviewType.CODING ? <Code size={20} /> : <MessageSquare size={20} />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{session.type === InterviewType.CODING ? 'Coding Challenge' : 'Technical Interview'}</p>
                    <p className="text-xs text-slate-400 font-medium">{new Date(session.startTime).toLocaleDateString()} • {session.answers.length} Tasks</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-indigo-600">
                    {Math.round(session.answers.reduce((acc, curr) => acc + curr.score, 0) / (session.answers.length || 1))}%
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Score</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
              <Target size={40} />
            </div>
            <p className="text-slate-400 font-medium">No activity logged yet. Start practicing to see your analytics!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
