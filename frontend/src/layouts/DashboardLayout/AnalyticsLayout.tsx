import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  Smile,
  Volume2,
  Award,
  AlertCircle,
  ArrowLeft,
  MessageSquare,
  HelpCircle,
  User,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

import { answerService } from "../../services/answerService";
import { sessionService } from "../../services/sessionService";
import type { AnswerAnalysis } from "../../types";

const AnalyticsLayout = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { sessionId } = useParams();

  const answerIdParam = searchParams.get("answerId");
  const [activeAnswerId, setActiveAnswerId] = useState<number | null>(
    answerIdParam ? Number(answerIdParam) : null,
  );

  const [analysis, setAnalysis] = useState<AnswerAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPendingAnalysis, setIsPendingAnalysis] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisStatusLabel, setAnalysisStatusLabel] = useState<string | null>(
    null,
  );

  // States to populate the sidebar of questions for the session
  const [sessionQuestions, setSessionQuestions] = useState<any[]>([]);
  const [sessionTitle, setSessionTitle] = useState("");

  // 1. If activeAnswerId changes, fetch the detailed analysis
  useEffect(() => {
    if (answerIdParam) {
      setActiveAnswerId(Number(answerIdParam));
    }
  }, [answerIdParam]);

  const hasMeaningfulAnalysis = (data: AnswerAnalysis) =>
    Boolean(
      data.speechAnalysis ||
      data.nonverbalAnalysis ||
      data.llmFeedback ||
      data.starAnalysis,
    );

  const fetchAnalysis = async (answerId: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await answerService.getAnalysis(answerId);
      setAnalysis(data);
      setIsPendingAnalysis(!hasMeaningfulAnalysis(data));

      if (sessionQuestions.length === 0 && !sessionId) {
        await loadSessionSidebarOfAnswer(answerId);
      }
    } catch (err) {
      console.error("Failed to load answer analysis:", err);
      setAnalysis(null);
      setIsPendingAnalysis(true);
      setError(t("analytics.analysis_failed"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!activeAnswerId) return;
    void fetchAnalysis(activeAnswerId);
  }, [activeAnswerId]);

  useEffect(() => {
    if (!sessionId || !isPendingAnalysis) return;

    void sessionService
      .getAnalysisProgress(Number(sessionId))
      .then((progress) => {
        const target = Math.max(progress.answersWithVideo, progress.totalAnswers);
        setAnalysisStatusLabel(
          `${t("analytics.analysis_pending")} ${progress.speechAnalyzed}/${Math.max(target, 1)}`,
        );
      })
      .catch(() => setAnalysisStatusLabel(t("analytics.analysis_pending")));
  }, [sessionId, isPendingAnalysis]);

  useEffect(() => {
    if (!activeAnswerId || !isPendingAnalysis || error) return;

    const interval = setInterval(() => {
      void fetchAnalysis(activeAnswerId);
    }, 2000);

    const timeout = setTimeout(() => clearInterval(interval), 60000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [activeAnswerId, isPendingAnalysis, error]);

  // Load session questions directly if sessionId is on the path
  useEffect(() => {
    if (!sessionId) return;

    const loadSessionData = async () => {
      try {
        const detail = await sessionService.getSessionDetail(Number(sessionId));
        setSessionQuestions(detail.questions);
        setSessionTitle(detail.jobTitle);

        // If no activeAnswerId is set yet, auto-select the first answered question of this session
        if (!answerIdParam) {
          const firstAnswered = detail.questions.find((q) => q.answerId);
          if (firstAnswered && firstAnswered.answerId) {
            setSearchParams({ answerId: String(firstAnswered.answerId) });
            setActiveAnswerId(firstAnswered.answerId);
          } else {
            setError(t("analytics.no_analytics"));
          }
        }
      } catch (err) {
        console.error("Failed to load session info from path parameter:", err);
        setError(t("analytics.session_load_failed"));
      }
    };

    loadSessionData();
  }, [sessionId, answerIdParam]);

  // 2. Fetch the session and all its questions so the user can easily switch between them!
  const loadSessionSidebarOfAnswer = async (ansId: number) => {
    try {
      // Retrieve recent sessions to find which session holds this answer
      const sessionListRes = await sessionService.getSessions(0, 20);
      for (const s of sessionListRes.content) {
        const detail = await sessionService.getSessionDetail(s.sessionId);
        const hasAnswer = detail.questions.some((q) => q.answerId === ansId);
        if (hasAnswer) {
          setSessionQuestions(detail.questions);
          setSessionTitle(detail.jobTitle);
          break;
        }
      }
    } catch (err) {
      console.warn("Could not load session sidebar:", err);
    }
  };

  // 3. Fallback: If page is loaded directly without an answerId and no sessionId route, auto-load the latest completed session's first answer
  useEffect(() => {
    if (answerIdParam || sessionId) return; // Already have active param or sessionId route, skip auto-load

    const autoLoadLatest = async () => {
      try {
        setIsLoading(true);
        const res = await sessionService.getSessions(0, 10);
        if (res.content && res.content.length > 0) {
          // Get details of the latest session
          const latestSessionId = res.content[0].sessionId;
          const detail = await sessionService.getSessionDetail(latestSessionId);
          setSessionQuestions(detail.questions);
          setSessionTitle(detail.jobTitle);

          // Find first question that has been answered
          const firstAnswered = detail.questions.find((q) => q.answerId);
          if (firstAnswered && firstAnswered.answerId) {
            setSearchParams({ answerId: String(firstAnswered.answerId) });
            setActiveAnswerId(firstAnswered.answerId);
          } else {
            setError(t("analytics.error_no_data"));
          }
        } else {
          setError(t("analytics.error_no_session"));
        }
      } catch (err) {
        console.error("Auto load latest session failed:", err);
        setError(t("analytics.error_generic"));
      } finally {
        setIsLoading(false);
      }
    };

    autoLoadLatest();
  }, [answerIdParam, sessionId]);

  const handleSelectQuestion = (ansId: number) => {
    setSearchParams({ answerId: String(ansId) });
    setActiveAnswerId(ansId);
  };

  return (
    <div className="flex flex-col xl:flex-row gap-8 pb-32 max-w-[1400px] mx-auto min-h-screen">
      {/* 1. Sidebar Question Switcher */}
      {sessionQuestions.length > 0 && (
        <motion.div
          className="w-full xl:w-80 shrink-0 bg-[#191c1f]/80 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-6 h-fit"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Comeback Button */}
          <button
            onClick={() => navigate("/dashboard/history")}
            className="flex items-center gap-3 w-full px-5 py-3.5 mb-6 bg-[#111417]/80 hover:bg-[#111417] text-[#cbc3d7] hover:text-white rounded-2xl border border-white/5 text-xs font-bold transition-all cursor-pointer group shadow-sm hover:shadow-md"
          >
            <ArrowLeft
              size={14}
              className="group-hover:-translate-x-0.5 transition-transform"
            />
            <span>{t("analytics.back_to_history")}</span>
          </button>

          <div className="mb-6">
            <span className="text-[0.6rem] uppercase tracking-[0.25em] text-[#cebdff] font-bold">
              {t("analytics.progress")}
            </span>
            <h3 className="text-lg font-black text-[#e1e2e7] tracking-tight mt-1 truncate">
              {sessionTitle}
            </h3>
          </div>

          <div className="space-y-3">
            {sessionQuestions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => q.answerId && handleSelectQuestion(q.answerId)}
                disabled={!q.answerId}
                className={`w-full text-left p-4 rounded-2xl transition-all border text-xs flex flex-col gap-2 ${
                  !q.answerId
                    ? "bg-black/20 border-transparent text-[#cbc3d7]/20 cursor-not-allowed"
                    : q.answerId === activeAnswerId
                      ? "bg-[#cebdff]/10 border-[#cebdff]/30 text-[#e1e2e7] shadow-lg shadow-[#cebdff]/5"
                      : "bg-[#111417]/40 border-transparent hover:bg-[#191c1f] hover:border-white/5 text-[#cbc3d7]/60 cursor-pointer"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-[0.65rem] uppercase tracking-wider text-[#cebdff]">
                    {t("analytics.question_number", { num: `0${idx + 1}` })}
                  </span>
                  {!q.answerId ? (
                    <span className="text-[0.6rem] text-red-400 font-bold bg-red-400/5 px-2 py-0.5 rounded border border-red-400/10">
                      {t("analytics.unanswered")}
                    </span>
                  ) : q.answerId === activeAnswerId && isPendingAnalysis ? (
                    <span className="text-[0.6rem] text-amber-400 font-bold bg-amber-400/5 px-2 py-0.5 rounded border border-amber-400/10">
                      {t("analytics.analyzing")}
                    </span>
                  ) : (
                    <span className="text-[0.6rem] text-emerald-400 font-bold bg-emerald-400/5 px-2 py-0.5 rounded border border-emerald-400/10">
                      {t("analytics.answered")}
                    </span>
                  )}
                </div>
                <p className="font-medium line-clamp-2 leading-relaxed">
                  {q.content}
                </p>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* 2. Main Analytics Dashboard */}
      <div className="flex-1 min-w-0">
        {isLoading && !analysis ? (
          <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
            <RefreshCw size={40} className="text-[#cebdff] animate-spin" />
            <p className="text-sm text-[#cbc3d7]/60 font-mono tracking-wider animate-pulse">
              {t("analytics.generating_ml_report")}
            </p>
          </div>
        ) : error && !analysis ? (
          <div className="h-[60vh] flex flex-col items-center justify-center bg-[#191c1f]/20 rounded-[2.5rem] border border-white/5 p-12 text-center">
            <AlertCircle size={48} className="text-amber-400 mb-4" />
            <h3 className="text-xl font-bold text-[#e1e2e7] mb-2">
              {t("analytics.load_failed")}
            </h3>
            <p className="text-[#cbc3d7]/50 text-sm max-w-sm mx-auto mb-6">
              {error}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              {activeAnswerId && (
                <button
                  type="button"
                  onClick={() => void fetchAnalysis(activeAnswerId)}
                  className="px-6 py-2.5 bg-[#9b7fed] text-[#31057e] rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
                >
                  <RefreshCw size={12} /> {t("analytics.refresh")}
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate("/dashboard/history")}
                className="px-6 py-2.5 bg-[#cebdff]/10 hover:bg-[#cebdff]/20 text-[#cebdff] rounded-full border border-[#cebdff]/30 text-xs font-bold transition-all cursor-pointer"
              >
                <ArrowLeft size={12} className="inline mr-2" /> {t("analytics.go_to_history")}
              </button>
            </div>
          </div>
        ) : analysis ? (
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {isPendingAnalysis && (
              <div className="flex items-center justify-between gap-4 px-6 py-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs text-amber-300/90">
                  {analysisStatusLabel ||
                    t("analytics.auto_refresh")}
                </p>
                {activeAnswerId && (
                  <button
                    type="button"
                    onClick={() => void fetchAnalysis(activeAnswerId)}
                    className="shrink-0 px-4 py-2 text-[0.65rem] font-bold uppercase tracking-wider text-amber-200 bg-amber-500/10 rounded-full border border-amber-500/30 cursor-pointer hover:bg-amber-500/20"
                  >
                    {t("analytics.refresh")}
                  </button>
                )}
              </div>
            )}

            {/* Header & Question Context */}
            <div className="bg-[#191c1f]/60 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 shadow-2xl space-y-6">
              <div>
                <span className="text-[0.65rem] uppercase tracking-[0.3em] text-[#cebdff] font-black animate-pulse">
                  AI DEEP LEARNING ANALYSIS
                </span>
                <div className="flex items-center gap-4 mt-2">
                  <div className="w-10 h-10 rounded-xl bg-[#cebdff]/10 flex items-center justify-center shrink-0 border border-[#cebdff]/20">
                    <MessageSquare size={18} className="text-[#cebdff]" />
                  </div>
                  <h2 className="text-xl font-bold text-[#e1e2e7] tracking-tight leading-relaxed">
                    "
                    {analysis.starAnalysis?.situationFeedback
                      ? t("analytics.question_report")
                      : t("analytics.question_content")}
                    "
                  </h2>
                </div>
                <p className="text-md text-[#cbc3d7] font-light leading-relaxed mt-4 pl-14 italic">
                  {sessionQuestions.find((q) => q.answerId === activeAnswerId)
                    ?.content ||                     t("analytics.question_content")}
                </p>
              </div>

              {/* Transcript Block */}
              <div className="pt-6 border-t border-white/5 space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <User size={16} className="text-[#cbc3d7]/60" />
                    <span className="text-[0.65rem] uppercase tracking-widest text-[#cbc3d7]/50 font-bold">
                      {t("analytics.answer_content")}
                    </span>
                  </div>
                  <div className="p-6 bg-black/40 rounded-2xl border border-white/5">
                    <p className="text-sm text-[#e1e2e7] leading-relaxed font-light font-sans">
                      {analysis.submittedText ||
                        analysis.transcript ||
                                                t("analytics.no_answer")}
                    </p>
                  </div>
                </div>
                </div>

              </div>
            {/* Visual Analytics Columns */}
            <div
              className={
                analysis.nonverbalAnalysis
                  ? "grid grid-cols-1 md:grid-cols-2 gap-8"
                  : "grid grid-cols-1 gap-8"
              }
            >
              {/* verbal / speech analytics */}
              <div className="bg-[#191c1f]/80 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 space-y-6">
                <div className="flex items-center gap-3">
                  <Volume2 size={20} className="text-[#7bd0ff]" />
                  <h3 className="text-sm font-black tracking-wider uppercase text-[#e1e2e7]">
                    {t("analytics.speech_section")}
                  </h3>
                </div>

                {analysis.speechAnalysis ? (
                  <div className="space-y-6">
                    {/* WPM Gauge */}
                    {analysis.speechAnalysis.wpm != null && (
                      <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                        <div>
                          <h4 className="text-[0.65rem] text-[#cbc3d7]/40 font-bold uppercase tracking-wider">
                              {t("analytics.wpm_label")}
                          </h4>
                          <p className="text-2xl font-black text-white mt-1">
                            {Math.round(analysis.speechAnalysis.wpm)}{" "}
                            <span className="text-xs text-[#cbc3d7]/40 font-medium">
                              {t("analytics.wpm_unit")}
                            </span>
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-[0.6rem] font-bold ${
                            analysis.speechAnalysis.wpm >= 110 &&
                            analysis.speechAnalysis.wpm <= 150
                              ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20"
                              : "bg-amber-400/10 text-amber-400 border border-amber-400/20"
                          }`}
                        >
                          {analysis.speechAnalysis.wpm >= 110 &&
                          analysis.speechAnalysis.wpm <= 150
                            ? t("analytics.speed_stable")
                            : t("analytics.speed_adjust")}
                        </span>
                      </div>
                    )}

                    {/* Filler Words */}
                    {analysis.speechAnalysis.fillerCount != null && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[0.65rem] text-[#cbc3d7]/60 font-bold uppercase">
                            {t("analytics.filler_label")}
                          </span>
                          <span className="text-xs text-amber-400 font-bold">
                            {t("analytics.filler_count", { count: analysis.speechAnalysis.fillerCount })}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 p-4 bg-black/20 rounded-2xl border border-white/5 min-h-[50px] items-center">
                          {analysis.speechAnalysis.fillerWords &&
                          Object.keys(analysis.speechAnalysis.fillerWords)
                            .length > 0 ? (
                            Object.entries(
                              analysis.speechAnalysis.fillerWords,
                            ).map(([word, count]) => (
                              <span
                                key={word}
                                className="px-3 py-1 bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[0.65rem] font-bold rounded-xl"
                              >
                                {t("analytics.filler_word_entry", { word, count })}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-[#cbc3d7]/30">
                              {t("analytics.filler_clean")}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Progress Bars */}
                    {(analysis.speechAnalysis.clarityScore != null ||
                      analysis.speechAnalysis.paceScore != null ||
                      analysis.speechAnalysis.silenceRatio != null) && (
                      <div className="space-y-4 pt-2">
                        {analysis.speechAnalysis.paceScore != null && (
                          <div>
                            <div className="flex justify-between text-[0.65rem] font-bold mb-1">
                              <span className="text-[#cbc3d7]/60 uppercase">
                                {t("analytics.pace_score")}
                              </span>
                              <span className="text-[#7bd0ff]">
                                {Math.round(analysis.speechAnalysis.paceScore)}{t("analytics.points")}
                              </span>
                            </div>
                            <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                              <motion.div
                                className="h-full bg-gradient-to-r from-sky-400 to-blue-500"
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${analysis.speechAnalysis.paceScore}%`,
                                }}
                                transition={{ duration: 1, ease: "easeOut" }}
                              />
                            </div>
                          </div>
                        )}

                        {analysis.speechAnalysis.clarityScore != null && (
                          <div>
                            <div className="flex justify-between text-[0.65rem] font-bold mb-1">
                              <span className="text-[#cbc3d7]/60 uppercase">
                                {t("analytics.clarity_score")}
                              </span>
                              <span className="text-[#7bd0ff]">
                                {Math.round(
                                  analysis.speechAnalysis.clarityScore,
                                )}{t("analytics.points")}
                              </span>
                            </div>
                            <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                              <motion.div
                                className="h-full bg-gradient-to-r from-sky-400 to-blue-500"
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${analysis.speechAnalysis.clarityScore}%`,
                                }}
                                transition={{ duration: 1, ease: "easeOut" }}
                              />
                            </div>
                          </div>
                        )}

                        {analysis.speechAnalysis.silenceRatio != null && (
                          <div>
                            <div className="flex justify-between text-[0.65rem] font-bold mb-1">
                              <span className="text-[#cbc3d7]/60 uppercase">
                                {t("analytics.silence_label")}
                              </span>
                              <span className="text-[#7bd0ff]">
                                {Math.round(
                                  (1 - analysis.speechAnalysis.silenceRatio) *
                                    100,
                                )}
                                %
                              </span>
                            </div>
                            <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                              <motion.div
                                className="h-full bg-gradient-to-r from-sky-400 to-blue-500"
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${(1 - analysis.speechAnalysis.silenceRatio) * 100}%`,
                                }}
                                transition={{ duration: 1, ease: "easeOut" }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {analysis.speechAnalysis.feedback != null && (
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-[0.7rem] text-[#cbc3d7]/80 leading-relaxed font-light">
                        {analysis.speechAnalysis.feedback}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-[#cbc3d7]/40 italic">
                    {t("analytics.emotion_pending")}
                  </p>
                )}
              </div>

              {/* nonverbal / facial analytics */}
              {analysis.nonverbalAnalysis && (
                <div className="bg-[#191c1f]/80 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 space-y-6">
                  <div className="flex items-center gap-3">
                    <Smile size={20} className="text-[#cebdff]" />
                    <h3 className="text-sm font-black tracking-wider uppercase text-[#e1e2e7]">
                      {t("analytics.facial_section")}
                    </h3>
                  </div>

                  <div className="space-y-6">
                    {/* Emotion distribution or vital details */}
                    <div className="grid grid-cols-2 gap-4">
                      {analysis.nonverbalAnalysis.eyeContactScore != null && (
                        <div className="p-4 bg-black/20 rounded-2xl border border-white/5 text-center">
                          <span className="text-[0.55rem] text-[#cbc3d7]/40 uppercase font-black tracking-wider block">
                            {t("analytics.eye_contact_label")}
                          </span>
                          <span className="text-2xl font-black text-white mt-1 block">
                            {Math.round(
                              analysis.nonverbalAnalysis.eyeContactScore,
                            )}
                            %
                          </span>
                        </div>
                      )}
                      {analysis.nonverbalAnalysis.confidenceScore != null && (
                        <div className="p-4 bg-black/20 rounded-2xl border border-white/5 text-center">
                          <span className="text-[0.55rem] text-[#cbc3d7]/40 uppercase font-black tracking-wider block">
                            {t("analytics.facial_confidence")}
                          </span>
                          <span className="text-2xl font-black text-white mt-1 block">
                            {Math.round(
                              analysis.nonverbalAnalysis.confidenceScore,
                            )}
                            %
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Dominant Emotion Ring */}
                    {analysis.nonverbalAnalysis.dominantEmotion && (
                      <div className="flex items-center justify-between p-4 bg-[#cebdff]/5 rounded-2xl border border-[#cebdff]/10">
                        <div>
                          <span className="text-[0.6rem] text-[#cebdff] font-bold uppercase tracking-wider block">
                            {t("analytics.dominant_emotion_label")}
                          </span>
                          <span className="text-lg font-black text-white mt-1 block">
                            {analysis.nonverbalAnalysis.dominantEmotion ===
                            "NEUTRAL"
                              ? t("analytics.emotion_neutral")
                              : analysis.nonverbalAnalysis.dominantEmotion ===
                                  "HAPPY"
                                ? t("analytics.emotion_happy")
                                : analysis.nonverbalAnalysis.dominantEmotion ===
                                    "SURPRISE"
                                  ? t("analytics.emotion_surprise")
                                  : t("analytics.emotion_stable")}
                          </span>
                        </div>
                        <span className="text-[0.65rem] font-bold uppercase tracking-widest text-[#cebdff] bg-[#cebdff]/10 px-3 py-1 rounded-lg">
                          {analysis.nonverbalAnalysis.dominantEmotion}
                        </span>
                      </div>
                    )}

                    {/* Head Stability & Smile Score */}
                    {(analysis.nonverbalAnalysis.headStabilityScore != null ||
                      analysis.nonverbalAnalysis.smileRatio != null) && (
                      <div className="space-y-4 pt-2">
                        {analysis.nonverbalAnalysis.headStabilityScore !=
                          null && (
                          <div>
                            <div className="flex justify-between text-[0.65rem] font-bold mb-1">
                              <span className="text-[#cbc3d7]/60 uppercase">
                                {t("analytics.head_stability")}
                              </span>
                              <span className="text-[#cebdff]">
                                {Math.round(
                                  analysis.nonverbalAnalysis.headStabilityScore,
                                )}
                                %
                              </span>
                            </div>
                            <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                              <motion.div
                                className="h-full bg-gradient-to-r from-[#9b7fed] to-[#cebdff]"
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${analysis.nonverbalAnalysis.headStabilityScore}%`,
                                }}
                                transition={{ duration: 1, ease: "easeOut" }}
                              />
                            </div>
                          </div>
                        )}

                        {analysis.nonverbalAnalysis.smileRatio != null && (
                          <div>
                            <div className="flex justify-between text-[0.65rem] font-bold mb-1">
                              <span className="text-[#cbc3d7]/60 uppercase">
                                {t("analytics.smile_ratio")}
                              </span>
                              <span className="text-[#cebdff]">
                                {Math.round(
                                  analysis.nonverbalAnalysis.smileRatio,
                                )}
                                %
                              </span>
                            </div>
                            <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                              <motion.div
                                className="h-full bg-gradient-to-r from-[#9b7fed] to-[#cebdff]"
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${analysis.nonverbalAnalysis.smileRatio}%`,
                                }}
                                transition={{ duration: 1, ease: "easeOut" }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {analysis.nonverbalAnalysis.feedback != null && (
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-[0.7rem] text-[#cbc3d7]/80 leading-relaxed font-light">
                        {analysis.nonverbalAnalysis.feedback}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* STAR Structural competency card */}
            {analysis.starAnalysis && (
              <motion.div
                className="bg-[#191c1f]/80 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <Award size={20} className="text-[#cebdff]" />
                    <h3 className="text-sm font-black tracking-wider uppercase text-[#e1e2e7]">
                      {t("analytics.star_section")}
                    </h3>
                  </div>
                  <div className="flex items-center gap-4 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#cebdff]/10 via-[#9b7fed]/10 to-[#cebdff]/10 border border-[#cebdff]/20 shadow-lg shadow-[#cebdff]/5">
                    <div className="flex flex-col">
                      <span className="text-[0.55rem] uppercase tracking-[0.25em] text-[#cbc3d7]/40 font-black">
                        STAR SCORE
                      </span>
                      <span className="text-[0.7rem] text-[#cbc3d7]/60 font-medium">
                        {t("analytics.star_subtitle")}
                      </span>
                    </div>

                    <div className="h-10 w-px bg-white/10" />

                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-black bg-gradient-to-r from-[#cebdff] to-white bg-clip-text text-transparent leading-none">
                        {Math.round(analysis.starAnalysis.situationScore) +
                          Math.round(analysis.starAnalysis.taskScore) +
                          Math.round(analysis.starAnalysis.actionScore) +
                          Math.round(analysis.starAnalysis.resultScore)}
                      </span>

                      <span className="text-sm text-[#cbc3d7]/40 font-semibold mb-1">
                        /40
                      </span>
                    </div>
                  </div>
                </div>

                {/* Grid Layout of STAR breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Situation */}
                  <div className="bg-black/20 p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[0.65rem] font-bold text-[#cebdff] uppercase tracking-wider">
                          S ({t("analytics.star_s")})
                        </span>
                        <span className="text-[0.65rem] font-black text-white">
                          {Math.round(analysis.starAnalysis.situationScore)}{t("analytics.points")}
                        </span>
                      </div>
                      <p className="text-[0.65rem] text-[#cbc3d7]/60 leading-relaxed font-light ">
                        {analysis.starAnalysis.situationFeedback}
                      </p>
                    </div>
                  </div>

                  {/* Task */}
                  <div className="bg-black/20 p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[0.65rem] font-bold text-[#cebdff] uppercase tracking-wider">
                          T ({t("analytics.star_t")})
                        </span>
                        <span className="text-[0.65rem] font-black text-white">
                          {Math.round(analysis.starAnalysis.taskScore)}{t("analytics.points")}
                        </span>
                      </div>
                      <p className="text-[0.65rem] text-[#cbc3d7]/60 leading-relaxed font-light ">
                        {analysis.starAnalysis.taskFeedback}
                      </p>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="bg-black/20 p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[0.65rem] font-bold text-[#cebdff] uppercase tracking-wider">
                          A ({t("analytics.star_a")})
                        </span>
                        <span className="text-[0.65rem] font-black text-white">
                          {Math.round(analysis.starAnalysis.actionScore)}{t("analytics.points")}
                        </span>
                      </div>
                      <p className="text-[0.65rem] text-[#cbc3d7]/60 leading-relaxed font-light ">
                        {analysis.starAnalysis.actionFeedback}
                      </p>
                    </div>
                  </div>

                  {/* Result */}
                  <div className="bg-black/20 p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[0.65rem] font-bold text-[#cebdff] uppercase tracking-wider">
                          R ({t("analytics.star_r")})
                        </span>
                        <span className="text-[0.65rem] font-black text-white">
                          {Math.round(analysis.starAnalysis.resultScore)}{t("analytics.points")}
                        </span>
                      </div>
                      <p className="text-[0.65rem] text-[#cbc3d7]/60 leading-relaxed font-light ">
                        {analysis.starAnalysis.resultFeedback}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* AI Coaching & Follow-up questions */}
            {analysis.llmFeedback && (
              <motion.div
                className="bg-[#191c1f]/80 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                  <Sparkles size={20} className="text-[#cebdff]" />
                  <h3 className="text-sm font-black tracking-wider uppercase text-[#e1e2e7]">
                    {t("analytics.llm_section")}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-black/20 p-6 rounded-2xl border border-white/5">
                    <span className="text-[0.6rem] text-emerald-400 font-bold uppercase tracking-widest block mb-2">
                      {t("analytics.llm_strength")}
                    </span>
                    <p className="text-[0.7rem] text-[#cbc3d7]/80 leading-relaxed font-light">
                      {analysis.llmFeedback.strength}
                    </p>
                  </div>

                  <div className="bg-black/20 p-6 rounded-2xl border border-white/5">
                    <span className="text-[0.6rem] text-red-400 font-bold uppercase tracking-widest block mb-2">
                      {t("analytics.llm_weakness")}
                    </span>
                    <p className="text-[0.7rem] text-[#cbc3d7]/80 leading-relaxed font-light">
                      {analysis.llmFeedback.weakness}
                    </p>
                  </div>

                  <div className="bg-black/20 p-6 rounded-2xl border border-white/5">
                    <span className="text-[0.6rem] text-[#cebdff] font-bold uppercase tracking-widest block mb-2">
                      {t("analytics.llm_roadmap")}
                    </span>
                    <p className="text-[0.7rem] text-[#cbc3d7]/80 leading-relaxed font-light">
                      {analysis.llmFeedback.improvement}
                    </p>
                  </div>
                </div>

                {/* Follow-up Questions */}
                {analysis.llmFeedback.followupQuestions &&
                  analysis.llmFeedback.followupQuestions.length > 0 && (
                    <div className="pt-4 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#e1e2e7]">
                        <HelpCircle size={14} className="text-[#cebdff]" />
                        <span>
                          {t("analytics.followup_title")}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {analysis.llmFeedback.followupQuestions.map(
                          (qText, idx) => (
                            <div
                              key={idx}
                              className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-3 text-xs text-[#cbc3d7]/80 hover:text-white transition-all hover:bg-white/[0.07]"
                            >
                              <TrendingUp
                                size={12}
                                className="text-[#cebdff] shrink-0"
                              />
                              <span>{qText}</span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}
              </motion.div>
            )}
          </motion.div>
        ) : null}
      </div>
    </div>
  );
};

export default AnalyticsLayout;
