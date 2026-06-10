import { useRef } from "react";
import { motion } from "framer-motion";
import type { AvatarUploadProps } from "../../../types/types";
import { Camera } from "lucide-react";

const AvatarUpload = ({ avatar, onAvatarChange }: AvatarUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onAvatarChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative group">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="w-40 h-40 rounded-full border-4 border-[#cebdff]/20 overflow-hidden bg-[#111417] shadow-[0_0_50px_rgba(206,189,255,0.1)]"
        >
          <img
            src={avatar || "https://picsum.photos/seed/avatar/200/200"}
            alt="Profile"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </motion.div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="absolute bottom-2 right-2 w-10 h-10 bg-[#cebdff] text-[#31057e] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all z-10 cursor-pointer"
        >
          <Camera size={20} />
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
        />
      </div>

      <div className="text-center ">
        <h3 className="text-xl font-black text-[#e1e2e7] tracking-tight">
          프로필 정보
        </h3>
        <div className="w-12 h-1 bg-[#cebdff] mx-auto mt-2 rounded-full opacity-50" />
      </div>
    </div>
  );
};

export default AvatarUpload;
