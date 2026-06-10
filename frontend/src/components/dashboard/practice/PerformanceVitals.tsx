import { motion } from "framer-motion";

type PerformanceVitalsProps = {
  smileRatio: number;
  headStability: number;
  dominantEmotion: string;
};

const PerformanceVitals = ({
  smileRatio,
  headStability,
  dominantEmotion,
}: PerformanceVitalsProps) => {
  const getEmotionColor = (emotion: string) => {
    switch (emotion) {
      case "행복":
        return "text-emerald-400";
      case "슬픔":
        return "text-blue-500";
      case "놀람":
        return "text-yellow-400";
      case "분노":
        return "text-red-500";
      case "공포":
        return "text-slate-400";
      case "혐오":
        return "text-orange-500";
      case "중립":
      default:
        return "text-[#cebdff]";
    }
  };

  const vitals = [
    {
      label: "미소 비율",
      value: `${smileRatio}%`,
      progress: smileRatio,
      color:
        "bg-gradient-to-r from-emerald-700 via-green-600 to-emerald-500 shadow-[0_0_10px_rgba(22,163,74,0.2)]",
      textColor: "text-emerald-400",
    },
    {
      label: "고개 안정성",
      value: `${headStability}%`,
      progress: headStability,
      color:
        "bg-gradient-to-r from-[#5b4423] via-[#8b6a2b] to-[#c08a32] shadow-[0_0_10px_rgba(192,138,50,0.16)]",
      textColor: "text-[#d4af37]",
    },
    {
      label: "주요 감정 상태",
      value: dominantEmotion,
      textColor: getEmotionColor(dominantEmotion),
    },
  ];

  return (
    <div className="bg-[#191c1f] rounded-[2rem] p-6 border border-[#494454]/10 h-full">
      <h4 className="text-[0.6rem] uppercase tracking-[0.2em] text-[#cbc3d7]/60 font-bold mb-6">
        성과 지표 (LIVE)
      </h4>

      <div className="space-y-8">
        {vitals.map((v) => (
          <div key={v.label} className="space-y-3">
            <div className="flex justify-between items-end">
              <span className="text-[0.65rem] uppercase tracking-widest text-[#cbc3d7]/60 font-bold">
                {v.label}
              </span>
              <span
                className={`text-3xl font-mono font-black leading-none ${v.textColor}`}
              >
                {v.value}
              </span>
            </div>
            {v.progress !== undefined && (
              <div className="h-2.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${v.progress}%` }}
                  transition={{ type: "spring", stiffness: 200, damping: 25 }}
                  className={`h-full ${v.color} rounded-full`}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PerformanceVitals;
