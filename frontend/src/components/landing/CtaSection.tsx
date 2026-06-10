import { useNavigate } from "react-router-dom";

const CtaSection = () => {
  const navigate = useNavigate();

  return (
    <section
      className="relative w-full max-w-[896px] px-6 pt-8"
      aria-labelledby="cta-heading"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-8 h-40 rounded-full bg-[rgba(206,189,255,0.05)] blur-[60px]"
        aria-hidden
      />

      <div className="relative overflow-hidden rounded-[48px] border border-[rgba(255,255,255,0.05)] bg-[rgba(12,14,18,0.6)] px-8 py-14 text-center backdrop-blur-[20px] sm:px-16 sm:py-16">
        <div
          className="pointer-events-none absolute -right-16 -top-16 size-32 rounded-full bg-[rgba(206,189,255,0.1)] blur-[20px]"
          aria-hidden
        />

        <h2
          id="cta-heading"
          className="text-3xl font-bold tracking-[-0.025em] text-[#e1e2e7] sm:text-4xl md:text-5xl md:leading-[48px] md:tracking-[-1.2px]"
        >
          면접을 마스터할 준비가 되셨나요?
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-base font-light leading-6 tracking-[0.4px] text-[#cbc3d7]">
          10,000명 이상의 전문가들과 함께 Deepterview를 사용하여 중요한 날을 준비하세요.
        </p>
        <button
          onClick={() => navigate("/signin")}
          type="button"
          className="mt-8 rounded-full bg-[rgba(206,189,255,0.8)] px-12 py-5 text-lg font-bold text-[#381385] transition hover:opacity-90 cursor-pointer"
        >
          무료 세션 시작하기
        </button>
      </div>
    </section>
  );
};

export default CtaSection;
