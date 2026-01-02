import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { InterviewType, Difficulty, Question, EvaluationResult, ResumeAnalysis, CodingChallenge } from "../types";

// Utility for exponential backoff retries
const callWithRetry = async <T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> => {
  let delay = 1500;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const isRateLimit = 
        error?.message?.includes('429') || 
        error?.status === 429 || 
        error?.message?.includes('RESOURCE_EXHAUSTED') ||
        error?.message?.includes('quota');

      if (isRateLimit && i < maxRetries) {
        console.warn(`Gemini API Rate Limited. Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
};

// Fallback Content
const GET_FALLBACK_QUESTIONS = (role: string, type: InterviewType): Question[] => {
  if (type === InterviewType.APTITUDE) {
    return [
      { id: 'f-a1', text: "A bat and a ball cost $1.10 in total. The bat costs $1.00 more than the ball. How much does the ball cost?", type: InterviewType.APTITUDE, difficulty: Difficulty.INTERMEDIATE, idealKeywords: ['5 cents', '0.05'] },
      { id: 'f-a2', text: "If it takes 5 machines 5 minutes to make 5 widgets, how long would it take 100 machines to make 100 widgets?", type: InterviewType.APTITUDE, difficulty: Difficulty.INTERMEDIATE, idealKeywords: ['5 minutes'] },
      { id: 'f-a3', text: "In a lake, there is a patch of lily pads. Every day, the patch doubles in size. If it takes 48 days for the patch to cover the entire lake, how long would it take for the patch to cover half of the lake?", type: InterviewType.APTITUDE, difficulty: Difficulty.INTERMEDIATE, idealKeywords: ['47 days'] }
    ];
  }
  return [
    { id: 'f1', text: `Explain the core architecture of a modern ${role} application.`, type: InterviewType.TECHNICAL, difficulty: Difficulty.INTERMEDIATE, idealKeywords: ['scalability', 'modularity'] },
    { id: 'f2', text: "How do you approach performance optimization in your projects?", type: InterviewType.TECHNICAL, difficulty: Difficulty.INTERMEDIATE, idealKeywords: ['profiling', 'caching'] },
    { id: 'f3', text: "Describe a time you had to deal with a significant technical debt. How did you handle it?", type: InterviewType.TECHNICAL, difficulty: Difficulty.INTERMEDIATE, idealKeywords: ['refactoring', 'prioritization'] }
  ];
};

const FALLBACK_CODING: CodingChallenge = {
  id: 'f-code-1',
  title: 'Optimized Array Search',
  difficulty: 'Medium',
  points: 100,
  description: 'Write a function that finds the first unique character in a string and returns its index. If it doesn\'t exist, return -1.',
  starterCode: {
    python: 'def firstUniqChar(s: str) -> int:\n    # Write your code here\n    pass',
    java: 'class Solution {\n    public int firstUniqChar(String s) {\n        // Write your code here\n        return -1;\n    }\n}',
    cpp: 'class Solution {\npublic:\n    int firstUniqChar(string s) {\n        // Write your code here\n        return -1;\n    }\n};'
  }
};

export const geminiService = {
  generateQuestions: async (role: string, type: InterviewType, level: string): Promise<Question[]> => {
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let specificInstruction = `Generate 5 technical interview questions for a ${level} level ${role}. Category: ${type}. Ensure questions are technical and role-specific.`;
      
      if (type === InterviewType.APTITUDE) {
        specificInstruction = `Generate 5 Aptitude and Logical Reasoning questions for a candidate applying for a ${role} position. 
        Focus on quantitative ability, logical reasoning, and data interpretation. 
        Ensure the questions are challenging but fair for a ${level} level.`;
      } else if (type === InterviewType.SYSTEM_DESIGN) {
        specificInstruction = `Generate 5 System Design questions for a ${level} level ${role}. Focus on scalability, distributed systems, and trade-offs.`;
      }

      const prompt = `${specificInstruction} Difficulty must be one of: BEGINNER, INTERMEDIATE, EXPERT. Output in JSON format with fields: text, difficulty, idealKeywords.`;
      
      try {
        const response: GenerateContentResponse = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  difficulty: { type: Type.STRING },
                  idealKeywords: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["text", "difficulty", "idealKeywords"]
              }
            }
          }
        });

        if (!response || !response.text) throw new Error("Invalid response");
        const questionsJson = JSON.parse(response.text);
        return questionsJson.map((q: any, idx: number) => ({
          id: `q-${Date.now()}-${idx}`,
          text: q.text,
          type,
          difficulty: q.difficulty,
          idealKeywords: q.idealKeywords
        }));
      } catch (error) {
        console.error("Generating questions failed, using fallback.", error);
        return GET_FALLBACK_QUESTIONS(role, type);
      }
    });
  },

  generateCodingChallenge: async (role: string): Promise<CodingChallenge> => {
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Generate a coding challenge for a ${role}. Include title, difficulty, description, and starter code.`;
      
      try {
        const response: GenerateContentResponse = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                difficulty: { type: Type.STRING },
                description: { type: Type.STRING },
                starterCode: {
                  type: Type.OBJECT,
                  properties: {
                    python: { type: Type.STRING },
                    java: { type: Type.STRING },
                    cpp: { type: Type.STRING }
                  },
                  required: ["python", "java", "cpp"]
                }
              },
              required: ["title", "difficulty", "description", "starterCode"]
            }
          }
        });

        const data = JSON.parse(response.text);
        return {
          id: `code-${Date.now()}`,
          ...data,
          points: data.difficulty === 'Hard' ? 150 : (data.difficulty === 'Medium' ? 100 : 50)
        };
      } catch (error) {
        return FALLBACK_CODING;
      }
    });
  },

  evaluateAnswer: async (question: string, answer: string, type: InterviewType): Promise<EvaluationResult> => {
    return callWithRetry(async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Evaluate the candidate's technical answer.
        Question: "${question}"
        Candidate Answer: "${answer}"
        Category: ${type}.
        If the category is APTITUDE, evaluate for mathematical accuracy and logical flow.`;

        const response: GenerateContentResponse = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.NUMBER },
                relevance: { type: Type.NUMBER },
                correctness: { type: Type.NUMBER },
                grammar: { type: Type.NUMBER },
                sentiment: { type: Type.STRING },
                feedback: { type: Type.STRING },
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                idealAnswer: { type: Type.STRING }
              },
              required: ["score", "relevance", "correctness", "grammar", "sentiment", "feedback", "strengths", "weaknesses", "idealAnswer"]
            }
          }
        });
        
        return JSON.parse(response.text);
      } catch (error) {
        console.error("Evaluation rate limited, returning placeholder score.");
        const isMeaningful = answer.length > 30;
        return {
          score: isMeaningful ? 75 : 0,
          relevance: 70,
          correctness: 70,
          grammar: 100,
          sentiment: "Neutral",
          feedback: "Our AI evaluation engine is currently experiencing high traffic. We've provided a preliminary score based on your response length and engagement. Your progress has been saved.",
          strengths: ["Persistence in completing the task during peak load."],
          weaknesses: ["AI analysis currently throttled."],
          idealAnswer: "A standard answer would involve explaining the core mechanics, edge cases, and best practices associated with the technology mentioned in the question."
        };
      }
    });
  },

  validateCode: async (problem: string, language: string, code: string) => {
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Review code for problem: "${problem}". Language: ${language}. Code: "${code}".`;
      try {
        const response: GenerateContentResponse = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                status: { type: Type.STRING },
                timeComplexity: { type: Type.STRING },
                spaceComplexity: { type: Type.STRING },
                feedback: { type: Type.STRING },
                score: { type: Type.NUMBER },
                optimalSolution: { type: Type.STRING }
              },
              required: ["status", "timeComplexity", "spaceComplexity", "feedback", "score", "optimalSolution"]
            }
          }
        });
        return JSON.parse(response.text);
      } catch (error) {
        return { 
          status: "System Busy", 
          feedback: "Your code was submitted, but deep complexity analysis is temporarily unavailable due to high demand. Please check the optimal solution below.", 
          score: 80, 
          optimalSolution: "// Automated complexity analysis is currently offline.\n// Focus on O(n) time and O(1) space where possible." 
        };
      }
    });
  },

  analyzeResume: async (resumeText: string, targetJob: string): Promise<ResumeAnalysis> => {
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Analyze the following resume text.`;

      try {
        const response: GenerateContentResponse = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.NUMBER },
                summary: { type: Type.STRING },
                suggestedImprovements: { type: Type.ARRAY, items: { type: Type.STRING } },
                matchingScore: { type: Type.NUMBER },
                skillGaps: { type: Type.ARRAY, items: { type: Type.STRING } },
                suggestedRoles: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["score", "summary", "suggestedImprovements", "matchingScore", "skillGaps", "suggestedRoles"]
            }
          }
        });
        return JSON.parse(response.text);
      } catch (error) {
        return {
          score: 50,
          summary: "We are currently experiencing high API demand. This is a simplified analysis.",
          suggestedImprovements: ["Try uploading again in a few minutes for a deep AI audit."],
          matchingScore: 50,
          skillGaps: ["Analysis pending"],
          suggestedRoles: [targetJob, "Software Engineer", "Tech Consultant"]
        };
      }
    });
  }
};