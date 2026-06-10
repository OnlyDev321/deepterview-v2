import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, RefreshCw, Sparkles } from "lucide-react";
import {
  runSessionAnalysisPipeline,
  type PipelineProgress,
} from "../../lib/sessionAnalysisPipeline";

const ProcessingLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const sessionId = location.state?.sessionId as number | undefined;
  const skipPythonTrigger = Boolean(location.state?.skipPythonTrigger);

  const [progress, setProgress] = useState<PipelineProgress>({
    phase: "polling",
    message: "면접 데이터를 처리하고 있습니다...",
    completedAnswers: 0,
    totalAnswers: 0,
  });
  const [hasFailed, setHasFailed] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!sessionId) {
      navigate("/dashboard/history", { replace: true });
      return;
    }

    if (startedRef.current) return;
    startedRef.current = true;

    void (async () => {
      const result = await runSessionAnalysisPipeline(sessionId, {
        skipPythonTrigger,
        onProgress: setProgress,
      });

      if (result.success) {
        navigate("/dashboard/history", {
          replace: true,
          state: { focusSessionId: sessionId, reportReady: true },
        });
        return;
      }

      setHasFailed(true);
    })();
  }, [sessionId, navigate, skipPythonTrigger]);

  const progressPercent =
    progress.totalAnswers > 0
      ? Math.min(100, Math.round((progress.completedAnswers / progress.totalAnswers) * 100))
      : progress.phase === "creating-report"
        ? 85
        : progress.phase === "done"
          ? 100
          : 30;

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[70vh] max-w-lg mx-auto text-center px-6"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-20 h-20 rounded-full bg-[#cebdff]/10 flex items-center justify-center mb-8 border border-[#cebdff]/20">
        {hasFailed ? (
          <AlertCircle size={36} className="text-amber-400" />
        ) : (
          <RefreshCw size={36} className="text-[#cebdff] animate-spin" />
        )}
      </div>

      <span className="text-[0.65rem] uppercase tracking-[0.3em] text-[#cebdff] font-black mb-3 flex items-center gap-2 justify-center">
        <Sparkles size={12} /> AI ANALYSIS
      </span>

      <h2 className="text-3xl font-black text-[#e1e2e7] tracking-tight mb-3">
        {hasFailed ? "리포트 생성 실패" : "면접 분석 중"}
      </h2>

      <p className="text-sm text-[#cbc3d7]/70 leading-relaxed mb-8">{progress.message}</p>

      {!hasFailed && (
        <div className="w-full space-y-2 mb-8">
          <div className="h-2 bg-[#191c1f] rounded-full overflow-hidden border border-white/5">
            <motion.div
              className="h-full bg-gradient-to-r from-[#9b7fed] to-[#cebdff]"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          {progress.totalAnswers > 0 && (
            <p className="text-[0.65rem] font-mono text-[#cbc3d7]/50">
              {progress.completedAnswers} / {progress.totalAnswers} 분석 완료
            </p>
          )}
        </div>
      )}

      {hasFailed && sessionId && (
        <div className="flex flex-col gap-3 w-full">
          <button
            type="button"
            onClick={() => {
              startedRef.current = false;
              setHasFailed(false);
              setProgress({
                phase: "polling",
                message: "다시 시도하는 중...",
                completedAnswers: 0,
                totalAnswers: 0,
              });
              void runSessionAnalysisPipeline(sessionId, { onProgress: setProgress }).then(
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

      {!hasFailed && (
        <p className="text-[0.65rem] text-[#cbc3d7]/40 font-mono">
          잠시만 기다려 주세요. 완료되면 자동으로 히스토리로 이동합니다.
        </p>
      )}
    </motion.div>
  );
};

export default ProcessingLayout;
