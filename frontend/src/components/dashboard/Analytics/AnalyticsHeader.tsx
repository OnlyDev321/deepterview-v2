import { Calendar, Clock } from "lucide-react";
import type { AnalyticsHeaderProps } from "../../../types/types";
import { motion } from "framer-motion";

const AnalyticsHeader = ({
  company,
  role,
  date,
  duration,
  score,
}: AnalyticsHeaderProps) => {
  return (
    <div className="flex items-start justify-between mb-12">
      <div className="space-y-4">
        <span className="text-[0.65rem] uppercase tracking-[0.3em] text-[#cebdff] font-black">
          면접 세션
        </span>
        <h1 className="text-5xl font-black tracking-tighter text-[#e1e2e7]">
          {company} • {role}
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-[#191c1f] border border-[#494454]/20 rounded-xl text-[0.7rem] text-[#cbc3d7]/60">
            <Calendar size={14} />
            {date}
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-[#191c1f] border border-[#494454]/20 rounded-xl text-[0.7rem] text-[#cbc3d7]/60">
            <Clock size={14} />
            {duration}
          </div>
        </div>
      </div>

      <div className="relative w-32 h-32 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="56"
            fill="transparent"
            stroke="#494454"
            strokeWidth="4"
            strokeOpacity="0.1"
          />
          <motion.circle
            cx="64"
            cy="64"
            r="56"
            fill="transparent"
            stroke="#cebdff"
            strokeWidth="4"
            strokeDasharray={352}
            initial={{ strokeDashoffset: 352 }}
            animate={{ strokeDashoffset: 352 - (352 * score) / 100 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-3xl font-black text-[#e1e2e7] leading-none">
            {score}
          </span>
          <span className="text-[0.5rem] uppercase tracking-widest text-[#cbc3d7]/40 font-bold mt-1">
            점수 / 100
          </span>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsHeader;
