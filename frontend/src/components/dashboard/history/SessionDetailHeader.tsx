import { motion } from "framer-motion";
import type { SessionDetailHeaderProps } from "../../../types/types";
import { Clock, FileText, MessageSquare, Share2, Trash2 } from "lucide-react";

const SessionDetailHeader = ({ session, onViewReport, onDeleteSession }: SessionDetailHeaderProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#191c1f] rounded-[2.5rem] p-8 border border-[#494454]/10 shadow-[0_0_50px_rgba(0,0,0,0.2)] flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden"
    >
      <div className="flex items-center gap-8 min-w-0 flex-1">
        {/* Score Circle */}
        <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
          <svg className="w-full h-full -rotate-90">
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
          <span className="absolute text-2xl font-black text-[#e1e2e7]">
            {session.score}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-2xl font-black tracking-tighter text-[#e1e2e7] leading-tight">
            {session.company} • {session.role}
          </h3>
          <p className="text-[#cbc3d7]/60 text-sm mt-1">
            면접 날짜: {session.date}
          </p>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#cebdff]/10 rounded-full border border-[#cebdff]/20">
              <Clock size={12} className="text-[#cebdff]" />
              <span className="text-[0.65rem] font-bold text-[#cebdff] uppercase tracking-widest">
                {session.duration}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#7bd0ff]/10 rounded-full border border-[#7bd0ff]/20">
              <MessageSquare size={12} className="text-[#7bd0ff]" />
              <span className="text-[0.65rem] font-bold text-[#7bd0ff] uppercase tracking-widest">
                {session.questionCount} 질문
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 shrink-0">
        <button className="flex flex-nowrap items-center gap-2 px-6 py-3 whitespace-nowrap bg-[#111417] border border-[#494454]/20 text-[#e1e2e7] rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#191c1f] transition-all">
          <Share2 size={14} /> 보고서 공유
        </button>
        <button
          onClick={onViewReport}
          className="flex flex-nowrap items-center gap-2 px-8 py-4 whitespace-nowrap bg-[#9b7fed] text-[#31057e] rounded-full text-xs font-bold uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-[#9b7fed]/20 cursor-pointer"
        >
          <FileText size={14} /> 전체 분석 보기
        </button>
        {onDeleteSession && (
          <button
            onClick={onDeleteSession}
            className="flex items-center justify-center p-3.5 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/30 text-red-400 hover:text-red-300 rounded-full transition-all cursor-pointer shadow-md group"
            title="세션 삭제"
          >
            <Trash2 size={16} className="group-hover:scale-105 transition-transform" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default SessionDetailHeader;
