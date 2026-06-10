import { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import HeroSection from "../components/landing/HeroSection";
import MockUiSection from "../components/landing/MockUiSection";
import FeaturesSection from "../components/landing/FeaturesSection";
import CtaSection from "../components/landing/CtaSection";
import type { NavKey } from "../types/index";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const LandingLayout = () => {
  const [activeNav, setActiveNav] = useState<NavKey>("overview");
  const navigate = useNavigate();
  const handleSelectNav = (key: NavKey) => {
    setActiveNav(key);
    document.getElementById(key)?.scrollIntoView({
      behavior: "smooth",
    });
    window.history.pushState(null, "", `#${key}`);
    navigate(`#${key}`);
  };

  useEffect(() => {
    const sections: NavKey[] = ["overview", "resources"];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const key = entry.target.id as NavKey;

            // update state
            setActiveNav(key);

            // update URL (không reload)
            navigate(`#${key}`);
          }
        });
      },
      {
        root: null,
        rootMargin: "-30% 0px -60% 0px", // 👈 tinh chỉnh vùng trigger
        threshold: 0,
      },
    );

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      sections.forEach((id) => {
        const el = document.getElementById(id);
        if (el) observer.unobserve(el);
      });
    };
  }, []);

  return (
    <motion.div
      className="min-h-screen bg-[#05070a] text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <Header activeNav={activeNav} onNavigateSection={handleSelectNav} />
      <main className="relative mx-auto flex w-full max-w-[1408px] flex-col items-center gap-16 overflow-x-hidden pb-24 pt-16 sm:gap-20 sm:pt-20 md:gap-24 md:pb-32">
        <div
          className="pointer-events-none absolute right-0 top-[18%] h-96 w-96 rounded-full bg-[rgba(123,208,255,0.05)] blur-[50px]"
          aria-hidden
        />
        <motion.section
          id="overview"
          className="flex w-full flex-col items-center gap-16 scroll-mt-24 sm:gap-20"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <HeroSection />
          <MockUiSection />
        </motion.section>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <FeaturesSection />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <CtaSection />
        </motion.div>
      </main>
      <Footer />
    </motion.div>
  );
};

export default LandingLayout;
