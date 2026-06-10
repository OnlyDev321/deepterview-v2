export interface UploadedFile {
  id: string;
  name: string;
  size: string;
  uploadedAt: string;
}

export interface SessionConfig {
  scenario: string;
  targetCompany: string;
  openPosition: string;
  objective: File | null;
}

// important

export interface InterviewSession {
  id: string;
  company: string;
  role: string;
  date: string;
  duration: string;
  score: number;
  questionCount: number;
  qaPairs: QAPair[];
}
export interface QAPair {
  id: string;
  question: string;
  answer: string;
  tags?: string[];
  aiInsight?: string;
  aiInsightType?: "positive" | "negative";
  answerId?: number;
}

// important

export interface InterviewTimelineProps {
  qaPairs: QAPair[];
  onNavigateToAnalysis?: (answerId: number) => void;
}

export interface SessionListProps {
  sessions: InterviewSession[];
  selectedSessionId: string;
  onSelectSession: (id: string) => void;
}

export interface SessionDetailHeaderProps {
  session: InterviewSession;
  onViewReport?: () => void;
  onDeleteSession?: () => void;
}

export interface UserProfile {
  name: string;
  email: string;
  profileImageUrl: string;
  bio: string;
}

export interface AccountActionsProps {
  onSave: () => void;
  onDelete: () => void;
  isSaving: boolean;
}

export interface AvatarUploadProps {
  avatar: string;
  onAvatarChange: (newAvatar: string) => void;
}

export interface ProfileFormProps {
  profile: UserProfile;
  onChange: (field: keyof UserProfile, value: string) => void;
}

export interface AnalyticsHeaderProps {
  company: string;
  role: string;
  date: string;
  duration: string;
  score: number;
}

export interface TranscriptItemProps {
  pair: QAPair;
}
