import { useState, useContext, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import type { UserProfile } from "../../types/types";
import AvatarUpload from "../../components/dashboard/myinfo/AvatarUpload";
import ProfileForm from "../../components/dashboard/myinfo/ProfileForm";
import AccountActions from "../../components/dashboard/myinfo/AccountActions";
import { authService } from "../../services/authService";
import { AuthContext } from "../../services/AuthContext";

const MyinfoLayout = () => {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    email: "kimdongju123@gmail.com",
    loginId: "",
    profileImageUrl: "",
    bio: "",
    loginProvider: "LOCAL",
  });
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const { logout, setUser } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await authService.getProfile();
        setProfile({
          name: data.name || "",
          email: data.email || "",
          loginId: data.loginId || "",
          profileImageUrl: data.profileImageUrl || "",
          bio: data.bio || "",
          loginProvider: data.loginProvider || "LOCAL",
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

  const handleAvatarChange = async (file: File) => {
    try {
      const avatarUrl = await authService.uploadAvatar(file);
      handleFieldChange("profileImageUrl", avatarUrl);
    } catch (error) {
      console.error("Failed to upload avatar:", error);
      alert(t("myinfo.avatar_upload_failed"));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedUser = await authService.updateProfile({
        name: profile.name,
        bio: profile.bio,
        profileImageUrl: profile.profileImageUrl,
      });
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      alert(t("myinfo.save_success"));
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert(t("myinfo.save_error"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      window.confirm(t("myinfo.confirm_delete"))
    ) {
      try {
        await authService.deleteAccount();
        alert(t("myinfo.delete_success"));
        logout();
        navigate("/");
      } catch (error) {
        console.error("Failed to delete account:", error);
        alert(t("myinfo.delete_error"));
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
        <h2 className="text-3xl sm:text-5xl font-black tracking-tighter text-[#e1e2e7] mb-4">
          {t("myinfo.title")}
        </h2>
        <p className="text-[#cbc3d7]/60 text-lg font-light">
          {t("myinfo.desc")}
        </p>
      </motion.div>

      <motion.div
        className="bg-[#191c1f] rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-12 border border-[#494454]/10 shadow-[0_0_80px_rgba(0,0,0,0.3)] space-y-12"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        <AvatarUpload
          avatar={profile.profileImageUrl}
          onAvatarChange={handleAvatarChange}
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
