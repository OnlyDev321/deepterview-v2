export type Auth = "login" | "register";
export type NavKey = "overview" | "resources";

export interface User {
  id: number;
  name?: string;
  email?: string;
  loginId?: string;
  profileImageUrl?: string;
  bio?: string;
  loginProvider?: string;
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
  submittedText?: string;
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
export type SessionType = "TECHNICAL" | "GLOBAL_TRADE" | "KOREAN_STUDIES" | "BUSINESS" | "MARKETING" | "ECONOMICS" | "ACCOUNTING_TAX" | "MEDIA_COMM" | "DESIGN";

export type AnswerLanguage = "KOREAN" | "ENGLISH" | "VIETNAMESE";

export interface JobCategory {
  id: number;
  name: string;
  type: SessionType | null;
  description?: string;
  children: JobCategory[];
}

// -------------------------------------------------------------
// Session Report Service Types
// -------------------------------------------------------------
export interface SessionReport {
  sessionId: number;
  jobTitle: string;
  sessionType: SessionType;
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
  sessionType: SessionType;
  status: SessionStatus;
  overallScore?: number;
  grade?: "S" | "A" | "B" | "C" | "D";
  createdAt: string;
  endedAt: string;
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
  sessionType: SessionType;
  totalQuestions?: number;
  answerLanguage?: AnswerLanguage;
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
  sessionType: SessionType;
  answerLanguage?: AnswerLanguage;
  status: SessionStatus;
  totalQuestions: number;
  startedAt?: string | Date;
  endedAt?: string | Date;
  questions: QuestionResponse[];
}

// -------------------------------------------------------------
// Review (후기) Types
// -------------------------------------------------------------
export type Emoji = "LIKE" | "LOVE" | "HAHA" | "WOW" | "SAD" | "ANGRY";

export interface ReviewListResponse {
  id: number;
  authorId: number;
  authorName: string;
  authorProfileImageUrl?: string;
  content: string;
  commentCount: number;
  reactions: Record<string, number>;
  createdAt: string;
}

export interface CommentResponse {
  id: number;
  parentId: number | null;
  authorId: number;
  authorName: string;
  authorProfileImageUrl?: string;
  content: string;
  replies: CommentResponse[];
  reactions: Record<string, number>;
  myReaction: string | null;
  createdAt: string;
}

export interface ReviewDetailResponse {
  id: number;
  authorId: number;
  authorName: string;
  authorProfileImageUrl?: string;
  content: string;
  comments: CommentResponse[];
  reactions: Record<string, number>;
  myReaction: string | null;
  createdAt: string;
}

export interface ReactionSummary {
  counts: Record<string, number>;
  myReaction: string | null;
}

export interface CreateReviewRequest {
  content: string;
}

export interface CreateCommentRequest {
  content: string;
}

export interface ToggleReactionRequest {
  emoji: Emoji;
}

export interface NotificationResponse {
  id: number;
  actorId: number | null;
  actorName: string | null;
  actorProfileImageUrl: string | null;
  type: string;
  referenceType: string | null;
  referenceId: number | null;
  content: string;
  isRead: boolean;
  actorCount: number;
  createdAt: string;
}

export interface AnalysisProgress {
  sessionId: number;
  totalAnswers: number;
  answersWithVideo: number;
  speechAnalyzed: number;
  nonverbalAnalyzed: number;
  starAnalyzed: number;
  llmFeedbackDone: boolean;
  reportReady: boolean;
  progressPercent: number;
}
