import { useTranslation } from "react-i18next";
import type { ProfileFormProps } from "../../../types/types";

const ProfileForm = ({ profile, onChange }: ProfileFormProps) => {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-3">
        <label className="text-[0.65rem] uppercase tracking-[0.3em] text-[#cebdff] font-black ml-1">
          {t("myinfo.name_label")}
        </label>
        <input
          type="text"
          value={profile.name}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder={t("myinfo.name_placeholder")}
          className="w-full bg-[#111417] border border-[#494454]/20 rounded-2xl py-4 px-6 text-[#e1e2e7] focus:ring-2 focus:ring-[#cebdff]/20 focus:border-[#cebdff]/30 transition-all outline-none"
        />
      </div>

      <div className="space-y-3">
        <label className="text-[0.65rem] uppercase tracking-[0.3em] text-[#cebdff] font-black ml-1">
          {profile.loginProvider === "GOOGLE" ? t("myinfo.email_label") : t("myinfo.id_label")}
        </label>
        <input
          type="text"
          value={profile.loginProvider === "GOOGLE" ? profile.email : profile.loginId}
          disabled
          className="w-full bg-[#111417] border border-[#494454]/20 rounded-2xl py-4 px-6 text-[#e1e2e7] opacity-60 cursor-not-allowed outline-none"
        />
      </div>

      <div className="col-span-1 md:col-span-2 space-y-3">
        <label className="text-[0.65rem] uppercase tracking-[0.3em] text-[#cebdff] font-black ml-1">
          {t("myinfo.bio_label")}
        </label>
        <textarea
          value={profile.bio}
          onChange={(e) => onChange("bio", e.target.value)}
          placeholder={t("myinfo.bio_placeholder")}
          rows={6}
          className="w-full bg-[#111417] border border-[#494454]/20 rounded-3xl py-4 px-6 text-[#e1e2e7] focus:ring-2 focus:ring-[#cebdff]/20 focus:border-[#cebdff]/30 transition-all outline-none resize-none"
        />
      </div>
    </div>
  );
};

export default ProfileForm;
