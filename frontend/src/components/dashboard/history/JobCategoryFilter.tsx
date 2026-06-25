import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, ChevronRight } from "lucide-react";
import type { JobCategory } from "../../../types";

interface Props {
  categories: JobCategory[];
  selectedId: number | null;
  onChange: (categoryId: number | null) => void;
}

const JobCategoryFilter = ({ categories, selectedId, onChange }: Props) => {
  const [open, setOpen] = useState(false);
  const [expandedParent, setExpandedParent] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setExpandedParent(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectedName =
    selectedId == null ? "모든 직무" : findCategoryName(categories, selectedId);

  const handleSelect = (id: number | null) => {
    onChange(id);
    setOpen(false);
    setExpandedParent(null);
  };

  const handleParentClick = (parentId: number) => {
    setExpandedParent(expandedParent === parentId ? null : parentId);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 px-5 py-3 bg-[#191c1f] border border-[#494454]/20 text-[#cbc3d7] rounded-2xl text-xs font-bold hover:border-[#cebdff]/30 transition-all cursor-pointer whitespace-nowrap"
      >
        <Filter size={14} /> {selectedName}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute left-0 top-full mt-2 z-50 w-56 max-h-80 overflow-y-auto rounded-2xl border border-[#494454]/30 bg-[#191c1f] shadow-xl shadow-black/40"
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            {/* Reset option */}
            <button
              onClick={() => handleSelect(null)}
              className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-[#24272b] cursor-pointer ${
                selectedId == null
                  ? "text-[#cebdff] font-bold"
                  : "text-[#cbc3d7]"
              }`}
            >
              모든 직무
            </button>

            <div className="h-px bg-[#494454]/20" />

            {categories.map((parent) => (
              <div key={parent.id}>
                <button
                  onClick={() => handleParentClick(parent.id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm text-[#cbc3d7] hover:bg-[#24272b] transition-colors cursor-pointer"
                >
                  <span>{parent.name}</span>
                  <ChevronRight
                    size={14}
                    className={`transition-transform ${
                      expandedParent === parent.id ? "rotate-90" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {expandedParent === parent.id &&
                    parent.children.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-[#13161a] py-1">
                          {parent.children.map((child: JobCategory) => (
                            <button
                              key={child.id}
                              onClick={() => handleSelect(child.id)}
                              className={`w-full text-left pl-8 pr-4 py-2 text-sm transition-colors hover:bg-[#24272b] cursor-pointer ${
                                selectedId === child.id
                                  ? "text-[#cebdff] font-bold"
                                  : "text-[#a09baa]"
                              }`}
                            >
                              {child.name}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                </AnimatePresence>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function findCategoryName(categories: JobCategory[], id: number): string {
  for (const cat of categories) {
    if (cat.id === id) return cat.name;
    for (const child of cat.children) {
      if (child.id === id) return child.name;
    }
  }
  return "모든 직무";
}

export default JobCategoryFilter;
