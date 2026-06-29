import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { SessionDetailHeaderProps } from "../../../types/types";
import { Clock, FileText, MessageSquare, Share2, Trash2 } from "lucide-react";

const SessionDetailHeader = ({
  session,
  shareEnabled,
  onViewReport,
  onDeleteSession,
  onShare,
}: SessionDetailHeaderProps) => {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#191c1f] rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 border border-[#494454]/10 shadow-[0_0_50px_rgba(0,0,0,0.2)]"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left: Score + Info */}
        <div className="flex items-start sm:items-center gap-5 sm:gap-6 flex-1 min-w-0">
          {/* Score Circle */}
          <div className="relative size-20 sm:size-24 aspect-square flex-none flex items-center justify-center">
            <svg
              viewBox="0 0 96 96"
              preserveAspectRatio="xMidYMid meet"
              className="size-full -rotate-90"
            >
              <circle
                cx="48"
                cy="48"
                r="42"
                fill="transparent"
                stroke="#494454"
                strokeWidth="4"
                strokeOpacity="0.2"
              />
              <motion.circle
                cx="48"
                cy="48"
                r="42"
                fill="transparent"
                stroke="#cebdff"
                strokeWidth="4"
                strokeDasharray={264}
                initial={{ strokeDashoffset: 264 }}
                animate={{ strokeDashoffset: 264 - (264 * session.score) / 100 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-xl sm:text-2xl font-black text-[#e1e2e7]">
              {session.score}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-[#e1e2e7] leading-tight">
              {session.company} • {session.role}
            </h3>
            <p className="text-[#cbc3d7]/60 text-sm mt-1">
              {t("history.session_date", { date: session.date })}
            </p>
            <div className="flex items-center gap-2 sm:gap-3 mt-4 min-w-0">
              <div className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 bg-[#cebdff]/10 rounded-full border border-[#cebdff]/20 min-w-0">
                <Clock size={12} className="text-[#cebdff] shrink-0" />
                <span className="text-[0.65rem] font-bold text-[#cebdff] uppercase tracking-widest whitespace-nowrap">
                  {session.duration}
                </span>
              </div>
              <div className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 bg-[#7bd0ff]/10 rounded-full border border-[#7bd0ff]/20 min-w-0">
                <MessageSquare size={12} className="text-[#7bd0ff] shrink-0" />
                <span className="text-[0.65rem] font-bold text-[#7bd0ff] uppercase tracking-widest whitespace-nowrap">
                  {t("history.questions_count", { count: session.questionCount })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Buttons */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
          <button
            onClick={onShare}
            className={`flex items-center justify-center gap-2 px-4 h-10 rounded-full text-[0.65rem] font-bold uppercase tracking-widest transition-all w-full sm:w-auto whitespace-nowrap cursor-pointer ${
              shareEnabled
                ? "bg-[#cebdff]/10 border border-[#cebdff]/30 text-[#cebdff] hover:bg-[#cebdff]/20"
                : "bg-[#111417] border border-[#494454]/20 text-[#e1e2e7] hover:bg-[#191c1f]"
            }`}
          >
            <Share2 size={13} className={shareEnabled ? "text-[#cebdff]" : ""} /> {t("history.share_report")}
          </button>
          <button
            onClick={onViewReport}
            className="flex items-center justify-center gap-2 px-5 h-10 bg-[#9b7fed] text-[#31057e] rounded-full text-[0.65rem] font-bold uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-[#9b7fed]/20 cursor-pointer w-full sm:w-auto whitespace-nowrap"
          >
            <FileText size={13} /> {t("history.view_full_analysis")}
          </button>
          {onDeleteSession && (
            <div className="flex justify-center lg:justify-start w-full">
              <button
                onClick={onDeleteSession}
                className="flex items-center justify-center h-10 w-10 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/30 text-red-400 hover:text-red-300 rounded-full transition-all cursor-pointer shadow-md group shrink-0"
                title={t("history.delete_session")}
              >
                <Trash2
                  size={15}
                  className="group-hover:scale-105 transition-transform"
                />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SessionDetailHeader;
