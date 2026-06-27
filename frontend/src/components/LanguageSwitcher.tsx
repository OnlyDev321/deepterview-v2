import { useTranslation } from "react-i18next";
import { useState, useRef, useEffect } from "react";
import { Languages } from "lucide-react";

const LANGUAGES = [
  { code: "ko", label: "한국어" },
  { code: "en", label: "English" },
  { code: "vi", label: "Tiếng Việt" },
] as const;

type LangCode = (typeof LANGUAGES)[number]["code"];

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const current = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];

  const handleChange = (code: LangCode) => {
    i18n.changeLanguage(code);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1.5 p-2 rounded-xl hover:bg-white/10 transition cursor-pointer text-[#94A3B8] hover:text-white"
      >
        <Languages size={16} />
        <span className="text-xs font-medium">{current.label}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-32 rounded-xl bg-[rgba(15,23,42,0.95)] border border-white/10 shadow-lg backdrop-blur-md overflow-hidden z-50">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleChange(lang.code)}
              className={`w-full px-4 py-2.5 text-xs text-left transition cursor-pointer ${
                i18n.language === lang.code
                  ? "text-[#cebdff] bg-white/5"
                  : "text-white hover:bg-white/10"
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
