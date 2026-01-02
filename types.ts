
export enum UserRole {
  GUEST = 'GUEST',
  CANDIDATE = 'CANDIDATE',
  RECRUITER = 'RECRUITER'
}

export enum InterviewType {
  TECHNICAL = 'TECHNICAL',
  CODING = 'CODING',
  SYSTEM_DESIGN = 'SYSTEM_DESIGN',
  APTITUDE = 'APTITUDE'
}

export enum Difficulty {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  EXPERT = 'EXPERT'
}

export const SUPPORTED_ROLES = [
  'Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'Mobile App Developer', 'Data Analyst', 'Data Scientist', 'Machine Learning Engineer',
  'DevOps Engineer', 'Cloud Engineer', 'QA Engineer', 'Automation Test Engineer',
  'UI/UX Designer', 'Cybersecurity Engineer', 'System Administrator', 'Product Manager', 'Project Manager'
];

export interface UserProfile {
  name: string;
  email: string;
  education: string;
  skills: string[];
  targetRole: string;
  experienceLevel: string;
  avatar: string;
  streak: number;
  lastInterviewDate: string | null;
  totalScore: number;
  role: UserRole;
}

export interface CompanyProfile {
  name: string;
  logo: string;
}

export interface ExamConfig {
  id: string;
  companyName: string;
  companyLogo?: string; // Brand logo for the exam environment
  role: string;
  difficulty: Difficulty;
  type: InterviewType;
  createdAt: number;
  creatorEmail: string; 
  invitedEmails?: string[]; 
}

export interface Question {
  id: string;
  text: string;
  type: InterviewType;
  difficulty: Difficulty;
  idealKeywords: string[];
}

export interface InterviewSession {
  id: string;
  type: InterviewType;
  startTime: number;
  examId?: string;
  userEmail?: string;
  candidateName?: string; 
  questions: Question[];
  currentQuestionIndex: number;
  answers: {
    questionId: string;
    answerText: string;
    score: number;
    feedback: string;
    evaluation: EvaluationResult;
  }[];
}

export interface EvaluationResult {
  score: number;
  relevance: number;
  correctness: number;
  grammar: number;
  sentiment: string;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  idealAnswer: string; 
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  streak: number;
  isCurrentUser?: boolean;
  examId?: string;
}

export interface ResumeAnalysis {
  score: number;
  summary: string;
  suggestedImprovements: string[];
  matchingScore: number;
  skillGaps: string[];
  suggestedRoles: string[]; 
}

export interface CodingChallenge {
  id: string;
  title: string;
  difficulty: string;
  points: number;
  description: string;
  starterCode: {
    python: string;
    java: string;
    cpp: string;
  };
}
