import { ArrowRight, Sparkles } from "lucide-react";

const AIInsight = () => {
  return (
    <div className="bg-[#191c1f] rounded-[2rem] p-8 border border-[#494454]/10">
      <div className="flex items-center gap-3 mb-6">
        {/* positive */}
        <Sparkles size={18} className="text-[#cebdff]" />
        <h4 className="text-[0.65rem] uppercase tracking-[0.2em] text-[#cbc3d7]/60 font-bold">
          AI 인사이트: 뛰어난 논리력
        </h4>

        {/* negative */}
        {/* <AlertCircle size={18} className="text-rose-400" />
        <h4 className="text-[0.65rem] uppercase tracking-[0.2em] text-rose-400 font-bold">
          AI 인사이트: 더 구체적인 설명 필요
        </h4> */}
      </div>

      <p className="text-[#e1e2e7]/80 leading-relaxed text-sm mb-8 font-light italic">
        "귀하의 답변은 강력한 논리적 구조와 명확한 추론을 보여줍니다. 더욱
        영향력 있는 답변을 위해 주요 전환 시점에서 약간 속도를 늦추어 리더십과
        의사 결정 능력을 더 잘 강조하는 것을 고려해 보세요."
      </p>

      <button className="flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-widest text-[#cebdff] hover:gap-3 transition-all cursor-pointer">
        전체 분석 보기 <ArrowRight size={14} />
      </button>
    </div>
  );
};

export default AIInsight;
