
import React, { useState } from 'react';
import { Clock, Calendar, ChevronDown, ChevronUp, MessageSquare, Code, BookOpen, User, Zap, AlertCircle, X, ShieldCheck, Award } from 'lucide-react';
import { InterviewSession, InterviewType } from '../types';

interface SessionHistoryProps {
  sessions: InterviewSession[];
  onClose?: () => void;
  isModal?: boolean;
}

const SessionHistory: React.FC<SessionHistoryProps> = ({ sessions, onClose, isModal }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const content = (
    <div className={`space-y-4 ${isModal ? 'max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar' : ''}`}>
      {sessions.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="mx-auto text-slate-300 mb-4" size={48} />
          <p className="text-slate-500 font-medium">No sessions recorded yet.</p>
        </div>
      ) : (
        sessions.map((session) => {
          const isExpanded = expandedId === session.id;
          const totalScore = session.answers.reduce((acc, a) => acc + (a.score || 0), 0);
          const avgScore = session.answers.length > 0 ? Math.round(totalScore / session.answers.length) : 0;
          const dateStr = new Date(session.startTime).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });

          return (
            <div key={session.id} className={`rounded-3xl shadow-sm border overflow-hidden transition-all ${session.examId ? 'border-emerald-100 bg-white' : 'border-slate-100 bg-white'}`}>
              <div 
                onClick={() => toggleExpand(session.id)}
                className="p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    session.examId 
                      ? 'bg-emerald-100 text-emerald-600' 
                      : (session.type === InterviewType.CODING ? 'bg-pink-100 text-pink-600' : 'bg-indigo-100 text-indigo-600')
                  }`}>
                    {session.examId ? <ShieldCheck size={20} /> : (session.type === InterviewType.CODING ? <Code size={20} /> : <MessageSquare size={20} />)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">
                        {session.examId ? 'Corporate Assessment' : `${session.type.replace('_', ' ')} Practice`}
                      </h4>
                      {session.examId && (
                        <span className="text-[8px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1">
                          <Award size={8} /> Verified
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Calendar size={10} /> {dateStr}
                      </p>
                      {session.examId && (
                        <p className="text-[10px] font-mono font-bold text-emerald-600/60 uppercase">
                          ID: {session.examId}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className={`text-lg font-black ${avgScore >= 80 ? 'text-emerald-600' : avgScore >= 50 ? 'text-indigo-600' : 'text-red-600'}`}>
                      {avgScore}%
                    </p>
                    <p className="text-[8px] font-bold uppercase text-slate-400 tracking-tighter">Final Score</p>
                  </div>
                  {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                </div>
              </div>

              {isExpanded && (
                <div className="p-6 border-t border-slate-50 bg-slate-50/30 space-y-4 animate-slideUp">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detailed Performance Breakdowns</span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{session.answers.length} Tasks Recorded</span>
                  </div>
                  {session.answers.map((ans, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Artifact {idx + 1}</span>
                        <span className={`text-sm font-black ${ans.score >= 80 ? 'text-emerald-600' : 'text-indigo-600'}`}>{ans.score}%</span>
                      </div>
                      <p className="text-xs text-slate-600 italic mb-4 line-clamp-2">"{ans.answerText}"</p>
                      <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                        <div className="flex items-center gap-1 mb-1 text-indigo-600">
                          <BookOpen size={12} />
                          <span className="text-[9px] font-black uppercase tracking-widest">AI Feedback Artifact</span>
                        </div>
                        <p className="text-[11px] text-indigo-900 leading-relaxed font-medium">{ans.evaluation?.feedback || ans.feedback}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
        <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Career History</h2>
              <p className="text-slate-500 text-sm font-medium">Review your practice and verified assessment artifacts.</p>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl transition-colors text-slate-400">
              <X size={24} />
            </button>
          </div>
          <div className="p-8 flex-1 overflow-hidden">
            {content}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
       <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-slate-900">Detailed History</h3>
      </div>
      {content}
    </div>
  );
};

export default SessionHistory;
