import { useState, useContext } from "react";
import type { Auth } from "../../types";
import {
  ArrowRight,
  Lock,
  MessageCircle,
  Eye,
  EyeOff,
  User,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import iconGoogle from "../../assets/iconGoogle.svg";
import { fakeLogin } from "../../mocks/signData";
import { AuthContext } from "../../services/AuthContext";
import { authService } from "../../services/authService";

const Rightside = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState<Auth>(
    location.state?.tab || "login",
  );
  const isRegister = activeTab === "register";
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"error" | "success" | null>(
    null,
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleTabChange = (tab: Auth) => {
    setActiveTab(tab);
    setMessage(null);
    setMessageType(null);
  };


  const handleSubmit = async () => {
    setMessage(null);
    setMessageType(null);
    try {
      if (isRegister) {
        const form = document.querySelector("form") as HTMLFormElement;
        const formData = new FormData(form);

        // validate password and confirm password
        const id = formData.get("id") as string;
        const password = formData.get("password") as string;
        const confirmPassword = formData.get("confirmPassword") as string;

        if (!id || id.trim() === "") {
          setMessage("아이디를 입력해주세요.");
          setMessageType("error");
          return;
        }
        // regex validate password
        const passwordRegex =
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
        if (!passwordRegex.test(password)) {
          setMessage(
            "비밀번호는 8자 이상이며 대문자, 소문자, 숫자 및 특수문자를 포함",
          );
          setMessageType("error");
          return;
        }
        // check confirm password
        if (password !== confirmPassword) {
          setMessage("비밀번호가 일치하지 않습니다");
          setMessageType("error");
          return;
        }

        setTimeout(() => {
          setMessage("회원가입이 완료되었습니다!");
          setMessageType("success");
        });
        setTimeout(() => {
          setMessage(null);
          setMessageType(null);
        }, 3000);
        setActiveTab("login");
      } else {
        const form = document.querySelector("form") as HTMLFormElement;
        const formData = new FormData(form);
        const id = formData.get("id") as string;
        const password = formData.get("password") as string;

        if (!id || id.trim() === "") {
          setMessage("아이디를 입력해주세요.");
          setMessageType("error");
          return;
        }

        // validate password (same rule as register)
        const passwordRegex =
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

        if (!passwordRegex.test(password)) {
          setMessage(
            "비밀번호는 8자 이상이며 대문자, 소문자, 숫자 및 특수문자를 포함해야 합니다",
          );
          setMessageType("error");
          return;
        }
        const data = await fakeLogin(1);
        login(data.accessToken, data.refreshToken, data.user);
        console.log(data);
        // const data = await authService.getProfile();
        navigate("/dashboard");
      }
    } catch (error) {
      console.log(error);
      setMessage("Register fall");
      setMessageType("error");
    }
  };

  return (
    <section className="w-full md:w-1/2 bg-background flex items-center justify-center p-6 md:p-12 lg:p-20 relative">
      <div className="w-full max-w-md">
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-on-background mb-2">
            {isRegister ? "환영합니다" : "안녕하세요!"}
          </h2>
          <p className="text-on-surface-variant/60">
            {isRegister
              ? "딥터뷰와 함께 완벽한 면접을 준비해 보세요."
              : "면접 마스터를 향한 여정을 계속하세요."}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-surface-container-lowest p-1.5 rounded-full mb-10 border border-white/5">
          <button
            onClick={() => handleTabChange("login")}
            className={`flex-1 py-3 px-6 rounded-full font-medium transition-all duration-300 cursor-pointer ${
              activeTab === "login"
                ? "bg-surface-container-high text-primary shadow-lg"
                : "text-on-surface-variant/60 hover:text-on-background"
            }`}
          >
            로그인
          </button>
          <button
            onClick={() => handleTabChange("register")}
            className={`flex-1 py-3 px-6 rounded-full font-medium transition-all duration-300 cursor-pointer ${
              activeTab === "register"
                ? "bg-surface-container-high text-primary shadow-lg"
                : "text-on-surface-variant/60 hover:text-on-background"
            }`}
          >
            회원가입
          </button>
        </div>

        {/* Form */}
        <form
          key={activeTab}
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <div className="flex flex-col gap-2">
            <label className="text-[0.7rem] uppercase tracking-[0.15em] font-bold text-primary/80 ml-4">
              아이디
            </label>
            <div className="relative group">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                name="id"
                placeholder="아이디를 입력하세요"
                required
                className="w-full bg-surface-container-lowest border-none ring-1 ring-white/10 focus:ring-2 focus:ring-primary/50 rounded-2xl py-4 pl-14 pr-6 placeholder:text-white/20 transition-all outline-none"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center px-4">
              <label className="text-[0.7rem] uppercase tracking-[0.15em] font-bold text-primary/80">
                비밀번호
              </label>
              {activeTab === "login" && (
                <a
                  href="#"
                  className="text-[0.7rem] uppercase tracking-[0.15em] text-on-surface-variant/40 hover:text-primary transition-colors"
                >
                  비밀번호 재설정
                </a>
              )}
            </div>
            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                required
                className="w-full bg-surface-container-lowest border-none ring-1 ring-white/10 focus:ring-2 focus:ring-primary/50 rounded-2xl py-4 pl-14 pr-12 placeholder:text-white/20 transition-all outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 hover:text-primary transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          {/* when click Register button logic  */}
          {activeTab === "register" && (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center px-4">
                <label className="text-[0.7rem] uppercase tracking-[0.15em] font-bold text-primary/80">
                  비밀번호 확인
                </label>
              </div>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="••••••••"
                  required
                  className="w-full bg-surface-container-lowest border-none ring-1 ring-white/10 focus:ring-2 focus:ring-primary/50 rounded-2xl py-4 pl-14 pr-12 placeholder:text-white/20 transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 hover:text-primary transition-colors cursor-pointer"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>
          )}
          {activeTab === "login" && (
            <div className="flex items-center gap-3 px-4">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  id="keep-logged"
                  className="peer appearance-none w-5 h-5 rounded border border-white/10 bg-surface-container-lowest checked:bg-primary-container checked:border-primary-container transition-all cursor-pointer"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity">
                  <div className="w-2 h-2 bg-on-background rounded-full" />
                </div>
              </div>
              <label
                htmlFor="keep-logged"
                className="text-sm text-on-surface-variant/80 cursor-pointer select-none"
              >
                로그인 유지
              </label>
            </div>
          )}
          {activeTab === "login" && (
            <>
              {/* Divider */}
              <div className="flex items-center gap-4 my-4">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-xs text-white/40 tracking-widest">
                  소셜 로그인
                </span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Social Login */}
              <div className="grid grid-cols-2 gap-4">
                {/* Google */}
                <button
                  type="button"
                  className="w-full bg-surface-container-lowest text-white py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 transition border border-white/5 cursor-pointer"
                  onClick={() => {
                    try {
                      window.location.href = authService.getGoogleAuthUrl();
                    } catch (error) {
                      console.error("Google login error:", error);
                    }
                  }}
                >
                  <img src={iconGoogle} alt="google" className="w-5 h-5" />
                  <span className="font-medium">Google</span>
                </button>

                {/* Kakao */}
                <button
                  type="button"
                  className="w-full bg-surface-container-lowest text-white py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 transition cursor-pointer border border-white/5"
                  onClick={() => {
                    try {
                      window.location.href = authService.getKakaoAuthUrl();
                    } catch (error) {
                      console.error("Kakao login error:", error);
                    }
                  }}
                >
                  <MessageCircle className="w-5 h-5 text-[#FEE500]" />
                  <span className="font-medium">카카오톡</span>
                </button>
              </div>
            </>
          )}

          {message && (
            <div
              className={`flex items-center gap-3 text-sm px-4 py-3 rounded-xl border backdrop-blur-sm transition-all duration-300
                ${
                  messageType === "error"
                    ? "bg-red-500/10 border-red-500/20 text-red-400"
                    : "bg-green-500/10 border-green-500/20 text-green-400"
                }`}
            >
              <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
              <span>{message}</span>
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-primary-container text-on-background font-bold py-4 rounded-2xl glow-button flex items-center justify-center gap-2 group cursor-pointer"
          >
            {isRegister ? "회원가입" : "로그인"}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="mt-12 text-center">
          <p className="text-sm text-on-surface-variant/50">
            {/* 조건부 렌더링: 현재 탭 상태에 따라 질문과 링크 텍스트가 바뀝니다. */}
            {isRegister ? "이미 계정이 있으신가요?" : "플랫폼이 처음이신가요?"}
            <a
              onClick={() => handleTabChange(isRegister ? "login" : "register")}
              className="text-primary font-semibold ml-1 hover:underline underline-offset-4 decoration-primary/30 cursor-pointer"
            >
              {isRegister ? "로그인하기" : "회원가입"}
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Rightside;
