import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  BrainCircuit,
  Captions,
  Eye,
  FileText,
  MessageSquareText,
  Sparkles,
} from "lucide-react";
import {
  runSessionAnalysisPipeline,
  type PipelineProgress,
} from "../../lib/sessionAnalysisPipeline";
import { sessionService } from "../../services/sessionService";
import type { AnalysisProgress } from "../../types";

type AnalysisStep = {
  key: keyof Omit<AnalysisProgress, "sessionId" | "totalAnswers" | "progressPercent">;
  label: string;
  icon: typeof Sparkles;
  desc: string;
};

const analysisSteps: AnalysisStep[] = [
  { key: "speechAnalyzed", label: "음성 분석", icon: Captions, desc: "화자 속도, 발음, 침묵 구간" },
  { key: "nonverbalAnalyzed", label: "비언어 분석", icon: Eye, desc: "시선, 표정, 자신감" },
  { key: "starAnalyzed", label: "STAR 분석", icon: BrainCircuit, desc: "상황·과제·행동·결과" },
  { key: "llmFeedbackDone", label: "LLM 피드백", icon: MessageSquareText, desc: "강점·약점·개선점" },
  { key: "reportReady", label: "최종 리포트", icon: FileText, desc: "종합 점수 및 등급" },
];

const POLL_INTERVAL = 3000;

const ProcessingLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const sessionId = location.state?.sessionId as number | undefined;
  const skipPythonTrigger = Boolean(location.state?.skipPythonTrigger);

  const [pipelineProgress, setPipelineProgress] = useState<PipelineProgress>({
    phase: "polling",
    message: "면접 데이터를 처리하고 있습니다...",
    completedAnswers: 0,
    totalAnswers: 0,
  });
  const [progress, setProgress] = useState<AnalysisProgress | null>(null);
  const [hasFailed, setHasFailed] = useState(false);
  const startedRef = useRef(false);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!sessionId) {
      navigate("/dashboard/history", { replace: true });
      return;
    }

    cancelledRef.current = false;

    const pollInterval = setInterval(async () => {
      if (cancelledRef.current) return;
      try {
        const data = await sessionService.getAnalysisProgress(sessionId);
        setProgress(data);
        if (data.reportReady) clearInterval(pollInterval);
      } catch {
        /* ignore */
      }
    }, POLL_INTERVAL);

    if (startedRef.current) return;
    startedRef.current = true;

    void (async () => {
      const result = await runSessionAnalysisPipeline(sessionId, {
        skipPythonTrigger,
        onProgress: setPipelineProgress,
      });

      if (cancelledRef.current) return;
      clearInterval(pollInterval);

      if (result.success) {
        try {
          const data = await sessionService.getAnalysisProgress(sessionId);
          if (cancelledRef.current) return;
          setProgress(data);
        } catch {
          /* ignore */
        }
        setTimeout(() => {
          if (cancelledRef.current) return;
          navigate("/dashboard/history", {
            replace: true,
            state: { focusSessionId: sessionId, reportReady: true },
          });
        }, 500);
        return;
      }

      if (!cancelledRef.current) setHasFailed(true);
    })();

    return () => {
      cancelledRef.current = true;
      clearInterval(pollInterval);
    };
  }, [sessionId, navigate, skipPythonTrigger]);

  const progressPercent = progress?.progressPercent ?? 
    (pipelineProgress.phase === "creating-report" ? 85 
      : pipelineProgress.phase === "done" ? 100 
      : 15);

  return (
    <motion.div
      className="max-w-lg mx-auto px-6 py-12"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-10">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 border ${
          hasFailed 
            ? "bg-amber-500/10 border-amber-500/20" 
            : "bg-[#cebdff]/10 border-[#cebdff]/20"
        }`}>
          {hasFailed ? (
            <AlertCircle size={28} className="text-amber-400" />
          ) : (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            >
              <Sparkles size={28} className="text-[#cebdff]" />
            </motion.div>
          )}
        </div>
        <span className="text-[0.6rem] uppercase tracking-[0.3em] text-[#cebdff] font-black mb-2">
          AI ANALYSIS
        </span>
        <h2 className="text-2xl font-black text-[#e1e2e7] tracking-tight">
          {hasFailed ? "리포트 생성 실패" : "면접 분석 중"}
        </h2>
        <p className="text-sm text-[#cbc3d7]/60 mt-2">{pipelineProgress.message}</p>
      </div>

      {!hasFailed && (
        <>
          {/* Overall Progress Bar */}
          <div className="mb-10">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[#cbc3d7]/70">
                전체 진행률
              </span>
              <span className="text-sm font-mono text-[#cebdff] font-bold">
                {Math.min(100, progressPercent)}%
              </span>
            </div>
            <div className="h-2.5 bg-[#191c1f] rounded-full overflow-hidden border border-white/5">
              <motion.div
                className="h-full bg-gradient-to-r from-[#9b7fed] to-[#cebdff] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, progressPercent)}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Analysis Steps */}
          <div className="space-y-3">
            {analysisSteps.map((step, index) => {
              const isCompleted = progress
                ? typeof progress[step.key] === "boolean"
                  ? progress[step.key] === true
                  : (progress[step.key] as number) >= (
                      step.key === "speechAnalyzed" || step.key === "nonverbalAnalyzed"
                        ? (progress.answersWithVideo || 1)
                        : (progress.totalAnswers || 1)
                    )
                : false;
              const isActive = !isCompleted && progress !== null;

              return (
                <motion.div
                  key={step.key}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.3 }}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-500 ${
                    isCompleted
                      ? "bg-[#cebdff]/5 border-[#cebdff]/15"
                      : isActive
                        ? "bg-[#191c1f] border-[#494454]/20"
                        : "bg-[#191c1f] border-[#494454]/10 opacity-50"
                  }`}
                >
                  {/* Icon */}
                  <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
                    isCompleted
                      ? "bg-[#cebdff]/15 text-[#cebdff]"
                      : isActive
                        ? "bg-[#cebdff]/10 text-[#cebdff]"
                        : "bg-[#191c1f] text-[#494454]"
                  }`}>
                    <step.icon size={18} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold transition-colors duration-500 ${
                        isCompleted ? "text-[#cebdff]" : "text-[#e1e2e7]"
                      }`}>
                        {step.label}
                      </span>
                      <StatusBadge state={isCompleted ? "done" : isActive ? "running" : "pending"} />
                    </div>
                    <p className="text-[0.7rem] text-[#cbc3d7]/50 mt-0.5">{step.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {/* Error / Fallback */}
      {hasFailed && sessionId && (
        <div className="flex flex-col gap-3 mt-8">
          <button
            type="button"
            onClick={() => {
              startedRef.current = false;
              setHasFailed(false);
              setPipelineProgress({
                phase: "polling",
                message: "다시 시도하는 중...",
                completedAnswers: 0,
                totalAnswers: 0,
              });
              void runSessionAnalysisPipeline(sessionId, { onProgress: setPipelineProgress }).then(
                (result) => {
                  if (result.success) {
                    navigate("/dashboard/history", {
                      replace: true,
                      state: { focusSessionId: sessionId },
                    });
                  } else {
                    setHasFailed(true);
                  }
                },
              );
            }}
            className="w-full px-6 py-3 bg-[#9b7fed] text-[#31057e] rounded-full text-xs font-bold uppercase tracking-widest hover:brightness-110 transition-all cursor-pointer"
          >
            다시 시도
          </button>
          <button
            type="button"
            onClick={() =>
              navigate("/dashboard/history", {
                state: { focusSessionId: sessionId },
              })
            }
            className="w-full px-6 py-3 bg-[#191c1f] text-[#cbc3d7] rounded-full text-xs font-bold border border-white/10 hover:border-[#cebdff]/30 transition-all cursor-pointer"
          >
            히스토리로 이동
          </button>
        </div>
      )}
    </motion.div>
  );
};

function StatusBadge({ state }: { state: "done" | "running" | "pending" }) {
  if (state === "done") {
    return (
      <span className="text-[0.55rem] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-[#cebdff]/15 text-[#cebdff]">
        완료
      </span>
    );
  }
  if (state === "running") {
    return (
      <span className="text-[0.55rem] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-[#9b7fed]/15 text-[#9b7fed] flex items-center gap-1">
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-1 h-1 bg-[#9b7fed] rounded-full inline-block"
        />
        분석 중
      </span>
    );
  }
  return (
    <span className="text-[0.55rem] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-[#494454]/20 text-[#494454]">
      대기 중
    </span>
  );
}

export default ProcessingLayout;
