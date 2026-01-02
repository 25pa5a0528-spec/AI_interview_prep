
import React, { useState, useEffect, useRef } from 'react';
import { Play, Terminal, Zap, CheckCircle2, AlertTriangle, Loader2, BookOpen, Copy, Check, Maximize2, Minimize2, RefreshCw, ChevronUp, ChevronDown, MoreVertical } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { UserProfile, CodingChallenge } from '../types';

interface CodingLabProps {
  user: UserProfile;
  onComplete: (score: number) => void;
}

const CodingLab: React.FC<CodingLabProps> = ({ user, onComplete }) => {
  const [activeChallenge, setActiveChallenge] = useState<CodingChallenge | null>(null);
  const [lang, setLang] = useState<'python' | 'java' | 'cpp'>('python');
  const [code, setCode] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [editorHeight, setEditorHeight] = useState<number>(500); // Default height
  const [output, setOutput] = useState<any>(null);
  
  const editorRef = useRef<HTMLDivElement>(null);

  const fetchNewChallenge = async () => {
    setIsFetching(true);
    try {
      const challenge = await geminiService.generateCodingChallenge(user.targetRole);
      setActiveChallenge(challenge);
      setCode(challenge.starterCode[lang]);
      setOutput(null);
      setShowSolution(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchNewChallenge();
  }, [user.targetRole]);

  const runCode = async () => {
    if (!activeChallenge) return;
    setIsRunning(true);
    setOutput(null);
    try {
      const result = await geminiService.validateCode(activeChallenge.description, lang, code);
      setOutput(result);
      if (result.score >= 1) {
        onComplete(result.score);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopySolution = () => {
    if (output?.optimalSolution) {
      navigator.clipboard.writeText(output.optimalSolution);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const adjustHeight = (delta: number) => {
    setEditorHeight(prev => Math.max(300, Math.min(1200, prev + delta)));
  };

  if (isFetching || !activeChallenge) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <RefreshCw className="animate-spin text-indigo-600 mb-4" size={40} />
        <p className="text-slate-500 font-bold">Synthesizing Challenge for {user.targetRole}...</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-6 animate-fadeIn ${isFullScreen ? 'fixed inset-0 z-[60] bg-slate-50 p-6 overflow-hidden' : 'h-full'}`}>
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{activeChallenge.title}</h2>
          <p className="text-slate-500 text-sm">Targeted Challenge: <span className="text-indigo-600 font-bold">{activeChallenge.difficulty}</span></p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchNewChallenge} className="flex items-center gap-2 text-indigo-600 font-bold hover:bg-indigo-50 px-4 py-2 rounded-xl transition-all">
            <RefreshCw size={18} /> New Task
          </button>
        </div>
      </header>

      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${isFullScreen ? 'flex-1 overflow-hidden' : ''}`}>
        <div className="flex flex-col gap-6 overflow-hidden" style={{ minHeight: isFullScreen ? 'auto' : '500px' }}>
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col flex-1 overflow-y-auto custom-scrollbar">
            <p className="text-slate-600 leading-relaxed mb-6 whitespace-pre-wrap">{activeChallenge.description}</p>
            {output && (
              <div className="mt-4 pt-4 border-t border-slate-100 animate-slideUp">
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-lg font-black ${output.status.toLowerCase().includes('accepted') ? 'text-emerald-600' : 'text-amber-600'}`}>{output.status}</span>
                  <button onClick={() => setShowSolution(!showSolution)} className="text-xs font-bold text-indigo-600 uppercase flex items-center gap-1"><BookOpen size={14} /> {showSolution ? "Hide Sol" : "View Sol"}</button>
                </div>
                {showSolution ? (
                  <div className="relative bg-slate-900 rounded-2xl p-4 border border-slate-800">
                    <pre className="text-indigo-200 text-xs overflow-x-auto whitespace-pre-wrap font-mono"><code>{output.optimalSolution}</code></pre>
                    <button onClick={handleCopySolution} className="absolute top-2 right-2 p-2 bg-slate-800 text-white rounded-lg">{copied ? <Check size={14}/> : <Copy size={14}/>}</button>
                  </div>
                ) : (
                  <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100"><p className="text-xs text-indigo-900 italic">"{output.feedback}"</p></div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col h-full overflow-hidden">
          <div 
            ref={editorRef}
            className={`bg-[#1e1e1e] rounded-[2rem] overflow-hidden flex flex-col shadow-2xl border border-slate-800 transition-all ${!isFullScreen ? 'resize-y' : ''}`}
            style={{ 
              height: isFullScreen ? '100%' : `${editorHeight}px`,
              minHeight: '300px'
            }}
          >
            {/* Editor Toolbar */}
            <div className="bg-[#252526] px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <select value={lang} onChange={(e) => setLang(e.target.value as any)} className="bg-slate-800 text-slate-300 text-xs font-bold rounded-lg px-3 py-1.5 outline-none border-none focus:ring-1 focus:ring-indigo-500">
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                </select>
                
                <div className="h-4 w-px bg-slate-700 mx-1"></div>
                
                {/* Manual Height Controls */}
                <div className="hidden md:flex items-center gap-1">
                  <button 
                    onClick={() => setEditorHeight(300)} 
                    title="Minimize Height"
                    className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded transition-colors"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button 
                    onClick={() => setEditorHeight(800)} 
                    title="Maximize Height"
                    className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded transition-colors"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>
                
                <button 
                  onClick={() => setIsFullScreen(!isFullScreen)} 
                  className={`p-1.5 rounded transition-colors ${isFullScreen ? 'text-indigo-400 bg-slate-800' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
                  title={isFullScreen ? "Exit Full Screen" : "Full Screen Mode"}
                >
                  {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
              </div>
              
              <div className="flex items-center gap-3">
                <button onClick={runCode} disabled={isRunning} className="bg-indigo-600 text-white px-5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-900/20">
                  {isRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />} 
                  <span className="hidden sm:inline">Evaluate</span>
                </button>
              </div>
            </div>

            <div className="flex-1 relative">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="absolute inset-0 w-full h-full bg-transparent text-indigo-100 font-mono text-base p-8 resize-none focus:ring-0 border-none outline-none leading-relaxed overflow-y-auto custom-scrollbar"
                spellCheck={false}
                placeholder="// Write your solution here..."
              />
              {/* Resizable Handle Indicator */}
              {!isFullScreen && (
                <div className="absolute bottom-1 right-1 pointer-events-none text-slate-700">
                  <MoreVertical size={12} className="rotate-45" />
                </div>
              )}
            </div>
          </div>
          
          <p className="mt-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">
            Tip: You can drag the bottom-right corner of the editor to adjust height manually.
          </p>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; } 
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .resize-y { resize: vertical; overflow: hidden; }
      `}</style>
    </div>
  );
};

export default CodingLab;
