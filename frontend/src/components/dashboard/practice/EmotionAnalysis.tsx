import { motion } from "framer-motion";

type EmotionAnalysisProps = {
  eyeContact: number;
  confidence: number;
  anxiety: number;
};

const EmotionAnalysis = ({
  eyeContact,
  confidence,
  anxiety,
}: EmotionAnalysisProps) => {
  const getColorData = (val: number, label: string) => {
    // Shared color logic for both text badges and bars
    let colorClasses = {
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
    };

    const isAnxiety = label === "긴장도";
    const isRed = isAnxiety ? val >= 71 : val <= 20;
    const isYellow = val > 20 && val <= 70;

    if (isRed) {
      colorClasses = { color: "text-red-400", bg: "bg-red-400/10" };
    } else if (isYellow) {
      colorClasses = { color: "text-yellow-400", bg: "bg-yellow-400/10" };
    }

    return colorClasses;
  };

  const metrics = [
    {
      label: "아이 컨택",
      value: eyeContact,
      ...getColorData(eyeContact, "아이 컨택"),
    },
    {
      label: "자신감 지수",
      value: confidence,
      ...getColorData(confidence, "자신감 지수"),
    },
    {
      label: "긴장도",
      value: anxiety,
      ...getColorData(anxiety, "긴장도"),
    },
  ];

  // The bars represent the 3 metrics
  const bars = [
    { value: eyeContact, label: "아이 컨택" },
    { value: confidence, label: "자신감 지수" },
    { value: anxiety, label: "긴장도" },
  ];

  const getBarColor = (val: number, label: string) => {
    // For Anxiety, low is good (green) and high is bad (red)
    if (label === "긴장도") {
      if (val <= 20) return "from-green-500/50 to-green-500/10";
      if (val <= 70) return "from-yellow-500/50 to-yellow-500/10";
      return "from-red-500/50 to-red-500/10";
    }
    // For others, low is bad (red) and high is good (green)
    if (val <= 20) return "from-red-500/50 to-red-500/10";
    if (val <= 70) return "from-yellow-500/50 to-yellow-500/10";
    return "from-green-500/50 to-green-500/10";
  };

  return (
    <div className="bg-[#191c1f] rounded-[2rem] p-6 border border-[#494454]/10 h-full flex flex-col">
      <h4 className="text-[0.6rem] uppercase tracking-[0.2em] text-[#cbc3d7]/60 font-bold mb-6">
        실시간 감정 분석 (LIVE)
      </h4>

      <div className="space-y-4 mb-8">
        {metrics.map((m) => (
          <div key={m.label} className="flex items-center justify-between">
            <span className="text-xs text-[#e1e2e7]/80">{m.label}</span>
            <span
              className={`px-3 py-1 ${m.bg} ${m.color} text-lg font-mono font-black rounded-xl border border-current transition-all duration-300 shadow-md`}
            >
              {m.value}%
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-end justify-around h-40 gap-6 mt-auto px-2">
        {bars.map((bar, i) => (
          <div
            key={i}
            className="flex flex-col items-center justify-end flex-1 h-full"
          >
            <motion.div
              initial={{ height: "0%" }}
              animate={{ height: `${Math.min(100, Math.max(15, bar.value))}%` }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              className={`w-full bg-gradient-to-t ${getBarColor(
                bar.value,
                bar.label
              )} rounded-t-lg relative group transition-colors duration-500 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]`}
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity rounded-t-lg" />
            </motion.div>
            <span className="text-[0.6rem] text-[#cbc3d7]/40 font-bold uppercase truncate w-full text-center mt-3">
              {bar.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmotionAnalysis;
