import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Sparkles,
  AlertCircle,
  RefreshCw,
  FileText,
  Loader,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

import SessionList from "../../components/dashboard/history/SessionList";
import SessionDetailHeader from "../../components/dashboard/history/SessionDetailHeader";
import InterviewTimeline from "../../components/dashboard/history/InterviewTimeline";
import ShareModal from "../../components/dashboard/history/ShareModal";

import { sessionService } from "../../services/sessionService";
import { reportService } from "../../services/reportService";
import { jobCategoryService } from "../../services/jobCategoryService";
import { runSessionAnalysisPipeline } from "../../lib/sessionAnalysisPipeline";
import { isAnalyzing } from "../../lib/analysisTracker";
import JobCategoryFilter from "../../components/dashboard/history/JobCategoryFilter";
import DateFilter from "../../components/dashboard/history/DateFilter";
import type {
  SessionListItem,
  SessionDetail,
  SessionReport,
  JobCategory,
} from "../../types";
import type { InterviewSession, QAPair } from "../../types/types";

const HistoryLayout = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const focusSessionId = (location.state as { focusSessionId?: number } | null)
    ?.focusSessionId;
  const reportReadyNotice = (location.state as { reportReady?: boolean } | null)
    ?.reportReady;

  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(
    null,
  );
  const [sessionDetail, setSessionDetail] = useState<SessionDetail | null>(
    null,
  );
  const [sessionReport, setSessionReport] = useState<SessionReport | null>(
    null,
  );
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isCreatingReport, setIsCreatingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(
    reportReadyNotice ? t("history.ai_report_ready") : null,
  );
  const [selectedJobCategoryId, setSelectedJobCategoryId] = useState<number | null>(null);
  const [selectedDays, setSelectedDays] = useState<number | null>(0);
  const [jobCategories, setJobCategories] = useState<JobCategory[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareState, setShareState] = useState<{ shareToken: string; shareEnabled: boolean } | null>(null);

  const loadSessionsList = async (
    shouldAutoSelect: boolean = true,
    categoryId?: number | null,
    days?: number | null
  ) => {
    try {
      setIsLoadingList(true);
      setError(null);
      const cid = categoryId !== undefined ? categoryId : selectedJobCategoryId;
      const d = days !== undefined ? days : selectedDays;
      const res = await sessionService.getSessions(0, 50, undefined, cid ?? undefined, d ?? undefined);
      const completedSessions = res.content || [];
      setSessions(completedSessions);

      if (shouldAutoSelect && completedSessions.length > 0) {
        setSelectedSessionId(completedSessions[0].sessionId);
      } else if (completedSessions.length === 0) {
        setSelectedSessionId(null);
        setSessionDetail(null);
        setSessionReport(null);
      }
    } catch (err: any) {
      console.error("Failed to load sessions:", err);
      setError(t("history.load_error"));
    } finally {
      setIsLoadingList(false);
    }
  };

  const loadSessionData = useCallback(async (sessionId: number) => {
    try {
      setIsLoadingDetail(true);
      const [detail, report] = await Promise.all([
        sessionService.getSessionDetail(sessionId, i18n.language),
        reportService.getSessionReport(sessionId).catch(() => null),
      ]);

      setSessionDetail(detail);
      setSessionReport(report);
    } catch (err) {
      console.error("Failed to load session details:", err);
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    void loadSessionsList(!focusSessionId);
    void jobCategoryService.getJobCategories(i18n.language).then(setJobCategories).catch(console.error);
  }, [i18n.language]);

  useEffect(() => {
    void loadSessionsList(true, selectedJobCategoryId, selectedDays);
  }, [selectedJobCategoryId, selectedDays]);

  useEffect(() => {
    if (focusSessionId) {
      setSelectedSessionId(focusSessionId);
      window.history.replaceState({}, document.title);
    }
  }, [focusSessionId]);

  useEffect(() => {
    if (!selectedSessionId) return;
    void loadSessionData(selectedSessionId);
  }, [selectedSessionId, loadSessionData]);

  const handleCreateReport = async () => {
    if (!selectedSessionId) return;

    setIsCreatingReport(true);
    try {
      const result = await runSessionAnalysisPipeline(selectedSessionId, {
        skipPythonTrigger: false,
      });
      if (result.success) {
        setSuccessBanner(t("history.ai_report_ready"));
        await loadSessionsList(false);
        await loadSessionData(selectedSessionId);
      } else {
        alert(t("history.error_python_report"));
      }
    } finally {
      setIsCreatingReport(false);
    }
  };

  // Convert real API response to InterviewSession mock shape for components
  const formatSessionsForList = (): InterviewSession[] => {
    return sessions.map((s) => ({
      id: String(s.sessionId),
      company: t("common.company_name"),
      role: s.jobTitle,
      date: new Date(s.createdAt).toLocaleDateString(i18n.language === "ko" ? "ko-KR" : i18n.language === "vi" ? "vi-VN" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      duration: (() => {
        const startTime = s.startedAt || s.createdAt;
        if (!s.endedAt || !startTime) return t("history.duration_zero");
        const diffMs =
          new Date(s.endedAt).getTime() - new Date(startTime).getTime();
        const totalSeconds = Math.floor(diffMs / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return t("history.duration_format", { minutes, seconds });
      })(),
      score: s.overallScore ? Math.round(s.overallScore) : 0,
      questionCount: 0,
      qaPairs: [],
    }));
  };

  const buildMappedQAPairs = (): QAPair[] => {
    if (!sessionDetail) return [];
    return sessionDetail.questions.map((q) => ({
      id: String(q.id),
      question: q.content,
      answer:
        q.answerText || t("history.no_answer_text"),
      tags: [q.questionType === "TECHNICAL" ? t("history.tag_technical") : t("history.tag_behavioral")],
      answerId: q.answerId,
      aiInsight: q.answerId ? t("history.ai_feedback_done") : t("history.ai_feedback_none"),
      aiInsightType: q.answerId ? "positive" : "negative",
    }));
  };

  const getMappedSelectedSession = (): InterviewSession | null => {
    if (!sessionDetail) return null;
    const mappedPairs = buildMappedQAPairs();

    return {
      id: String(sessionDetail.sessionId),
      company: t("common.company_name"),
      role: sessionDetail.jobTitle,
      date: sessionDetail.startedAt
        ? new Date(sessionDetail.startedAt).toLocaleDateString(i18n.language === "ko" ? "ko-KR" : i18n.language === "vi" ? "vi-VN" : "en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : t("history.no_duration"),
      duration: (() => {
        if (!sessionDetail.startedAt || !sessionDetail.endedAt)
          return t("history.duration_zero");
        const diffMs =
          new Date(sessionDetail.endedAt).getTime() -
          new Date(sessionDetail.startedAt).getTime();
        const totalSeconds = Math.floor(diffMs / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return t("history.duration_format", { minutes, seconds });
      })(),
      score: sessionReport?.overallScore
        ? Math.round(sessionReport.overallScore)
        : 0,
      questionCount: sessionDetail.totalQuestions,
      qaPairs: mappedPairs,
    };
  };

  // Navigations
  const handleNavigateToAnalysis = (answerId: number) => {
    if (selectedSessionId) {
      navigate(
        `/dashboard/history/${selectedSessionId}/analytics?answerId=${answerId}`,
      );
    } else {
      navigate(`/dashboard/analytics?answerId=${answerId}`);
    }
  };

  const handleViewReport = () => {
    if (selectedSessionId) {
      if (sessionDetail?.questions && sessionDetail.questions.length > 0) {
        // Find the first question with a valid answerId
        const firstAnswered = sessionDetail.questions.find((q) => q.answerId);
        if (firstAnswered && firstAnswered.answerId) {
          navigate(
            `/dashboard/history/${selectedSessionId}/analytics?answerId=${firstAnswered.answerId}`,
          );
        } else {
          // Navigate anyway so the user can see the questions in the sidebar
          navigate(`/dashboard/history/${selectedSessionId}/analytics`);
        }
      } else {
        // Navigate anyway if there are no questions loaded yet
        navigate(`/dashboard/history/${selectedSessionId}/analytics`);
      }
    }
  };

  const handleShareClick = () => {
    if (!sessionDetail) return;
    setShareState({
      shareToken: sessionDetail.shareToken || "",
      shareEnabled: sessionDetail.shareEnabled || false,
    });
    setShowShareModal(true);
  };

  const handleShareToggle = async () => {
    if (!selectedSessionId || !shareState) return;
    try {
      const res = await sessionService.toggleShare(selectedSessionId);
      setShareState(res);
      await loadSessionData(selectedSessionId);
    } catch (err) {
      console.error("Failed to toggle share:", err);
    }
  };

  const handleDeleteSession = async () => {
    if (!selectedSessionId) return;

    const confirmDelete = window.confirm(
      t("history.confirm_delete"),
    );
    if (!confirmDelete) return;

    try {
      setIsLoadingDetail(true);
      await sessionService.deleteSession(selectedSessionId);

      // Successfully deleted, refresh list and auto-select next
      alert(t("history.delete_success"));
      await loadSessionsList(true);
    } catch (err) {
      console.error("Failed to delete session:", err);
      alert(t("history.delete_failed"));
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const selectedMappedSession = getMappedSelectedSession();

  return (
    <motion.div
      className="flex flex-col h-full"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <div>
          <span className="text-[0.65rem] uppercase tracking-[0.3em] text-[#cebdff] font-black mb-2 block animate-pulse">
            {t("history.report_title")}
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tighter text-[#e1e2e7]">
            {t("history.title")}
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <DateFilter
            value={selectedDays}
            onChange={(days) => setSelectedDays(days)}
          />
          <JobCategoryFilter
            categories={jobCategories}
            selectedId={selectedJobCategoryId}
            onChange={(id) => setSelectedJobCategoryId(id)}
          />
        </div>
      </motion.div>

      {successBanner && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 px-5 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-medium flex items-center justify-between"
        >
          <span>{successBanner}</span>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            className="text-xs uppercase tracking-wider opacity-70 hover:opacity-100 cursor-pointer"
          >
            {t("history.close")}
          </button>
        </motion.div>
      )}

      {/* Main Content Area */}
      {isLoadingList ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <RefreshCw size={36} className="text-[#cebdff] animate-spin" />
          <p className="text-sm text-[#cbc3d7]/60 font-medium">
            {t("history.loading")}
          </p>
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <AlertCircle size={40} className="text-red-400" />
          <p className="text-sm text-red-400 font-bold">{error}</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#191c1f]/20 rounded-[2.5rem] border border-white/5 p-12 text-center">
          <Sparkles size={48} className="text-[#cebdff]/30 mb-4" />
          <h3 className="text-xl font-bold text-[#e1e2e7] mb-2">
            {t("history.empty")}
          </h3>
          <p className="text-[#cbc3d7]/50 text-sm max-w-sm mx-auto">
            {t("history.empty_cta")}
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-6 px-8 py-3 bg-[#9b7fed] text-[#31057e] rounded-full text-xs font-bold uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-[#9b7fed]/20 cursor-pointer"
          >
            {t("history.go_practice")}
          </button>
        </div>
      ) : (
        <motion.div
          className="flex flex-col xl:flex-row gap-10 flex-1 min-h-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {/* Left Sidebar - Session List */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <SessionList
              sessions={formatSessionsForList()}
              selectedSessionId={
                selectedSessionId ? String(selectedSessionId) : ""
              }
              onSelectSession={(id) => setSelectedSessionId(Number(id))}
            />
          </motion.div>

          {/* Right Content - Session Details */}
          <motion.div
            className="flex-1 overflow-y-auto scrollbar-hide pr-4"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            {isLoadingDetail || !selectedMappedSession ? (
              <div className="h-full flex flex-col items-center justify-center gap-4">
                <RefreshCw size={28} className="text-[#cebdff] animate-spin" />
                <p className="text-xs text-[#cbc3d7]/60 font-mono">
                  {t("history.report_loading")}
                </p>
              </div>
            ) : (
              <>
                <SessionDetailHeader
                  session={selectedMappedSession}
                  shareEnabled={sessionDetail?.shareEnabled ?? false}
                  onViewReport={handleViewReport}
                  onDeleteSession={handleDeleteSession}
                  onShare={handleShareClick}
                />

                {!sessionReport &&
                  sessionDetail?.status === "COMPLETED" &&
                  sessionDetail.questions.some((q) => q.answerId) && (
                    selectedSessionId && isAnalyzing(selectedSessionId) ? (
                      <motion.div
                        className="mt-6 p-6 rounded-[2rem] bg-[#191c1f]/80 border border-[#cebdff]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="flex items-center gap-4">
                          <Loader size={20} className="text-[#cebdff] animate-spin shrink-0" />
                          <div>
                            <h4 className="text-sm font-bold text-[#cebdff] mb-1">
                              {t("history.analysis_in_progress")}
                            </h4>
                            <p className="text-xs text-[#cbc3d7]/60">
                              {t("history.analysis_in_progress_desc")}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        className="mt-6 p-6 rounded-[2rem] bg-[#191c1f]/80 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="text-left">
                          <h4 className="text-sm font-bold text-amber-400 mb-1">
                            {t("history.no_report")}
                          </h4>
                          <p className="text-xs text-[#cbc3d7]/60">
                            {t("history.no_report_desc")}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleCreateReport()}
                          disabled={isCreatingReport}
                          className="shrink-0 px-6 py-3 bg-[#9b7fed] text-[#31057e] rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:brightness-110 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {isCreatingReport ? (
                            <RefreshCw size={14} className="animate-spin" />
                          ) : (
                            <FileText size={14} />
                          )}
                          {t("history.create_report")}
                        </button>
                      </motion.div>
                    )
                  )}

                {/* Session AI Qualitative Summaries (If report exists) */}
                {sessionReport && (
                  <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-[#232036] to-[#191c1f] backdrop-blur-md rounded-[2rem] p-8 border border-[#9b7fed]/20 shadow-lg shadow-[#9b7fed]/10">
                      <div className="flex items-center gap-3 mb-4">
                        <Sparkles size={20} className="text-[#cebdff]" />
                        <h4 className="text-[1rem] tracking-widest text-[#cebdff] font-black">
                          {t("history.summary_title")}
                        </h4>
                      </div>
                      <p className="text-[15px] text-[#cbc3d7]/90 leading-relaxed font-light">
                        {sessionReport.aiSummary ||
                          t("history.summary_loading")}
                      </p>
                    </div>

                    <div className="bg-[#191c1f]/80 backdrop-blur-md rounded-[2rem] p-6 border-l-4 border-emerald-400 border-t border-r border-b border-t-emerald-500/10 border-r-emerald-500/10 border-b-emerald-500/10 hover:border-l-emerald-300 transition-all duration-300">
                      <h4 className="text-[1rem] tracking-widest text-emerald-400 font-black mb-3">
                        {t("history.strengths_title")}
                      </h4>
                      <p className="text-[14px] text-[#cbc3d7]/80 leading-relaxed font-light">
                        {sessionReport.strengthSummary ||
                          t("history.strengths_loading")}
                      </p>
                    </div>

                    <div className="bg-[#191c1f]/80 backdrop-blur-md rounded-[2rem] p-6 border-l-4 border-red-400 border-t border-r border-b border-t-red-500/10 border-r-red-500/10 border-b-red-500/10 hover:border-l-red-300 transition-all duration-300">
                      <h4 className="text-[1rem] tracking-widest text-red-400 font-black mb-3">
                        {t("history.weaknesses_title")}
                      </h4>
                      <p className="text-[14px] text-[#cbc3d7]/80 leading-relaxed font-light">
                        {sessionReport.weaknessSummary ||
                          t("history.weaknesses_loading")}
                      </p>
                    </div>

                    <div className="col-span-1 md:col-span-2 bg-[#191c1f]/80 backdrop-blur-md rounded-[2rem] p-6 border-l-4 border-blue-400 border-t border-r border-b border-t-blue-500/10 border-r-blue-500/10 border-b-blue-500/10 hover:border-l-blue-300 transition-all duration-300">
                      <h4 className="text-[1rem] tracking-widest text-blue-400 font-black mb-3">
                        {t("history.priorities_title")}
                      </h4>
                      <p className="text-[14px] text-[#cbc3d7]/80 leading-relaxed font-light">
                        {sessionReport.improvementPriority ||
                          t("history.priorities_loading")}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Interview Timeline */}
                <motion.div
                  className="mt-8"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                >
                  <InterviewTimeline
                    qaPairs={selectedMappedSession.qaPairs}
                    onNavigateToAnalysis={handleNavigateToAnalysis}
                  />
                </motion.div>

                {showShareModal && shareState && (
                  <ShareModal
                    shareToken={shareState.shareToken}
                    shareEnabled={shareState.shareEnabled}
                    onClose={() => setShowShareModal(false)}
                    onToggle={handleShareToggle}
                  />
                )}
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default HistoryLayout;
