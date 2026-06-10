const Footer = () => {
  return (
    <footer className="w-full bg-[#05070a] px-6 py-16 sm:px-10 lg:px-20">
      <div className="mx-auto max-w-[1280px] border-t border-[rgba(30,41,59,0.3)] pt-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="pb-4 text-xl font-black tracking-tight text-[#cebdff]">
              Deepterview
            </p>
            <p className="text-xs uppercase tracking-[1.2px] text-[#64748b]">
              © 2026 Deepterview. 한밤의 관찰자 에디션.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-10 gap-y-2" aria-label="Footer">
            {(
              [
                { label: "개인정보 처리방침", key: "privacy" },
                { label: "이용약관", key: "terms" },
                { label: "고객지원", key: "support" },
                { label: "문의하기", key: "contact" },
              ] as const
            ).map(({ label, key }) => (
              <a
                key={key}
                href={`#${key}`}
                className="text-xs uppercase tracking-[1.2px] text-[#475569] transition hover:text-[#94a3b8]"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
