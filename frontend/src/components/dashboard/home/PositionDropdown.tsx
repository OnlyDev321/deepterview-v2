import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { JobCategory, SessionType } from "../../../types";

type PositionDropdownProps = {
  categories: JobCategory[];
  value: string;
  onSelect: (name: string, id: number, sessionType: SessionType) => void;
};

const isTouchDevice =
  typeof window !== "undefined" &&
  "matchMedia" in window &&
  window.matchMedia("(pointer: coarse)").matches;

const PositionDropdown = ({ categories, value, onSelect }: PositionDropdownProps) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [activeDept, setActiveDept] = useState<JobCategory | null>(null);
  const deptTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveDept(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDeptMouseEnter = (dept: JobCategory) => {
    if (isTouchDevice) return;
    if (deptTimer.current) clearTimeout(deptTimer.current);
    setActiveDept(dept);
  };

  const handleDeptMouseLeave = () => {
    if (isTouchDevice) return;
    deptTimer.current = setTimeout(() => setActiveDept(null), 200);
  };

  const handleSubMouseEnter = () => {
    if (isTouchDevice) return;
    if (deptTimer.current) clearTimeout(deptTimer.current);
  };

  const handleSubMouseLeave = () => {
    if (isTouchDevice) return;
    setActiveDept(null);
  };

  const handleDeptClick = (dept: JobCategory) => {
    if (dept.children.length === 0) return;
    if (isTouchDevice) {
      setActiveDept(dept);
    } else {
      setActiveDept((prev) => (prev?.id === dept.id ? null : dept));
    }
  };

  const handleSelect = (child: JobCategory) => {
    const department = categories.find((d) =>
      d.children.some((c) => c.id === child.id),
    );
    const sessionType = (department?.type ?? "TECHNICAL") as SessionType;
    onSelect(child.name, child.id, sessionType);
    setIsOpen(false);
    setActiveDept(null);
  };

  const handleBack = () => {
    setActiveDept(null);
  };

  const handleTriggerClick = () => {
    setIsOpen((prev) => {
      if (prev) setActiveDept(null);
      return !prev;
    });
  };

  const showMobileSubMenu = isTouchDevice && isOpen && activeDept;

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className="w-full h-[58px] bg-[#0c0e12] border border-[#494454]/10 rounded-2xl px-5 flex items-center justify-between cursor-pointer hover:border-[#cebdff]/30 transition-all select-none"
        onClick={handleTriggerClick}
      >
        <span className={value ? "text-[#e1e2e7]" : "text-[#cbc3d7]/50"}>
          {value || t("position.select_placeholder")}
        </span>
        <ChevronDown
          size={18}
          className={`text-[#cbc3d7] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 left-0 bg-[#191c1f] border border-[#494454]/20 rounded-2xl overflow-hidden shadow-2xl"
          >
            {showMobileSubMenu ? (
              <div className="min-w-[240px]">
                <div
                  onClick={handleBack}
                  className="flex items-center gap-2 px-4 py-3 border-b border-[#494454]/20 text-[#cebdff] text-sm cursor-pointer hover:bg-[#cebdff]/10 transition-colors"
                >
                  <ChevronLeft size={16} />
                  {activeDept.name}
                </div>
                <div className="py-2">
                  {activeDept.children.map((child) => (
                    <div
                      key={child.id}
                      onClick={() => handleSelect(child)}
                      className="px-4 py-3 cursor-pointer hover:bg-[#cebdff]/10 transition-colors text-[#e1e2e7] text-sm"
                    >
                      {child.name}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex">
                <div className="w-[200px] py-2">
                  {categories.map((dept) => (
                    <div
                      key={dept.id}
                      onMouseEnter={() => handleDeptMouseEnter(dept)}
                      onMouseLeave={handleDeptMouseLeave}
                      onClick={() => handleDeptClick(dept)}
                      className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors text-sm ${
                        activeDept?.id === dept.id
                          ? "bg-[#cebdff]/10 text-[#cebdff]"
                          : "text-[#e1e2e7] hover:bg-[#cebdff]/10"
                      }`}
                    >
                      <span>{dept.name}</span>
                      {dept.children.length > 0 && (
                        <ChevronRight size={14} className="text-[#cbc3d7] shrink-0" />
                      )}
                    </div>
                  ))}
                </div>

                <AnimatePresence>
                  {activeDept && activeDept.children.length > 0 && (
                    <motion.div
                      key={activeDept.id}
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 200 }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15 }}
                      className="border-l border-[#494454]/20 bg-[#0c0e12] overflow-hidden"
                      onMouseEnter={handleSubMouseEnter}
                      onMouseLeave={handleSubMouseLeave}
                    >
                      <div className="w-[200px] py-2">
                        {activeDept.children.map((child) => (
                          <div
                            key={child.id}
                            onClick={() => handleSelect(child)}
                            className="px-4 py-3 cursor-pointer hover:bg-[#cebdff]/10 transition-colors text-[#e1e2e7] text-sm"
                          >
                            {child.name}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PositionDropdown;
