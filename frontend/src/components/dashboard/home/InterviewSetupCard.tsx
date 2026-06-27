import { ChevronDown, Sliders } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { jobCategoryService } from "../../../services/jobCategoryService";
import PositionDropdown from "./PositionDropdown";
import type { JobCategory, SessionType, AnswerLanguage } from "../../../types";

type InterviewSetupCardProps = {
  totalQuestions: number;
  careerYears: number;
  openPosition: string;
  sessionType: SessionType;
  answerLanguage: AnswerLanguage;
  setTotalQuestions: (m: number) => void;
  setCareerYears: (m: number) => void;
  setOpenPosition: (m: string) => void;
  setJobCategoryId: (id: number) => void;
  setSessionType: (t: SessionType) => void;
  setAnswerLanguage: (l: AnswerLanguage) => void;
};

const LANGUAGES: { value: AnswerLanguage; labelKey: string }[] = [
  { value: "KOREAN", labelKey: "session_setup.language_korean" },
  { value: "ENGLISH", labelKey: "session_setup.language_english" },
  { value: "VIETNAMESE", labelKey: "session_setup.language_vietnamese" },
];

const InterviewSetupCard = ({
  totalQuestions,
  careerYears,
  openPosition,
  answerLanguage,
  setTotalQuestions,
  setCareerYears,
  setOpenPosition,
  setJobCategoryId,
  setSessionType,
  setAnswerLanguage,
}: InterviewSetupCardProps) => {
  const { t, i18n } = useTranslation();
  const [jobCategories, setJobCategories] = useState<JobCategory[]>([]);

  useEffect(() => {
    const fetchJobCategories = async () => {
      const data = await jobCategoryService.getJobCategories(i18n.language);
      setJobCategories(data);
    };

    fetchJobCategories();
  }, [i18n.language]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#191c1f] rounded-3xl p-8 shadow-[0_0_40px_0_rgba(206,189,255,0.05)] border border-[#494454]/5 self-start"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-[#cebdff]/10 rounded-lg">
          <Sliders size={20} className="text-[#cebdff]" />
        </div>
        <h3 className="text-xl font-semibold tracking-tight">{t("session_setup.interview_settings")}</h3>
      </div>

      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-3">
          <label className="block text-[0.65rem] uppercase tracking-[0.2em] text-[#cbc3d7]/70 font-semibold">
            {t("session_setup.position")}
          </label>

          <PositionDropdown
            categories={jobCategories}
            value={openPosition}
            onSelect={(name, id, type) => {
              setOpenPosition(name);
              setJobCategoryId(id);
              setSessionType(type);
            }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
          <div className="space-y-3">
            <label className="block text-[0.65rem] uppercase tracking-[0.2em] text-[#cbc3d7]/70 font-semibold">
              {t("session_setup.career_years")}
            </label>

            <div className="relative group">
              <select
                className="w-full h-[58px] bg-[#0c0e12] border border-[#494454]/10 rounded-2xl px-5 text-[#e1e2e7] appearance-none focus:ring-2 focus:ring-[#cebdff]/20 focus:border-[#cebdff]/30 transition-all cursor-pointer outline-none"
                value={careerYears}
                onChange={(e) => setCareerYears(Number(e.target.value))}
              >
                <option value={0}>{t("session_setup.career_0_1")}</option>
                <option value={1}>{t("session_setup.career_1_3")}</option>
                <option value={3}>{t("session_setup.career_3plus")}</option>
              </select>

              <ChevronDown
                size={18}
                className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#cbc3d7] group-hover:text-[#cebdff] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[0.65rem] uppercase tracking-[0.2em] text-[#cbc3d7]/70 mb-3 font-semibold">
              {t("session_setup.total_questions")}
            </label>
            <div className="relative group">
              <select
                className="w-full bg-[#0c0e12] border border-[#494454]/10 rounded-2xl py-4 px-5 text-[#e1e2e7] appearance-none focus:ring-2 focus:ring-[#cebdff]/20 focus:border-[#cebdff]/30 transition-all cursor-pointer outline-none"
                value={totalQuestions}
                onChange={(e) => setTotalQuestions(Number(e.target.value))}
              >
                <option value={1}>{t("session_setup.questions_count", { count: 1 })}</option>
                <option value={5}>{t("session_setup.questions_count", { count: 5 })}</option>
                <option value={10}>{t("session_setup.questions_count", { count: 10 })}</option>
              </select>
              <ChevronDown
                size={18}
                className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#cbc3d7] group-hover:text-[#cebdff] transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-[0.65rem] uppercase tracking-[0.2em] text-[#cbc3d7]/70 font-semibold">
            {t("session_setup.answer_language")}
          </label>
          <div className="relative group">
            <select
              className="w-full h-[58px] bg-[#0c0e12] border border-[#494454]/10 rounded-2xl px-5 text-[#e1e2e7] appearance-none focus:ring-2 focus:ring-[#cebdff]/20 focus:border-[#cebdff]/30 transition-all cursor-pointer outline-none"
              value={answerLanguage}
              onChange={(e) => setAnswerLanguage(e.target.value as AnswerLanguage)}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {t(lang.labelKey)}
                </option>
              ))}
            </select>
            <ChevronDown
              size={18}
              className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#cbc3d7] group-hover:text-[#cebdff] transition-colors"
            />
          </div>
        </div>
      </form>
    </motion.div>
  );
};

export default InterviewSetupCard;
