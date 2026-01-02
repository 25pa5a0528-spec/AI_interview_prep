
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, Send, AlertCircle, Loader2, CheckCircle2, ArrowRight, Clock, Briefcase, Zap, ShieldCheck, User, BookOpen, ChevronRight, Award, ThumbsUp, ThumbsDown, ShieldAlert, LogOut, FastForward, Info, Shield, ListChecks, Building2 } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { InterviewType, Difficulty, Question, UserProfile, SUPPORTED_ROLES, ExamConfig, EvaluationResult } from '../types';

interface InterviewSessionProps {
  user: UserProfile;
  onComplete: (session: any) => void;
  onCancel: () => void;
  onAnswerEvaluated: (score: number) => void;
  examConfig?: ExamConfig;
}

const InterviewSession: React.FC<InterviewSessionProps> = ({ user, onComplete, onCancel, onAnswerEvaluated, examConfig }) => {
  const [step, setStep] = useState<'config' | 'loading' | 'guidelines' | 'active' | 'review' | 'suspended'>(examConfig ? 'loading' : 'config');
  const [type, setType] = useState<InterviewType>(examConfig?.type || InterviewType.TECHNICAL);
  const [difficulty, setDifficulty] = useState<Difficulty>(examConfig?.difficulty || Difficulty.INTERMEDIATE);
  const [selectedRole, setSelectedRole] = useState(examConfig?.role || user.targetRole || SUPPORTED_ROLES[0]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState(180);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (examConfig && step === 'active') {
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          handleSuspension();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
  }, [examConfig, step]);

  const handleSuspension = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setStep('suspended');
  };

  useEffect(() => {
    if (examConfig) {
      startInterview();
    }
  }, [examConfig]);

  const startInterview = async () => {
    setStep('loading');
    setError(null);
    try {
      const qs = await geminiService.generateQuestions(selectedRole, type, difficulty);
      if (!qs || qs.length === 0) throw new Error("Failed to generate questions.");
      setQuestions(qs);
      setStep('guidelines'); 
    } catch (err: any) {
      setError(err.message || "An error occurred.");
      setStep('config');
    }
  };

  const beginActualAssessment = () => {
    if (!acceptedTerms) return;
    setStep('active');
    startTimer();
  };

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(180);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          submitAnswer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [currentIndex, questions]);

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setUserInput('');
      startTimer();
    } else {
      setStep('review');
    }
  };

  const submitAnswer = async () => {
    if (isEvaluating || questions.length === 0) return;
    setIsEvaluating(true);
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const currentQ = questions[currentIndex];
      const currentQuestionText = currentQ?.text || "No question text";
      const evaluation = await geminiService.evaluateAnswer(currentQuestionText, userInput || "No answer provided.", type);
      
      onAnswerEvaluated(evaluation.score); 

      const result = {
        questionId: currentQ.id,
        questionText: currentQuestionText,
        answerText: userInput,
        score: evaluation.score,
        evaluation
      };

      setResults(prev => [...prev, result]);
      setIsEvaluating(false);
      handleNext();
    } catch (err) {
      console.error(err);
      setIsEvaluating(false);
      handleNext(); 
    }
  };

  const handlePassQuestion = async () => {
    if (isEvaluating || questions.length === 0) return;
    setIsEvaluating(true);
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const currentQ = questions[currentIndex];
      
      const evaluation: EvaluationResult = {
        score: 0,
        relevance: 0,
        correctness: 0,
        grammar: 0,
        sentiment: "Neutral",
        feedback: "Question was passed by the candidate. Zero score attributed for this task.",
        strengths: [],
        weaknesses: ["Question was not attempted."],
        idealAnswer: "The candidate skipped this technical challenge."
      };

      try {
        const aiEval = await geminiService.evaluateAnswer(currentQ.text, "The candidate skipped this question.", type);
        evaluation.idealAnswer = aiEval.idealAnswer;
      } catch (e) {
        evaluation.idealAnswer = "Please review the relevant documentation for this technical concept.";
      }

      onAnswerEvaluated(0);

      const result = {
        questionId: currentQ.id,
        questionText: currentQ.text,
        answerText: "[SKIPPED]",
        score: 0,
        evaluation
      };

      setResults(prev => [...prev, result]);
      setIsEvaluating(false);
      handleNext();
    } catch (err) {
      setIsEvaluating(false);
      handleNext();
    }
  };

  const finalizeSuspension = () => {
    onComplete({ 
      type, 
      answers: results, 
      startTime: Date.now(), 
      status: 'VIOLATION_TAB_SWITCH' 
    });
  };

  const handleVoiceToggle = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition not supported in this browser.");
      return;
    }
    if (isRecording) {
      setIsRecording(false);
      // @ts-ignore
      window.recognition?.stop();
    } else {
      setIsRecording(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results).map((result: any) => result[0].transcript).join('');
        setUserInput(transcript);
      };
      recognition.onend = () => setIsRecording(false);
      recognition.start();
      // @ts-ignore
      window.recognition = recognition;
    }
  };

  if (step === 'suspended') {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 animate-fadeIn">
        <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border-4 border-red-100 text-center">
          <div className="w-24 h-24 bg-red-50 text-red-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner animate-pulse">
            <ShieldAlert size={48} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4">Exam Suspended</h2>
          <p className="text-slate-500 font-medium mb-8">
            Security violation detected: <span className="text-red-600 font-bold">Unauthorized Tab/Window Switch</span>. 
            Assessments require a fixed browser focus.
          </p>
          <div className="p-6 bg-red-50 rounded-2xl border border-red-100 text-left mb-10">
            <p className="text-xs font-bold text-red-800 uppercase tracking-widest mb-2 flex items-center gap-2">
              <AlertCircle size={14} /> Protocol Violation Logged
            </p>
            <ul className="text-sm text-red-700 space-y-2">
              <li>• Attempt ID: {examConfig?.id || 'PRACTICE'}</li>
              <li>• Timestamp: {new Date().toLocaleTimeString()}</li>
              <li>• Status: Forced Termination</li>
            </ul>
          </div>
          <button 
            onClick={finalizeSuspension}
            className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl"
          >
            <LogOut size={20} /> Terminate & Report Session
          </button>
        </div>
      </div>
    );
  }

  if (step === 'config') {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100">
          <h2 className="text-3xl font-black text-slate-900 mb-2 flex items-center gap-2">
            <Briefcase className="text-indigo-600" />
            Interview Lab
          </h2>
          <p className="text-slate-500 mb-8 font-medium">Configure your custom AI assessment environment.</p>
          
          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block">Target Role</label>
              <select 
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 transition-all font-bold text-slate-700 outline-none"
              >
                {SUPPORTED_ROLES.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block">Assessment Round</label>
              <div className="grid grid-cols-2 gap-3">
                {[InterviewType.TECHNICAL, InterviewType.CODING, InterviewType.SYSTEM_DESIGN, InterviewType.APTITUDE].map(t => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`p-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                      type === t ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-400'
                    }`}
                  >
                    {t.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              {!examConfig && (
                <button onClick={onCancel} className="flex-1 px-6 py-4 border border-slate-200 text-slate-400 font-bold rounded-2xl hover:bg-slate-50 uppercase tracking-widest text-xs">Dismiss</button>
              )}
              <button onClick={startInterview} className="flex-1 px-6 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 uppercase tracking-widest text-xs">Launch AI</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] animate-pulse">
        <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white mb-8 shadow-2xl animate-bounce">
          <Zap size={32} />
        </div>
        <h3 className="text-2xl font-black text-slate-900">Synthesizing {selectedRole} Exam...</h3>
        <p className="text-slate-500 font-medium mt-2 text-center max-w-sm">Generating bespoke challenges for your assessment session.</p>
      </div>
    );
  }

  if (step === 'guidelines') {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 animate-fadeIn">
        <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 text-indigo-600">
            <Shield size={120} />
          </div>
          
          <header className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-indigo-600 text-white p-2 rounded-lg"><Info size={20} /></span>
              <h2 className="text-3xl font-black text-slate-900">Assessment Briefing</h2>
            </div>
            {examConfig && (
               <div className="mb-6 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center gap-4">
                  {examConfig.companyLogo ? (
                    <img src={examConfig.companyLogo} className="w-10 h-10 rounded-xl object-cover" />
                  ) : (
                    <Building2 className="text-indigo-400" />
                  )}
                  <p className="text-sm font-bold text-slate-700">Official Assessment by {examConfig.companyName}</p>
               </div>
            )}
            <p className="text-slate-500 font-medium text-lg italic">Please review the following session parameters before beginning.</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            <div className="space-y-6">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <ListChecks size={14} /> Exam Specifications
              </h4>
              <ul className="space-y-4">
                <li className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600 shadow-inner">
                    <Briefcase size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400">Target Role</p>
                    <p className="font-bold text-slate-800">{selectedRole}</p>
                  </div>
                </li>
                <li className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600 shadow-inner">
                    <Award size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400">Complexity</p>
                    <p className="font-bold text-slate-800">{difficulty}</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <ShieldCheck size={14} /> Proctoring Guidelines
              </h4>
              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4">
                <div className="flex gap-3">
                   <div className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0" />
                   <p className="text-sm text-slate-600 leading-relaxed font-medium">
                     <span className="font-black text-slate-900">Tab Focus Locked:</span> Leaving this window or switching tabs will result in instant session termination.
                   </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8 p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-start gap-4 transition-all hover:bg-indigo-50 group">
            <input 
              type="checkbox" 
              id="terms" 
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="w-6 h-6 rounded-lg border-2 border-indigo-200 text-indigo-600 focus:ring-indigo-500 cursor-pointer mt-0.5"
            />
            <label htmlFor="terms" className="text-sm text-indigo-900 font-medium leading-relaxed cursor-pointer select-none">
              I acknowledge that I have read and understood the assessment guidelines. I agree to the <span className="font-black underline decoration-2 underline-offset-4 hover:text-indigo-700">Terms & Conditions</span>.
            </label>
          </div>

          <div className="pt-8 border-t border-slate-100 flex gap-4">
            {!examConfig && (
              <button onClick={onCancel} className="flex-1 py-5 border border-slate-200 text-slate-400 font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-slate-50 transition-all">
                Cancel
              </button>
            )}
            <button 
              onClick={beginActualAssessment}
              disabled={!acceptedTerms}
              className={`flex-[2] py-5 font-black uppercase tracking-widest text-sm rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 ${
                acceptedTerms 
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100' 
                : 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'
              }`}
            >
              Begin Assessment <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'active') {
    const currentQ = questions[currentIndex];
    if (!currentQ) return null;

    return (
      <div className="max-w-4xl mx-auto py-12 px-4 animate-fadeIn">
        {examConfig && (
          <div className="mb-8 p-4 bg-indigo-600 rounded-2xl text-white shadow-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              {examConfig.companyLogo ? (
                <img src={examConfig.companyLogo} className="w-8 h-8 rounded-lg object-cover border border-white/20" />
              ) : (
                <ShieldCheck />
              )}
              <span className="font-bold uppercase tracking-widest text-xs">High-Stakes Session: {examConfig.companyName}</span>
            </div>
            <span className="text-[10px] font-black bg-indigo-500 px-3 py-1 rounded-full">{examConfig.id}</span>
          </div>
        )}
        <div className="flex items-center justify-between mb-8">
          <span className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest">Task {currentIndex + 1} of {questions.length}</span>
          <div className="flex items-center gap-2 font-mono font-bold text-xl text-slate-700 bg-white px-5 py-2 rounded-2xl border border-slate-100 shadow-sm">
            <Clock size={20} className="text-indigo-500" />
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
        </div>
        <div className="bg-white p-12 rounded-[3.5rem] shadow-xl border border-slate-100 mb-8 min-h-[220px] flex items-center relative overflow-hidden group">
          <div className="absolute left-0 top-0 w-2 h-full bg-indigo-600" />
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight pr-4">{currentQ.text}</h2>
        </div>
        <div className="space-y-4">
          <div className="relative group">
            <textarea
              autoFocus
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Structure your professional response here..."
              className="w-full h-64 p-10 bg-white border-2 border-slate-100 rounded-[3rem] focus:border-indigo-600 focus:ring-0 text-xl transition-all resize-none shadow-sm outline-none"
            />
            <div className="absolute right-8 bottom-8 flex gap-3">
              <button onClick={handleVoiceToggle} className={`p-5 rounded-2xl transition-all shadow-lg ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                <Mic size={24} />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <button 
              onClick={handlePassQuestion}
              disabled={isEvaluating}
              className="flex items-center gap-2 px-8 py-5 text-slate-400 font-black uppercase tracking-widest text-xs hover:text-indigo-600 transition-colors"
            >
              <FastForward size={18} /> Pass Question
            </button>
            <button 
              onClick={submitAnswer} 
              disabled={isEvaluating} 
              className="bg-indigo-600 text-white px-12 py-5 rounded-[2rem] font-black uppercase tracking-widest text-sm flex items-center gap-3 hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-100 disabled:opacity-50 active:scale-95"
            >
              {isEvaluating ? <Loader2 className="animate-spin" /> : <><Send size={20} /> {currentIndex < questions.length - 1 ? 'Save & Next Question' : 'Finish Assessment'}</>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'review') {
    const totalScore = results.reduce((acc, curr) => acc + curr.score, 0);
    const avgScore = results.length > 0 ? Math.round(totalScore / results.length) : 0;

    return (
      <div className="max-w-5xl mx-auto py-12 px-4 animate-fadeIn">
        <div className="bg-white p-12 rounded-[4rem] shadow-2xl border border-slate-100 text-center mb-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600" />
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-4xl font-black text-slate-900 mb-2">Assessment Results Finalized</h2>
          <p className="text-slate-500 font-medium mb-4 max-w-sm mx-auto">Your technical artifacts have been analyzed by AI. Review all answers and benchmarks below.</p>
          
          <div className="flex items-center justify-center gap-4 mb-10">
            <div className="bg-slate-50 px-8 py-4 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aggregate Score</p>
              <p className={`text-3xl font-black ${avgScore >= 70 ? 'text-emerald-600' : 'text-indigo-600'}`}>{avgScore}%</p>
            </div>
            <div className="bg-slate-50 px-8 py-4 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Questions Attempted</p>
              <p className="text-3xl font-black text-slate-900">{results.length}</p>
            </div>
          </div>

          <button onClick={() => onComplete({ type, answers: results, startTime: Date.now() })} className="bg-indigo-600 text-white px-12 py-5 rounded-[2rem] font-black uppercase tracking-widest text-sm hover:bg-indigo-700 shadow-2xl shadow-indigo-100 active:scale-95 transition-all">
            {examConfig ? "Finalize & Report Session" : "Return to My Dashboard"}
          </button>
        </div>

        <div className="space-y-10 pb-32">
          <h3 className="text-2xl font-black text-slate-900 border-l-4 border-indigo-600 pl-4 mb-8">Detailed Question Review</h3>
          {results.map((res, idx) => (
            <div key={idx} className="bg-white rounded-[3rem] shadow-lg border border-slate-100 overflow-hidden animate-slideUp" style={{ animationDelay: `${idx * 0.1}s` }}>
              <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row items-start justify-between gap-6">
                <div className="flex-1">
                  <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full mb-3 inline-block">Challenge Artifact {idx + 1}</span>
                  <h4 className="text-2xl font-black text-slate-900 leading-tight">{res.questionText}</h4>
                </div>
                <div className="text-center bg-slate-50 p-6 rounded-[2rem] min-w-[120px] border border-slate-100">
                  <span className={`text-3xl font-black ${res.score >= 70 ? 'text-emerald-600' : 'text-indigo-600'}`}>{res.score}%</span>
                  <p className="text-[8px] font-bold uppercase text-slate-400 mt-1">AI Score</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

export default InterviewSession;
