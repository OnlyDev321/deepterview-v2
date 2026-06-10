import { motion } from "framer-motion";
import type { SessionListProps } from "../../../types/types";

const SessionList = ({
  sessions,
  selectedSessionId,
  onSelectSession,
}: SessionListProps) => {
  return (
    <div className="w-80 flex flex-col gap-4 pr-4 border-r border-[#494454]/10 h-full overflow-y-auto custom-scrollbar">
      <div className="px-2 mb-2">
        <h4 className="text-[0.65rem] uppercase tracking-[0.2em] text-[#cbc3d7]/40 font-bold">
          이전 세션
        </h4>
      </div>

      {sessions.map((session) => (
        <motion.button
          key={session.id}
          whileHover={{ x: 4 }}
          onClick={() => onSelectSession(session.id)}
          className={`text-left p-5 rounded-3xl transition-all duration-300 border cursor-pointer ${
            selectedSessionId === session.id
              ? "bg-[#cebdff]/10 border-[#cebdff]/30 shadow-[0_0_30px_rgba(206,189,255,0.05)]"
              : "bg-[#191c1f]/40 border-transparent hover:bg-[#191c1f] hover:border-[#494454]/20"
          }`}
        >
          <div className="flex flex-col gap-1">
            <span
              className={`text-[0.6rem] uppercase tracking-widest font-bold ${
                selectedSessionId === session.id
                  ? "text-[#cebdff]"
                  : "text-[#cbc3d7]/40"
              }`}
            >
              {selectedSessionId === session.id ? "선택됨" : "아카이브"}
            </span>
            <h5 className="text-sm font-bold text-[#e1e2e7] leading-tight">
              {session.company} @ {session.role}
            </h5>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[0.65rem] text-[#cbc3d7]/40">
                {session.date}
              </span>
              <span className="w-1 h-1 rounded-full bg-[#494454]/30" />
              <span className="text-[0.65rem] text-[#cbc3d7]/40">
                {session.duration}
              </span>
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
};

export default SessionList;
