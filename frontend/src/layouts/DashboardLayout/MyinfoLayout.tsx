import { useState, useContext, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import type { UserProfile } from "../../types/types";
import AvatarUpload from "../../components/dashboard/myinfo/AvatarUpload";
import ProfileForm from "../../components/dashboard/myinfo/ProfileForm";
import AccountActions from "../../components/dashboard/myinfo/AccountActions";
import { authService } from "../../services/authService";
import { AuthContext } from "../../services/AuthContext";

const MyinfoLayout = () => {
  const [profile, setProfile] = useState<UserProfile>({
    name: "김동우",
    email: "kimdongju123@gmail.com",
    profileImageUrl: "",
    bio: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await authService.getProfile();
        setProfile({
          name: data.name || "",
          email: data.email || "",
          profileImageUrl: data.profileImageUrl || "",
          bio: data.bio || "",
        });
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleFieldChange = (field: keyof UserProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await authService.updateProfile({
        name: profile.name,
        bio: profile.bio,
        profileImageUrl: profile.profileImageUrl,
      });
      alert("프로필이 성공적으로 업데이트되었습니다!");
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("프로필 업데이트 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      window.confirm("계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")
    ) {
      try {
        await authService.deleteAccount();
        alert("계정이 성공적으로 삭제되었습니다.");
        logout();
        navigate("/");
      } catch (error) {
        console.error("Failed to delete account:", error);
        alert("계정 삭제 중 오류가 발생했습니다. 다시 시도해주세요.");
      }
    }
  };
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9B7FED]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
      >
        <h2 className="text-5xl font-black tracking-tighter text-[#e1e2e7] mb-4">
          내 프로필
        </h2>
        <p className="text-[#cbc3d7]/60 text-lg font-light">
          개인 정보 및 계정 설정을 관리하세요
        </p>
      </motion.div>

      <motion.div
        className="bg-[#191c1f] rounded-[3rem] p-12 border border-[#494454]/10 shadow-[0_0_80px_rgba(0,0,0,0.3)] space-y-12"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        <AvatarUpload
          avatar={profile.profileImageUrl}
          onAvatarChange={(newAvatar) =>
            handleFieldChange("profileImageUrl", newAvatar)
          }
        />

        <ProfileForm profile={profile} onChange={handleFieldChange} />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, duration: 0.4 }}
        >
          <AccountActions
            onSave={handleSave}
            onDelete={handleDelete}
            isSaving={isSaving}
          />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default MyinfoLayout;
