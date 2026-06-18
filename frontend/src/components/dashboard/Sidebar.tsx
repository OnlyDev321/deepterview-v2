import { Home, BrainCircuit, History, User } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";

const Sidebar = () => {
  const navItems = [
    { icon: Home, label: "홈", link: "/dashboard" },
    {
      icon: BrainCircuit,
      label: "연습",
      link: "/dashboard/practice",
    },
    {
      icon: History,
      label: "기록",
      link: "/dashboard/history",
    },
    { icon: User, label: "내 정보", link: "/dashboard/myinfo" },
  ];
  const navigate = useNavigate();
  const location = useLocation();

  function handleClickSidebarNav(link: string) {
    if (link === "/dashboard/practice") {
      const activeId = sessionStorage.getItem("activeSessionId");
      navigate(link, {
        state: { sessionId: activeId ? Number(activeId) : undefined },
      });
    } else {
      navigate(link);
    }
  }

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 z-40 flex flex-col py-8 px-4 bg-gradient-to-r from-[#191c1f] to-transparent border-r border-[#494454]/10">
      <div className="mb-6 px-2">
        <h1 className="text-xl font-black text-[#cebdff] tracking-tighter">
          Deepterview
        </h1>
        <p className="font-sans text-sm text-[#cbc3d7]/40 mt-6">
          프리미엄 AI 코치
        </p>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isNavActive = location.pathname === item.link;
          const isInPracticeRoom = location.pathname === "/dashboard/practice";
          const hasActiveSession = !!sessionStorage.getItem("activeSessionId");
          const isNavDisabled = isInPracticeRoom
            ? item.link !== "/dashboard/practice"
            : item.link === "/dashboard/practice" && !hasActiveSession;

          return (
            <motion.button
              key={item.label}
              onClick={() => {
                if (isNavDisabled) return;
                handleClickSidebarNav(item.link);
              }}
              whileHover={isNavDisabled ? {} : { x: 4 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group w-full ${
                isNavDisabled
                  ? "opacity-30 cursor-not-allowed text-[#cbc3d7]/30"
                  : isNavActive
                  ? "text-[#cebdff] bg-[#cebdff]/10 border-r-2 border-[#cebdff] cursor-pointer"
                  : "text-[#cbc3d7]/70 hover:bg-[#323539]/30 cursor-pointer"
              }`}
            >
              <item.icon
                size={20}
                className={
                  isNavActive
                    ? "text-[#cebdff]"
                    : isNavDisabled
                    ? "text-[#cbc3d7]/30"
                    : "group-hover:text-[#cebdff] transition-colors"
                }
              />
              <span className="font-sans tracking-widest text-sm font-bold">
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
