const Leftside = () => {
  return (
    <section className="w-full md:w-1/2 min-h-[600px] md:min-h-screen bg-surface-container-lowest relative flex items-center justify-center p-8 md:p-16 lg:p-24 overflow-hidden border-r border-white/5">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[120px]" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] rounded-full bg-secondary/5 blur-[100px]" />

      <div className="relative z-10 max-w-xl">
        <span className="text-primary text-[0.75rem] uppercase tracking-[0.2em] font-bold mb-6 block">
          혁신적인 면접 준비
        </span>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-8 leading-[1.05] text-on-background">
          Master Your <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-container to-secondary">
            Interviews with
          </span>{" "}
          <br />
          Deepterview AI
        </h1>

        <p className="text-lg md:text-xl text-on-surface-variant/80 mb-12 leading-relaxed font-light">
          시네마틱한 리얼리즘과 생성형 지능의 힘을 활용하여 전달력, 말투,
          자신감을 다듬어주는 실시간 피드백을 받으세요.
        </p>

        {/* Testimonial Block */}
        <div className="bg-surface-container-low p-8 rounded-3xl border border-white/5 relative group">
          <div className="absolute -top-4 -left-2 text-6xl text-primary/10 font-serif group-hover:text-primary/20 transition-colors">
            “
          </div>
          <p className="text-on-background italic text-lg mb-6 leading-relaxed relative z-10">
            AI 피드백이 놀라울 정도로 정확했습니다. 제가 깨닫지 못한 말투의
            뉘앙스까지 잡아내더군요. 이 세션들 덕분에 기업에서 꿈꾸던
            역할을 얻게 되었습니다.
          </p>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-container-highest ring-2 ring-primary/20">
              <img
                src="https://picsum.photos/seed/executive/100/100"
                alt="Marcus Chen"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <p className="font-bold text-on-background">Marcus Chen</p>
              <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                시니어 제품 리드
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Leftside;
