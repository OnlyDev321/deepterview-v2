import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { X, Check, Copy, Link2, Link2Off } from "lucide-react";
import { useState } from "react";

interface ShareModalProps {
  shareToken: string;
  shareEnabled: boolean;
  onClose: () => void;
  onToggle: () => void;
}

const ShareModal = ({ shareToken, shareEnabled, onClose, onToggle }: ShareModalProps) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/report/${shareToken}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-[#191c1f] border border-white/10 rounded-[2rem] p-8 w-full max-w-md shadow-2xl"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#cebdff]/10 flex items-center justify-center border border-[#cebdff]/20">
              {shareEnabled ? (
                <Link2 size={18} className="text-[#cebdff]" />
              ) : (
                <Link2Off size={18} className="text-[#cbc3d7]/40" />
              )}
            </div>
            <h3 className="text-lg font-bold text-[#e1e2e7]">
              {t("share.modal_title")}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#cbc3d7]/60 hover:text-white transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-sm text-[#cbc3d7]/60 mb-6 leading-relaxed">
          {shareEnabled
            ? t("share.modal_desc_on")
            : t("share.modal_desc_off")}
        </p>

        {shareEnabled && (
          <div className="flex items-center gap-2 mb-6 p-3 bg-black/40 rounded-2xl border border-white/5">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 bg-transparent text-sm text-[#e1e2e7] outline-none truncate"
            />
            <button
              onClick={handleCopy}
              className="shrink-0 w-9 h-9 rounded-xl bg-[#cebdff]/10 hover:bg-[#cebdff]/20 flex items-center justify-center text-[#cebdff] transition-all cursor-pointer"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onToggle}
            className={`flex-1 px-5 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${
              shareEnabled
                ? "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                : "bg-[#9b7fed] text-[#31057e] hover:brightness-110"
            }`}
          >
            {shareEnabled ? t("share.disable") : t("share.enable")}
          </button>
          {copied && (
            <span className="flex items-center text-[0.65rem] text-emerald-400 font-bold whitespace-nowrap">
              {t("share.copied")}
            </span>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ShareModal;
