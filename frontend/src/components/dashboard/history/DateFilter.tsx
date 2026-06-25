import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar } from "lucide-react";

interface Props {
  value: number | null;
  onChange: (days: number | null) => void;
}

const options: { label: string; days: number | null }[] = [
  { label: "전체", days: null },
  { label: "오늘", days: 0 },
  { label: "최근 7일", days: 7 },
  { label: "최근 30일", days: 30 },
  { label: "최근 90일", days: 90 },
];

const DateFilter = ({ value, onChange }: Props) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const currentLabel = options.find((o) => o.days === value)?.label ?? "전체";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 px-5 py-3 bg-[#191c1f] border border-[#494454]/20 text-[#cbc3d7] rounded-2xl text-xs font-bold hover:border-[#cebdff]/30 transition-all cursor-pointer whitespace-nowrap"
      >
        <Calendar size={14} /> {currentLabel}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute left-0 top-full mt-2 z-50 w-44 rounded-2xl border border-[#494454]/30 bg-[#191c1f] shadow-xl shadow-black/40 overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            {options.map((opt) => (
              <button
                key={opt.label}
                onClick={() => {
                  onChange(opt.days);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-[#24272b] cursor-pointer ${
                  value === opt.days
                    ? "text-[#cebdff] font-bold"
                    : "text-[#cbc3d7]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DateFilter;
