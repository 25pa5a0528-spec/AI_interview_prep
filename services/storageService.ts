
import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp 
} from 'firebase/firestore';
import { UserProfile, InterviewSession, LeaderboardEntry, UserRole, CompanyProfile, ExamConfig } from '../types';

const COLLECTIONS = {
  USERS: 'users',
  SESSIONS: 'sessions',
  EXAMS: 'exams',
  COMPANIES: 'companies'
};

const DEFAULT_USER: UserProfile = {
  name: 'Candidate Name',
  email: '',
  education: 'Not Specified',
  skills: [],
  targetRole: 'Software Engineer',
  experienceLevel: 'Junior',
  avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=user`,
  streak: 0,
  lastInterviewDate: null,
  totalScore: 0,
  role: UserRole.GUEST
};

const sanitize = (data: any) => {
  return JSON.parse(JSON.stringify(data));
};

export const storageService = {
  getUser: async (email: string): Promise<UserProfile> => {
    if (!email) return DEFAULT_USER;
    try {
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, email));
      return userDoc.exists() ? (userDoc.data() as UserProfile) : { ...DEFAULT_USER, email };
    } catch (e) {
      console.error("Error fetching user", e);
      return { ...DEFAULT_USER, email };
    }
  },

  saveUser: async (user: UserProfile) => {
    if (!user.email) return;
    try {
      const sanitizedUser = sanitize(user);
      await setDoc(doc(db, COLLECTIONS.USERS, user.email), sanitizedUser, { merge: true });
    } catch (e) {
      console.error("Error saving user", e);
    }
  },

  getCompany: async (recruiterEmail: string): Promise<CompanyProfile> => {
    try {
      const companyDoc = await getDoc(doc(db, COLLECTIONS.COMPANIES, recruiterEmail));
      if (companyDoc.exists()) {
        return companyDoc.data() as CompanyProfile;
      }
      return {
        name: 'My Organization',
        logo: `https://api.dicebear.com/7.x/initials/svg?seed=Org`
      };
    } catch (e) {
      return { name: 'My Organization', logo: '' };
    }
  },

  saveCompany: async (recruiterEmail: string, profile: CompanyProfile) => {
    try {
      await setDoc(doc(db, COLLECTIONS.COMPANIES, recruiterEmail), sanitize(profile));
    } catch (e) {
      console.error("Error saving company", e);
    }
  },

  logout: () => {
    localStorage.removeItem('hirepulse_active_user_email');
  },

  saveExam: async (exam: ExamConfig) => {
    try {
      const sanitizedExam = sanitize(exam);
      await setDoc(doc(db, COLLECTIONS.EXAMS, exam.id), {
        ...sanitizedExam,
        timestamp: Timestamp.now()
      });
    } catch (e) {
      console.error("Error saving exam", e);
    }
  },

  getExamById: async (id: string): Promise<ExamConfig | undefined> => {
    try {
      const examDoc = await getDoc(doc(db, COLLECTIONS.EXAMS, id));
      return examDoc.exists() ? (examDoc.data() as ExamConfig) : undefined;
    } catch (e) {
      console.error("Error fetching exam", e);
      return undefined;
    }
  },

  getExamsByRecruiter: async (email: string): Promise<ExamConfig[]> => {
    try {
      const examsRef = collection(db, COLLECTIONS.EXAMS);
      const q = query(examsRef, where("creatorEmail", "==", email));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as ExamConfig);
    } catch (e) {
      console.error("Error fetching recruiter exams", e);
      return [];
    }
  },

  saveSession: async (session: InterviewSession) => {
    try {
      const sessionRef = doc(db, COLLECTIONS.SESSIONS, session.id);
      const sanitizedSession = sanitize(session);
      await setDoc(sessionRef, {
        ...sanitizedSession,
        timestamp: Timestamp.now()
      });
    } catch (e) {
      console.error("Error saving session", e);
    }
  },

  getSessions: async (userEmail?: string): Promise<InterviewSession[]> => {
    try {
      const sessionsRef = collection(db, COLLECTIONS.SESSIONS);
      let q;
      
      if (userEmail) {
        q = query(sessionsRef, where("userEmail", "==", userEmail));
      } else {
        q = query(sessionsRef, orderBy("timestamp", "desc"), limit(50));
      }
      
      const snapshot = await getDocs(q);
      let sessions = snapshot.docs.map(doc => doc.data() as InterviewSession);

      if (userEmail) {
        sessions.sort((a, b) => {
          const timeA = (a as any).timestamp?.toMillis() || a.startTime;
          const timeB = (b as any).timestamp?.toMillis() || b.startTime;
          return timeB - timeA;
        });
      }
      
      return sessions;
    } catch (e) {
      console.error("Error getting sessions", e);
      return [];
    }
  },

  getLeaderboard: async (examId?: string, recruiterEmail?: string): Promise<LeaderboardEntry[]> => {
    try {
      const sessionsRef = collection(db, COLLECTIONS.SESSIONS);
      let q;

      if (examId) {
        q = query(sessionsRef, where("examId", "==", examId));
      } else {
        q = query(sessionsRef, orderBy("timestamp", "desc"), limit(200));
      }

      const snapshot = await getDocs(q);
      let sessions = snapshot.docs.map(doc => doc.data() as InterviewSession);

      if (examId) {
        sessions.sort((a, b) => {
          const timeA = (a as any).timestamp?.toMillis() || a.startTime;
          const timeB = (b as any).timestamp?.toMillis() || b.startTime;
          return timeB - timeA;
        });
      }

      if (recruiterEmail) {
        const examsRef = collection(db, COLLECTIONS.EXAMS);
        const examsQuery = query(examsRef, where("creatorEmail", "==", recruiterEmail));
        const examsSnapshot = await getDocs(examsQuery);
        const myExamIds = examsSnapshot.docs.map(doc => doc.id);
        sessions = sessions.filter(s => s.examId && myExamIds.includes(s.examId));
      }

      const entries: LeaderboardEntry[] = sessions.map((s) => {
        const totalScore = s.answers.reduce((acc, a) => acc + a.score, 0);
        const avgScore = totalScore / (s.answers.length || 1);
        return {
          rank: 0,
          name: s.candidateName || `Candidate ${s.id.slice(-4)}`,
          score: Math.round(avgScore),
          streak: 0, 
          examId: s.examId
        };
      }).sort((a, b) => b.score - a.score);

      return entries.map((e, idx) => ({ ...e, rank: idx + 1 }));
    } catch (e) {
      console.error("Error getting leaderboard", e);
      return [];
    }
  }
};
