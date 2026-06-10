import { motion } from "framer-motion";
import { AlertCircle, MessageCircle, Sparkles, User } from "lucide-react";
import type { TranscriptItemProps } from "../../../types/types";

const TranscriptItem = ({ pair }: TranscriptItemProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-[#191c1f]/40 rounded-[2.5rem] pt-6 pb-10 px-10 border border-[#494454]/10 space-y-8"
    >
      {/* Interviewer Section */}
      <div className="space-y-2 mt-2">
        <div className="flex justify-between gap-4 mb-1 -mt-2">
          <div className="flex gap-2">
            {pair.tags?.map((tag) => (
              <span
                key={tag}
                className="px-4 py-1.5 bg-white/5 text-[#cbc3d7]/60 text-[0.65rem] font-bold uppercase rounded-full border border-white/10"
              >
                {tag}
              </span>
            ))}
          </div>

          {pair.aiInsight && (
            <div
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-[0.65rem] font-black uppercase tracking-widest ${
                pair.aiInsightType === "negative"
                  ? "bg-red-400/10 border-red-400/20 text-red-400"
                  : "bg-[#cebdff]/10 border-[#cebdff]/20 text-[#cebdff]"
              }`}
            >
              {pair.aiInsightType === "negative" ? (
                <AlertCircle size={14} />
              ) : (
                <Sparkles size={14} />
              )}
              AI 인사이트: {pair.aiInsight}
            </div>
          )}
        </div>

        <div className="flex gap-6 mt-8">
          <div className="w-12 h-12 rounded-2xl bg-[#cebdff]/10 flex items-center justify-center shrink-0 border border-[#cebdff]/20">
            <MessageCircle size={20} className="text-[#cebdff]" />
          </div>

          <div className="space-y-2 pt-1 flex flex-col justify-center">
            <p className="text-[1.05rem] text-[#e1e2e7] font-medium leading-relaxed tracking-[0.01em]">
              {pair.question}
            </p>
          </div>
        </div>
      </div>

      {/* Candidate Section */}
      <div className="flex gap-6">
        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
          <User size={20} className="text-[#cbc3d7]" />
        </div>
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-[#cbc3d7] leading-relaxed font-light text-lg">
              {pair.answer}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TranscriptItem;
