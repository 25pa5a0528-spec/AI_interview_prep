import React, { useState } from 'react';
import { FileText, Upload, Sparkles, AlertCircle, CheckCircle, TrendingUp, Briefcase } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { ResumeAnalysis, UserProfile } from '../types';

interface ResumeAnalyzerProps {
  user: UserProfile;
}

const ResumeAnalyzer: React.FC<ResumeAnalyzerProps> = ({ user }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const analyzeResume = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    try {
      // In a real app, we'd extract text from PDF. 
      // For this demo, we simulate extraction using the file name and existing profile data
      const mockResumeText = `Resume of ${user.name}. 
      Current Role: ${user.targetRole}. 
      Skills: ${user.skills.join(', ')}. 
      Education: ${user.education}.
      Experience: ${user.experienceLevel} level candidate with focus on modern tech stacks.
      Filename: ${file.name}`;
      
      const result = await geminiService.analyzeResume(mockResumeText, user.targetRole);
      setAnalysis(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      <header>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">AI Resume Intelligence</h2>
        <p className="text-slate-500 mt-1 font-medium">Extracting deep career insights and matching you with optimal roles.</p>
      </header>

      {!analysis ? (
        <div className="bg-white p-16 rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner">
            <Upload size={40} />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-3">Upload CV Artifact</h3>
          <p className="text-slate-500 max-w-sm mb-10 font-medium">
            Our AI will parse your technical journey, suggest ideal job titles, and score your market readiness.
          </p>
          
          <input 
            type="file" 
            id="resume-upload" 
            className="hidden" 
            onChange={handleFileUpload}
            accept=".pdf,.doc,.docx"
          />
          <label 
            htmlFor="resume-upload"
            className="bg-indigo-600 text-white px-10 py-5 rounded-[2rem] font-black cursor-pointer hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-100 flex items-center gap-3 active:scale-95"
          >
            {file ? file.name : "Select Document"}
            {file && <CheckCircle size={24} />}
          </label>

          {file && (
            <button 
              onClick={analyzeResume}
              disabled={isAnalyzing}
              className="mt-8 bg-slate-900 text-white px-10 py-4 rounded-2xl font-black hover:bg-slate-800 transition-all flex items-center gap-3 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <Sparkles className="animate-spin" size={20} />
                  Decoding Experience...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Initiate AI Audit
                </>
              )}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8 pb-12">
          {/* Top Score Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center text-center group hover:border-indigo-200 transition-all">
              <div className="w-20 h-20 rounded-[2rem] border-4 border-indigo-600 flex items-center justify-center mb-4 bg-indigo-50/30">
                <span className="text-3xl font-black text-indigo-600">{analysis.score}</span>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ATS Readiness</p>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center text-center group hover:border-emerald-200 transition-all">
              <div className="w-20 h-20 rounded-[2rem] border-4 border-emerald-500 flex items-center justify-center mb-4 bg-emerald-50/30">
                <span className="text-3xl font-black text-emerald-500">{analysis.matchingScore}%</span>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Market Alignment</p>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center text-center group hover:border-orange-200 transition-all">
              <div className="w-20 h-20 rounded-[2rem] bg-orange-50 text-orange-600 flex items-center justify-center mb-4">
                <TrendingUp size={36} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Growth Forecast</p>
            </div>
          </div>

          {/* Suggested Roles - NEW SECTION */}
          <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl border border-slate-800 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10 text-white">
                <Briefcase size={80} />
             </div>
             <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                <Sparkles className="text-indigo-400" />
                AI-Matched Roles
             </h3>
             <div className="flex flex-wrap gap-4">
                {analysis.suggestedRoles.map((role, i) => (
                  <div key={i} className="bg-indigo-600/20 border border-indigo-500/30 px-6 py-4 rounded-2xl flex items-center gap-3 transition-all hover:bg-indigo-600/30 group">
                    <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white font-black text-lg">
                      {i + 1}
                    </div>
                    <span className="text-indigo-100 font-bold tracking-tight">{role}</span>
                  </div>
                ))}
             </div>
             <p className="text-indigo-300/60 text-[10px] font-bold uppercase tracking-widest mt-8">
               Based on semantic analysis of your skills and experience artifacts.
             </p>
          </div>

          <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
            <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
              <FileText className="text-indigo-600" size={28} />
              Experience Artifact Summary
            </h3>
            <p className="text-slate-600 leading-relaxed mb-10 font-medium text-lg">{analysis.summary}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
                <h4 className="font-black text-slate-900 mb-6 flex items-center gap-3">
                  <AlertCircle className="text-red-500" size={24} />
                  Missing Competitive Skills
                </h4>
                <div className="flex flex-wrap gap-3">
                  {analysis.skillGaps.map((skill, i) => (
                    <span key={i} className="px-4 py-2 bg-white text-red-600 rounded-xl text-xs font-black border border-red-50 shadow-sm uppercase tracking-wider">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div className="bg-indigo-50/30 p-8 rounded-[2.5rem] border border-indigo-50">
                <h4 className="font-black text-slate-900 mb-6 flex items-center gap-3">
                  <CheckCircle className="text-emerald-500" size={24} />
                  Impact Optimization Tips
                </h4>
                <ul className="space-y-4">
                  {analysis.suggestedImprovements.map((tip, i) => (
                    <li key={i} className="text-sm text-slate-600 flex items-start gap-3 font-medium">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 shrink-0 shadow-sm" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <button 
              onClick={() => setAnalysis(null)}
              className="text-slate-400 font-black hover:text-indigo-600 transition-all uppercase tracking-widest text-[10px] bg-white px-8 py-3 rounded-full border border-slate-100 shadow-sm"
            >
              Analyze New Document Version
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeAnalyzer;