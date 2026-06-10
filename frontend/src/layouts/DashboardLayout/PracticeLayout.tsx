import { useRef, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
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
  const currentQuestion: QuestionResponse | null =
    unansweredQuestions[0] ?? null;
  const hasMoreQuestions = unansweredQuestions.length > 0;

  const handleQuestionAnswered = useCallback(() => {
    void sessionService
      .getSessionDetail(sessionId!)
      .then(setSession)
      .catch(console.error);
  }, [sessionId]);

  if (!sessionId || isLoadingSession) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-[#cbc3d7]">
        세션을 불러오는 중...
      </div>
    );
  }

  return (
    <InterviewRecordingProvider>
      <motion.div
        className="grid grid-cols-12 gap-8 min-h-screen items-stretch"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
      >
        <div className="col-span-8 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <VideoFeed
              ref={videoRef}
              sessionId={sessionId}
              hasMoreQuestions={hasMoreQuestions}
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
              onQuestionAnswered={handleQuestionAnswered}
            />
          </motion.div>
        </div>

        <div className="col-span-4 flex flex-col gap-6 self-start">
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
