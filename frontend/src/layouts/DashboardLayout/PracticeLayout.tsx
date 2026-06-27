import { useRef, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertTriangle, RefreshCw } from "lucide-react";
import VideoFeed from "../../components/dashboard/practice/VideoFeed";
import Transcript from "../../components/dashboard/practice/Transcript";
import EmotionAnalysis from "../../components/dashboard/practice/EmotionAnalysis";
import PerformanceVitals from "../../components/dashboard/practice/PerformanceVitals";
import { useFaceAnalysis } from "../../hooks/useFaceAnalysis";
import { InterviewRecordingProvider } from "../../contexts/InterviewRecordingContext";
import { sessionService } from "../../services/sessionService";
import type { QuestionResponse, SessionDetail } from "../../types";

const PracticeLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const activeSessionIdStr = sessionStorage.getItem("activeSessionId");
  const sessionId =
    location.state?.sessionId ||
    (activeSessionIdStr ? Number(activeSessionIdStr) : undefined);

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  // Sync interview state to sessionStorage so Header (outside this tree) can read it
  useEffect(() => {
    if (isInterviewStarted) {
      sessionStorage.setItem("interviewActive", "true");
    } else {
      sessionStorage.removeItem("interviewActive");
    }
  }, [isInterviewStarted]);

  // Prevent tab close / refresh during interview
  useEffect(() => {
    if (!isInterviewStarted) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isInterviewStarted]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const analysisResult = useFaceAnalysis(videoRef, isInterviewStarted);

  useEffect(() => {
    if (!sessionId) {
      navigate("/dashboard");
      return;
    }

    let cancelled = false;

    async function loadSession() {
      setIsLoadingSession(true);
      try {
        const detail = await sessionService.getSessionDetail(sessionId);
        if (!cancelled) {
          setSession(detail);
        }
      } catch (err) {
        console.error("Failed to load session:", err);
        if (!cancelled) {
          alert("세션 정보를 불러오지 못했습니다.");
          navigate("/dashboard");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSession(false);
        }
      }
    }

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, [sessionId, navigate]);

  const unansweredQuestions =
    session?.questions.filter((q) => !q.answerId) ?? [];
  const answeredCount =
    session?.questions.filter((q) => q.answerId).length ?? 0;
  const currentQuestion: QuestionResponse | null =
    unansweredQuestions[0] ?? null;
  const hasMoreQuestions = unansweredQuestions.length > 0;
  const remainingQuestions = Math.max(
    0,
    (session?.totalQuestions ?? 0) - answeredCount,
  );

  const handleQuestionAnswered = useCallback(() => {
    void sessionService
      .getSessionDetail(sessionId!)
      .then(setSession)
      .catch(console.error);
  }, [sessionId]);

  if (!sessionId || isLoadingSession) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] gap-3 text-[#cbc3d7]">
        <RefreshCw size={20} className="animate-spin" />
        <span>세션을 불러오는 중...</span>
      </div>
    );
  }

  return (
    <InterviewRecordingProvider>
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-screen items-stretch"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
      >
        <div className="col-span-1 lg:col-span-8 space-y-8">
          {/* Reload warning — shown once interview starts */}
          {isInterviewStarted && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-5 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3"
            >
              <AlertTriangle size={18} className="shrink-0" />
              <span>
                <strong>주의:</strong> 면접 진행 중 페이지를 새로고침하면
                녹화 데이터가 손실되어 복구할 수 없습니다.
                새로고침하지 마세요.
              </span>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <VideoFeed
              ref={videoRef}
              sessionId={sessionId}
              hasMoreQuestions={hasMoreQuestions}
              remainingQuestions={remainingQuestions}
              onStartInterview={() => setIsInterviewStarted(true)}
              onEndInterview={() => setIsInterviewStarted(false)}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
          >
            <Transcript
              isInterviewStarted={isInterviewStarted}
              currentQuestion={currentQuestion}
              hasMoreQuestions={hasMoreQuestions}
              answerLanguage={session?.answerLanguage}
              onQuestionAnswered={handleQuestionAnswered}
            />
          </motion.div>
        </div>

        <div className="col-span-1 lg:col-span-4 flex flex-col gap-6 self-start">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="h-fit"
          >
            <EmotionAnalysis
              eyeContact={analysisResult.eyeContact}
              confidence={analysisResult.confidence}
              anxiety={analysisResult.anxiety}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.3, duration: 0.5 }}
            className="h-fit"
          >
            <PerformanceVitals
              smileRatio={analysisResult.smileRatio}
              headStability={analysisResult.headStability}
              dominantEmotion={analysisResult.dominantEmotion}
            />
          </motion.div>
        </div>
      </motion.div>
    </InterviewRecordingProvider>
  );
};

export default PracticeLayout;
