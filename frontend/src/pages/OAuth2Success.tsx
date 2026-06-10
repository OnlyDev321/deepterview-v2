import { useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../services/AuthContext";
import { motion } from "framer-motion";

const OAuth2Success = () => {
  const navigate = useNavigate();
  const { loginSocial } = useContext(AuthContext);
  const hasRun = useRef(false);

  useEffect(() => {
    // Dùng ref để tránh chạy 2 lần trong React StrictMode
    if (hasRun.current) return;
    hasRun.current = true;

    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const accessToken = params.get("accessToken");
      const refreshToken = params.get("refreshToken");

      if (!accessToken || !refreshToken) {
        // Không có token → redirect về signin với thông báo lỗi
        navigate("/signin", {
          replace: true,
          state: { error: "소셜 로그인에 실패했습니다. 다시 시도해주세요." },
        });
        return;
      }

      try {
        await loginSocial(accessToken, refreshToken);
        navigate("/dashboard", { replace: true });
      } catch (err) {
        console.error("Social login failed:", err);
        navigate("/signin", {
          replace: true,
          state: { error: "소셜 로그인 처리 중 오류가 발생했습니다." },
        });
      }
    };

    handleCallback();
  }, [navigate, loginSocial]);

  return (
    <motion.div
      className="min-h-screen bg-[#05070a] flex flex-col items-center justify-center gap-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Spinner */}
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-white/10" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
      </div>

      <motion.div
        className="text-center"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <p className="text-white/80 font-medium text-lg">로그인 처리 중...</p>
        <p className="text-white/30 text-sm mt-1">잠시만 기다려 주세요</p>
      </motion.div>
    </motion.div>
  );
};

export default OAuth2Success;
