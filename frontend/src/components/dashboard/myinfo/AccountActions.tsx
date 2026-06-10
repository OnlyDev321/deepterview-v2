import { motion } from "framer-motion";
import type { AccountActionsProps } from "../../../types/types";
import { Save, Trash2 } from "lucide-react";

const AccountActions = ({
  onSave,
  onDelete,
  isSaving,
}: AccountActionsProps) => {
  return (
    <div className="flex items-center justify-between pt-8 border-t border-[#494454]/10">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onDelete}
        className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors text-[0.7rem] uppercase tracking-widest font-bold px-4 py-2 cursor-pointer"
      >
        <Trash2 size={16} />
        계정 삭제
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onSave}
        disabled={isSaving}
        className="flex items-center gap-3 px-10 py-4 bg-[#9b7fed] text-[#31057e] rounded-full text-xs font-bold uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-[#9b7fed]/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        <Save size={16} />
        {isSaving ? "저장 중..." : "변경 사항 저장"}
      </motion.button>
    </div>
  );
};

export default AccountActions;
