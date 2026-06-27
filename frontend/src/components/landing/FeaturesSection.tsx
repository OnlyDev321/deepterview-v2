import iconEye from "../../assets/iconEye.svg";
import iconPeople from "../../assets/iconPeople.svg";
import iconLightning from "../../assets/iconLightning.svg";
import keyboardScene from "../../assets/keyboardScene.png";
import iconChart from "../../assets/iconChart.svg";
import personaAvatar1 from "../../assets/personaAvatar1.jpeg";
import personaAvatar2 from "../../assets/personaAvatar2.jpeg";

import { useTranslation } from "react-i18next";

const FeaturesSection = () => {
  const { t } = useTranslation();
  return (
    <section
      id="resources"
      className="flex w-full max-w-[1280px] flex-col gap-12 scroll-mt-24 px-6 pt-8"
      aria-labelledby="features-heading"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xl space-y-4">
          <h2
            id="features-heading"
            className="text-3xl font-bold tracking-[-0.025em] text-[#e1e2e7] sm:text-4xl"
          >
            <span className="block leading-10">{t("features.title_1")}</span>
            <span className="block leading-10 text-[#cebdff]">
              {t("features.title_2")}
            </span>
          </h2>
          <p className="text-base leading-[26px] text-[#cbc3d7]">
            {t("features.desc")}
          </p>
        </div>
        <div className="hidden h-px w-32 shrink-0 bg-[rgba(255,255,255,0.1)] lg:block" />
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 lg:grid-rows-[minmax(400px,auto)_auto]">
        <article className="flex min-h-[400px] flex-col justify-between rounded-[48px] border border-[rgba(255,255,255,0.05)] bg-[rgba(12,14,18,0.6)] p-10 backdrop-blur-[20px] lg:col-span-2">
          <div className="space-y-6">
            <div className="flex size-14 items-center justify-center rounded-full bg-[rgba(206,189,255,0.1)] shadow-[0_0_20px_0_rgba(206,189,255,0.1)]">
              <img src={iconEye} alt="" className="h-5 w-7 object-contain" />
            </div>
            <h3 className="text-xl font-bold tracking-[-0.025em] text-[#e1e2e7] sm:text-2xl">
              {t("features.card1_title")}
            </h3>
            <p className="max-w-[515px] text-base font-light leading-[26px] text-[#cbc3d7]">
              {t("features.card1_desc")}
            </p>
          </div>
          <div className="mt-8 flex gap-2 pt-2">
            <span className="size-2 rounded-full bg-[#cebdff]" />
            <span className="size-2 rounded-full bg-[rgba(255,255,255,0.1)]" />
            <span className="size-2 rounded-full bg-[rgba(255,255,255,0.1)]" />
          </div>
        </article>

        <article className="flex min-h-[400px] flex-col justify-between rounded-[48px] border border-[rgba(255,255,255,0.05)] bg-[rgba(12,14,18,0.6)] p-10 backdrop-blur-[20px] lg:col-span-2">
          <div className="space-y-6">
            <div className="flex size-14 items-center justify-center rounded-full bg-[rgba(123,208,255,0.1)] shadow-[0_0_20px_0_rgba(123,208,255,0.1)]">
              <img
                src={iconPeople}
                alt=""
                className="h-3.5 w-7 object-contain"
              />
            </div>
            <h3 className="text-xl font-bold tracking-[-0.025em] text-[#e1e2e7] sm:text-2xl">
              {t("features.card2_title")}
            </h3>
            <p className="max-w-[507px] text-base font-light leading-[26px] text-[#cbc3d7]">
              {t("features.card2_desc")}
            </p>
          </div>
          <div className="mt-8 overflow-hidden rounded-[32px] border border-[rgba(255,255,255,0.06)] bg-[#0c0e12]">
            <div className="relative aspect-[518/96] w-full overflow-hidden rounded-[32px]">
              <img
                src={keyboardScene}
                alt=""
                className="absolute inset-0 size-full object-cover object-center"
              />
              <div
                className="pointer-events-none absolute inset-0 rounded-[32px] bg-linear-to-t from-[#05070a]/90 via-transparent to-transparent"
                aria-hidden
              />
            </div>
          </div>
        </article>

        <article className="relative min-h-[220px] overflow-hidden rounded-[48px] border border-[rgba(255,255,255,0.05)] bg-[rgba(12,14,18,0.6)] p-8 backdrop-blur-[20px] lg:col-span-1">
          <img
            src={iconLightning}
            alt=""
            className="mb-4 h-6 w-4 object-contain"
          />
          <h3 className="text-lg font-bold text-[#e1e2e7]">
            {t("features.card3_title")}
          </h3>
          <p className="mt-2 max-w-[216px] text-xs leading-[19.5px] text-[#cbc3d7]">
            {t("features.card3_desc")}
          </p>
        </article>

        <article className="relative min-h-[220px] overflow-hidden rounded-[48px] border border-[rgba(255,255,255,0.05)] bg-[rgba(12,14,18,0.6)] p-8 backdrop-blur-[20px] lg:col-span-1">
          <img src={iconChart} alt="" className="mb-4 h-6 w-6 object-contain" />
          <h3 className="text-lg font-bold text-[#e1e2e7]">
            {t("features.card4_title")}
          </h3>
          <p className="mt-2 max-w-[204px] text-xs leading-[19.5px] text-[#cbc3d7]">
            {t("features.card4_desc")}
          </p>
        </article>

        <article className="flex min-h-[220px] items-center gap-6 rounded-[48px] border border-[rgba(255,255,255,0.05)] bg-[rgba(12,14,18,0.6)] p-8 backdrop-blur-[20px] lg:col-span-2">
          <div className="min-w-0 flex-1 space-y-2">
            <h3 className="text-lg font-bold text-[#e1e2e7]">
              {t("features.card5_title")}
            </h3>
            <p className="text-xs leading-[19.5px] text-[#cbc3d7]">
              {t("features.card5_desc")}
            </p>
          </div>
          <div className="flex shrink-0 items-center pr-4">
            <div className="-mr-4 flex size-12 items-center justify-center overflow-hidden rounded-full border-2 border-[#05070a] bg-[#323539] p-0.5">
              <img
                src={personaAvatar1}
                alt=""
                className="size-full object-cover"
              />
            </div>
            <div className="-mr-4 flex size-12 items-center justify-center overflow-hidden rounded-full border-2 border-[#05070a] bg-[#323539] p-0.5">
              <img
                src={personaAvatar2}
                alt=""
                className="size-full object-cover"
              />
            </div>
            <div className="flex size-12 items-center justify-center rounded-full border-2 border-[#05070a] bg-[#323539]">
              <span className="text-[10px] font-bold text-[#e1e2e7]">+12</span>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
};

export default FeaturesSection;
