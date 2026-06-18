import { useState } from "react";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import Header from "../components/Header";
import Sidebar from "../components/dashboard/Sidebar";
import Footer from "../components/Footer";

type DashboardLayoutProps = {
  children: ReactNode;
};

const Dashboard = ({ children }: DashboardLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <motion.div
      className="min-h-screen bg-[#05070a] text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
    >
      <Header
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />
      
      {/* Sidebar Backdrop Overlay for Mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <motion.main
        className="lg:ml-64 ml-0 flex flex-col min-h-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.8 }}
      >
        {/* Sidebar (Left Navigation) */}
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {/* Right Main Content Area */}
        <div className="mt-4 px-4 sm:px-6 md:px-12 max-w-7xl w-full mx-auto flex-1">
          {children}
        </div>
        <Footer />
      </motion.main>
    </motion.div>
  );
};

export default Dashboard;
