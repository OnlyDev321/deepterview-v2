import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <section
      className="relative flex w-full max-w-[1024px] flex-col items-center gap-8 px-6 text-center"
      aria-labelledby="hero-heading"
    >
      <div
        className="pointer-events-none absolute left-1/2 top-[-40%] h-[min(1000px,80vw)] w-[min(1000px,95vw)] -translate-x-1/2 rounded-full bg-[rgba(206,189,255,0.1)] blur-[60px]"
        aria-hidden
      />

      <div className="rounded-full border border-[rgba(206,189,255,0.1)] bg-[#191c1f] px-[17px] py-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-[2px] text-[#cebdff]">
          {t("landing.badge")}
        </p>
      </div>

      <div id="hero-heading" className="flex flex-col items-center gap-0">
        <h1 className="text-4xl font-bold leading-tight tracking-[-0.025em] text-[#e1e2e7] text-shadow-[0_0_20px_rgba(206,189,255,0.3)] sm:text-5xl md:text-6xl lg:text-[72px] lg:leading-[72px] lg:tracking-[-1.8px]">
          <span className="block">{t("landing.hero_title_1")}</span>
          <span className="block">{t("landing.hero_title_2")}</span>
          <span className="block bg-linear-to-r from-[#cebdff] via-[#cebdff] to-[#7bd0ff] bg-clip-text text-transparent">
            {t("landing.hero_title_3")}
          </span>
        </h1>
      </div>

      <p className="max-w-[672px] text-lg font-light leading-7 tracking-[0.5px] text-[#cbc3d7] sm:text-xl">
        {t("landing.hero_desc")}
      </p>

      <div className="flex w-full flex-col items-center justify-center gap-4 pt-4 sm:flex-row sm:gap-6">
        <button
          type="button"
          className="w-full rounded-full bg-[#cebdff] px-10 py-5 text-base font-bold text-[#381385] transition hover:opacity-90 sm:w-auto cursor-pointer"
          onClick={() => navigate("/signin")}
        >
          {t("landing.cta_primary")}
        </button>
        <button
          type="button"
          className="w-full rounded-full border border-[rgba(255,255,255,0.05)] bg-[#191c1f] px-10 py-5 text-base font-medium text-[#e1e2e7] transition hover:bg-[#cebdff]/10 sm:w-auto cursor-pointer"
        >
          {t("landing.cta_secondary")}
        </button>
      </div>
    </section>
  );
};

export default HeroSection;
