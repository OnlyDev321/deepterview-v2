export type Auth = "login" | "register";
export type NavKey = "overview" | "resources";

export interface User {
  id: number;
  name?: string;
  email?: string;
  profileImageUrl?: string;
  bio?: string;
}

// -------------------------------------------------------------
// Generic API Wrapper
// -------------------------------------------------------------
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  code: string;
}

// -------------------------------------------------------------
// Answer Service Types
// -------------------------------------------------------------
export interface SubmitAnswerResponse {
  answerId: number;
  questionId: number;
  completionStatus: "COMPLETED" | "SKIPPED" | "TIMEOUT";
  analysisStatus: string;
  createdAt: string;
}

export interface SpeechAnalysisView {
  wpm: number;
  fillerCount: number;
  fillerWords: Record<string, number>;
  silenceRatio: number;
  paceScore: number;
  clarityScore: number;
  feedback: string;
}

export interface StarAnalysisView {
  situationScore: number;
  taskScore: number;
  actionScore: number;
  resultScore: number;
  totalScore: number;
  situationFeedback: string;
  taskFeedback: string;
  actionFeedback: string;
  resultFeedback: string;
}

export interface NonverbalAnalysisView {
  eyeContactScore: number;
  confidenceScore: number;
  anxietyScore: number;
  smileRatio: number;
  headStabilityScore: number;
  dominantEmotion:
    | "NEUTRAL"
    | "HAPPY"
    | "SURPRISE"
    | "SAD"
    | "FEAR"
    | "DISGUST"
    | "ANGRY";
  emotionDistribution: Record<string, number>;
  feedback: string;
}

export interface LlmFeedbackView {
  strength: string;
  weakness: string;
  improvement: string;
  followupQuestions: string[];
}

export interface AnswerAnalysis {
  answerId: number;
  transcript: string;
  durationSec: number;
  speechAnalysis?: SpeechAnalysisView;
  starAnalysis?: StarAnalysisView;
  nonverbalAnalysis?: NonverbalAnalysisView;
  llmFeedback?: LlmFeedbackView;
}

// -------------------------------------------------------------
// Job Category Service Types
// -------------------------------------------------------------
export interface JobCategory {
  id: number;
  name: string;
  description?: string;
}

// -------------------------------------------------------------
// Session Report Service Types
// -------------------------------------------------------------
export interface SessionReport {
  sessionId: number;
  jobTitle: string;
  sessionType: "TECHNICAL" | "PERSONALITY" | "COMBINED";
  speechScore: number;
  nonverbalScore: number;
  contentScore: number;
  overallScore: number;
  grade: "S" | "A" | "B" | "C" | "D";
  strengthSummary?: string;
  weaknessSummary?: string;
  improvementPriority?: string;
  aiSummary?: string;
  createdAt: string;
}

// -------------------------------------------------------------
// Session Service Types
// -------------------------------------------------------------
export type SessionStatus = "READY" | "IN_PROGRESS" | "COMPLETED" | "ABORTED";

export interface SessionListItem {
  sessionId: number;
  jobTitle: string;
  sessionType: "TECHNICAL" | "PERSONALITY" | "COMBINED";
  status: SessionStatus;
  overallScore?: number;
  grade?: "S" | "A" | "B" | "C" | "D";
  createdAt: string;
}

export interface SessionListResponse {
  content: SessionListItem[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
}

export interface CreateSessionRequest {
  jobCategoryId: number;
  jobTitle: string;
  careerYears?: number;
  sessionType: "TECHNICAL" | "PERSONALITY" | "COMBINED";
  totalQuestions?: number;
}

export interface QuestionResponse {
  id: number;
  orderNum: number;
  content: string;
  questionType: "TECHNICAL" | "BEHAVIORAL" | "SITUATIONAL" | "EXPERIENCE";
  timeLimitSec: number;
  answerId?: number;
  answerText?: string;
}

export interface SessionDetail {
  sessionId: number;
  jobCategoryName: string;
  jobTitle: string;
  careerYears: number;
  sessionType: "TECHNICAL" | "PERSONALITY" | "COMBINED";
  status: SessionStatus;
  totalQuestions: number;
  startedAt?: string;
  questions: QuestionResponse[];
}

export interface SessionAnalysisStatus {
  sessionId: number;
  status: SessionStatus;
  totalQuestions: number;
  answeredCount: number;
  answersWithVideoCount: number;
  analysesReadyCount: number;
  feedbackReportExists: boolean;
}
