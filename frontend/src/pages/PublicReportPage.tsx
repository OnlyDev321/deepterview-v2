import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Trophy,
  Clock,
  MessageSquare,
  AlertCircle,
  Loader,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Lock,
} from "lucide-react";
import { sessionService } from "../services/sessionService";
import LanguageSwitcher from "../components/LanguageSwitcher";
import type { SessionDetail } from "../types";

const PublicReportPage = () => {
  const { shareToken } = useParams<{ shareToken: string }>();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openQuestions, setOpenQuestions] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!shareToken) {
      navigate("/");
      return;
    }
    setIsLoading(true);
    sessionService
      .getPublicReport(shareToken)
      .then(setSession)
      .catch(() => setError(t("public.invalid_link_error")))
      .finally(() => setIsLoading(false));
  }, [shareToken]);

  const toggleQuestion = (id: number) => {
    setOpenQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const formatDuration = (startedAt?: string, endedAt?: string) => {
    if (!startedAt || !endedAt) return "—";
    const diffMs = new Date(endedAt).getTime() - new Date(startedAt).getTime();
    const totalSeconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return t("public.duration_format", { minutes, seconds });
  };

  const localeStr =
    i18n.language === "ko"
      ? "ko-KR"
      : i18n.language === "vi"
        ? "vi-VN"
        : "en-US";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d0f12] flex items-center justify-center">
        <Loader size={32} className="text-[#cebdff] animate-spin" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-[#0d0f12] flex flex-col items-center justify-center gap-4 px-6">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
          <Lock size={28} className="text-red-400" />
        </div>
        <h1 className="text-xl font-bold text-[#e1e2e7]">
          {t("public.invalid_link_title")}
        </h1>
        <p className="text-sm text-[#cbc3d7]/60 text-center max-w-sm">
          {error ?? t("public.invalid_link_desc")}
        </p>
        <button
          onClick={() => navigate("/")}
          className="mt-2 px-6 py-3 bg-[#9b7fed] text-white rounded-full text-sm font-bold hover:brightness-110 transition-all"
        >
          {t("public.go_home")}
        </button>
      </div>
    );
  }

  const answeredCount = session.questions.filter((q) => q.answerId).length;

  return (
    <div className="min-h-screen bg-[#0d0f12] text-[#e1e2e7]">
      {/* Header */}
      <header className="border-b border-white/5 px-6 py-4 flex items-center justify-between backdrop-blur-md bg-[#0d0f12]/80 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#9b7fed] to-[#cebdff] flex items-center justify-center">
            <Trophy size={14} className="text-[#1a0050]" />
          </div>
          <span className="font-black text-[#cebdff] tracking-tight text-sm uppercase">
            Deepterview
          </span>
        </div>
        <div className="scale-100 flex items-center gap-3">
          <span className="text-[0.65rem] text-[#cbc3d7]/40 uppercase tracking-widest hidden sm:block">
            {t("public.header_badge")}
          </span>
          <div className="scale-100 origin-right">
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        {/* Session info card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-[#191c1f] border border-[#494454]/20 rounded-3xl p-8 space-y-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.65rem] uppercase tracking-widest text-[#cbc3d7]/40 font-bold mb-1">
                {t("public.session_label")}
              </p>
              <h1 className="text-2xl font-black text-[#e1e2e7]">
                {session.jobTitle}
              </h1>
              <p className="text-sm text-[#cbc3d7]/60 mt-1">
                {session.jobCategoryName}
              </p>
            </div>
            {session.status === "COMPLETED" ? (
              <CheckCircle2 size={28} className="text-emerald-400 shrink-0" />
            ) : (
              <XCircle size={28} className="text-red-400 shrink-0" />
            )}
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full text-xs text-[#cbc3d7]/70">
              <Clock size={12} />
              {formatDuration(session.startedAt, session.endedAt)}
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full text-xs text-[#cbc3d7]/70">
              <MessageSquare size={12} />
              {t("public.questions_count", {
                count: answeredCount,
                total: session.totalQuestions,
              })}
            </div>
            {session.startedAt && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full text-xs text-[#cbc3d7]/70">
                {new Date(session.startedAt).toLocaleString(localeStr, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* Q&A section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="space-y-3"
        >
          <h2 className="text-[0.65rem] uppercase tracking-widest text-[#cbc3d7]/40 font-bold px-1">
            {t("public.questions_label")}
          </h2>

          {session.questions.length === 0 ? (
            <div className="bg-[#191c1f] border border-[#494454]/20 rounded-2xl p-8 flex flex-col items-center gap-3">
              <AlertCircle size={24} className="text-[#cbc3d7]/30" />
              <p className="text-sm text-[#cbc3d7]/40">
                {t("public.no_questions")}
              </p>
            </div>
          ) : (
            session.questions.map((q, idx) => {
              const isOpen = openQuestions.has(q.id);
              return (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + idx * 0.05 }}
                  className="bg-[#191c1f] border border-[#494454]/20 rounded-2xl overflow-hidden"
                >
                  <button
                    onClick={() => toggleQuestion(q.id)}
                    className="w-full flex items-start justify-between gap-4 px-6 py-5 text-left hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex gap-3 items-start">
                      <span className="text-[0.6rem] font-black text-[#9b7fed] bg-[#9b7fed]/10 px-2 py-0.5 rounded-full uppercase tracking-widest shrink-0 mt-0.5">
                        {t("public.question_prefix")}
                        {idx + 1}
                      </span>
                      <p className="text-sm text-[#e1e2e7]/90 font-medium leading-relaxed">
                        {q.content}
                      </p>
                    </div>
                    <div className="shrink-0 mt-0.5 text-[#cbc3d7]/40">
                      {isOpen ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </div>
                  </button>

                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-6 pb-5 border-t border-white/5"
                    >
                      <p className="text-[0.6rem] uppercase tracking-widest text-emerald-400/60 font-bold mt-4 mb-2">
                        {t("public.answer_label")}
                      </p>
                      <p className="text-sm text-[#cbc3d7]/80 leading-relaxed">
                        {q.answerText || (
                          <span className="text-[#cbc3d7]/30 italic">
                            {t("public.no_answer")}
                          </span>
                        )}
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              );
            })
          )}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-[0.6rem] text-[#cbc3d7]/20 uppercase tracking-widest">
        {t("public.footer")}
      </footer>
    </div>
  );
};

export default PublicReportPage;
