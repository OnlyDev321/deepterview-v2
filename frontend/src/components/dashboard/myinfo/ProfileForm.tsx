import type { ProfileFormProps } from "../../../types/types";

const ProfileForm = ({ profile, onChange }: ProfileFormProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-3">
        <label className="text-[0.65rem] uppercase tracking-[0.3em] text-[#cebdff] font-black ml-1">
          이름
        </label>
        <input
          type="text"
          value={profile.name}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder="김동우"
          className="w-full bg-[#111417] border border-[#494454]/20 rounded-2xl py-4 px-6 text-[#e1e2e7] focus:ring-2 focus:ring-[#cebdff]/20 focus:border-[#cebdff]/30 transition-all outline-none"
        />
      </div>

      <div className="space-y-3">
        <label className="text-[0.65rem] uppercase tracking-[0.3em] text-[#cebdff] font-black ml-1">
          이메일
        </label>
        <input
          type="email"
          value={profile.email}
          onChange={(e) => onChange("email", e.target.value)}
          placeholder="observer@deepterview.ai"
          className="w-full bg-[#111417] border border-[#494454]/20 rounded-2xl py-4 px-6 text-[#e1e2e7] focus:ring-2 focus:ring-[#cebdff]/20 focus:border-[#cebdff]/30 transition-all outline-none"
        />
      </div>

      <div className="col-span-1 md:col-span-2 space-y-3">
        <label className="text-[0.65rem] uppercase tracking-[0.3em] text-[#cebdff] font-black ml-1">
          소개
        </label>
        <textarea
          value={profile.bio}
          onChange={(e) => onChange("bio", e.target.value)}
          placeholder="자신에 대해 알려주세요..."
          rows={6}
          className="w-full bg-[#111417] border border-[#494454]/20 rounded-3xl py-4 px-6 text-[#e1e2e7] focus:ring-2 focus:ring-[#cebdff]/20 focus:border-[#cebdff]/30 transition-all outline-none resize-none"
        />
      </div>
    </div>
  );
};

export default ProfileForm;
