import { motion } from "framer-motion";
import type { InterviewTimelineProps } from "../../../types/types";
import { AlertCircle, MessageCircle, Sparkles, User } from "lucide-react";

const InterviewTimeline = ({ qaPairs, onNavigateToAnalysis }: InterviewTimelineProps) => {
  return (
    <div className="relative pl-12 space-y-12 py-8">
      {/* Timeline Line */}
      <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-[#cebdff]/40 via-[#494454]/20 to-transparent" />

      {qaPairs.map((pair, index) => (
        <motion.div
          key={pair.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="relative"
        >
          {/* Timeline Node */}
          <div className="absolute -left-12 top-0 w-12 h-12 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-[#111417] border-2 border-[#494454] flex items-center justify-center z-10">
              <span className="text-[0.65rem] font-black text-[#cbc3d7]">
                {index + 1}
              </span>
            </div>
          </div>

          <div className="bg-[#191c1f] rounded-[2rem] p-8 border border-[#494454]/10 shadow-[0_0_40px_rgba(0,0,0,0.1)] space-y-8">
            {/* Header / Tags */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-white/5 text-[#cbc3d7]/60 text-[0.6rem] font-bold uppercase rounded-full border border-white/10">
                  실시간 대화록
                </span>
                {pair.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-[#7bd0ff]/10 text-[#7bd0ff] text-[0.6rem] font-bold uppercase rounded-full border border-[#7bd0ff]/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {pair.aiInsight && (
                <div
                  className={`flex items-center gap-2 text-[0.6rem] font-black uppercase tracking-widest ${
                    pair.aiInsightType === "negative"
                      ? "text-red-400"
                      : "text-[#cebdff]"
                  }`}
                >
                  {pair.aiInsightType === "negative" ? (
                    <AlertCircle size={12} />
                  ) : (
                    <Sparkles size={12} />
                  )}
                  AI 인사이트: {pair.aiInsight}
                </div>
              )}
            </div>

            {/* Question */}
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-[#cebdff]/10 flex items-center justify-center shrink-0">
                <MessageCircle size={18} className="text-[#cebdff]" />
              </div>
              <p className="text-[#e1e2e7] text-lg font-light italic leading-relaxed">
                "{pair.question}"
              </p>
            </div>

            {/* Answer */}
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                <User size={18} className="text-[#cbc3d7]" />
              </div>
              <p className="text-[#cbc3d7] leading-relaxed font-light">
                {pair.answer}
              </p>
            </div>

            {pair.answerId && onNavigateToAnalysis && (
              <div className="flex justify-end pt-4 border-t border-white/5">
                <button
                  onClick={() => onNavigateToAnalysis(pair.answerId!)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#cebdff]/10 hover:bg-[#cebdff]/20 text-[#cebdff] rounded-full border border-[#cebdff]/20 text-[0.7rem] font-bold transition-all hover:scale-102 cursor-pointer shadow-lg shadow-[#cebdff]/5 hover:border-[#cebdff]/40"
                >
                  <Sparkles size={12} className="animate-pulse" /> AI 상세 분석 보고서 보기
                </button>
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default InterviewTimeline;
