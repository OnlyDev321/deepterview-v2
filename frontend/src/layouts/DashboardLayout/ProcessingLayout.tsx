import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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

const getAnalysisSteps = (t: (key: string) => string): AnalysisStep[] => [
  { key: "speechAnalyzed", label: t("processing.step_speech"), icon: Captions, desc: t("processing.step_speech_desc") },
  { key: "nonverbalAnalyzed", label: t("processing.step_nonverbal"), icon: Eye, desc: t("processing.step_nonverbal_desc") },
  { key: "starAnalyzed", label: t("processing.step_star"), icon: BrainCircuit, desc: t("processing.step_star_desc") },
  { key: "llmFeedbackDone", label: t("processing.step_llm"), icon: MessageSquareText, desc: t("processing.step_llm_desc") },
  { key: "reportReady", label: t("processing.step_report"), icon: FileText, desc: t("processing.step_report_desc") },
];

const POLL_INTERVAL = 3000;

const ProcessingLayout = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const sessionId = location.state?.sessionId as number | undefined;
  const skipPythonTrigger = Boolean(location.state?.skipPythonTrigger);

  const [pipelineProgress, setPipelineProgress] = useState<PipelineProgress>({
    phase: "polling",
    message: t("processing.initial_message"),
    completedAnswers: 0,
    totalAnswers: 0,
  });
  const [progress, setProgress] = useState<AnalysisProgress | null>(null);
  const [displayPercent, setDisplayPercent] = useState(0);
  const [hasFailed, setHasFailed] = useState(false);

  const currentSessionIdRef = useRef(sessionId);
  currentSessionIdRef.current = sessionId;

  useEffect(() => {
    if (!sessionId) {
      navigate("/dashboard/history", { replace: true });
      return;
    }

    let mounted = true;
    const localCancelledRef = { current: false };
    let navigated = false;

    const doNavigate = () => {
      if (navigated) return;
      navigated = true;
      navigate("/dashboard/history", {
        replace: true,
        state: { focusSessionId: sessionId, reportReady: true },
      });
    };

    const pollInterval = setInterval(async () => {
      if (!mounted) return;
      try {
        const data = await sessionService.getAnalysisProgress(sessionId);
        if (!mounted) return;
        setProgress(data);
        if (data.reportReady) {
          setDisplayPercent(100);
          clearInterval(pollInterval);
          if (!mounted) return;
          doNavigate();
        } else {
          setDisplayPercent((prev) => Math.min(prev + 8, 90));
        }
      } catch {
        /* ignore */
      }
    }, POLL_INTERVAL);

    void (async () => {
      const result = await runSessionAnalysisPipeline(sessionId, {
        skipPythonTrigger,
        onProgress: setPipelineProgress,
        cancelledRef: localCancelledRef,
      });

      if (!mounted) return;
      clearInterval(pollInterval);

      if (result.success) {
        setDisplayPercent(100);
        try {
          const data = await sessionService.getAnalysisProgress(sessionId);
          if (!mounted) return;
          setProgress(data);
        } catch {
          /* ignore */
        }
        setTimeout(() => {
          if (!mounted) return;
          doNavigate();
        }, 500);
        return;
      }

      if (mounted) setHasFailed(true);
    })();

    return () => {
      mounted = false;
      localCancelledRef.current = true;
      clearInterval(pollInterval);
    };
  }, [sessionId, navigate, skipPythonTrigger]);

  const progressPercent = progress?.reportReady ? 100 : displayPercent;

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
          {hasFailed ? t("processing.title_failed") : t("processing.title")}
        </h2>
        <p className="text-sm text-[#cbc3d7]/60 mt-2">{pipelineProgress.message}</p>
      </div>

      {!hasFailed && (
        <>
          {/* Overall Progress Bar */}
          <div className="mb-10">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[#cbc3d7]/70">
                {t("processing.progress_label")}
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
            {getAnalysisSteps(t).map((step, index) => {
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
                      <StatusBadge state={isCompleted ? "done" : isActive ? "running" : "pending"} t={t} />
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
              setHasFailed(false);
              setPipelineProgress({
                phase: "polling",
                message: t("processing.retrying"),
                completedAnswers: 0,
                totalAnswers: 0,
              });
              const retryCancelledRef = { current: false };
              void runSessionAnalysisPipeline(sessionId, { onProgress: setPipelineProgress, cancelledRef: retryCancelledRef }).then(
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
            {t("processing.btn_retry")}
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
            {t("processing.btn_history")}
          </button>
        </div>
      )}
    </motion.div>
  );
};

function StatusBadge({ state, t }: { state: "done" | "running" | "pending"; t: (key: string) => string }) {
  if (state === "done") {
    return (
      <span className="text-[0.55rem] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-[#cebdff]/15 text-[#cebdff]">
        {t("processing.badge_done")}
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
        {t("processing.badge_running")}
      </span>
    );
  }
  return (
    <span className="text-[0.55rem] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-[#494454]/20 text-[#494454]">
      {t("processing.badge_pending")}
    </span>
  );
}

export default ProcessingLayout;
