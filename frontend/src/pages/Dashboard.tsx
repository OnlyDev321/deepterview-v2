import { motion } from "framer-motion";
import type { ReactNode } from "react";
import Header from "../components/Header";
import Sidebar from "../components/dashboard/Sidebar";
import Footer from "../components/Footer";

type DashboardLayoutProps = {
  children: ReactNode;
};

const Dashboard = ({ children }: DashboardLayoutProps) => {
  return (
    <motion.div
      className="min-h-screen bg-[#05070a] text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
    >
      <Header />
      <motion.main
        className="ml-64 flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.8 }}
      >
        {/* Sidebar (Left Navigation) */}
        <Sidebar />

        {/* Right Main Content Area */}
        <div className="mt-4 px-12 max-w-7xl w-full mx-auto flex-1">
          {children}
        </div>
        <Footer />
      </motion.main>
    </motion.div>
  );
};

export default Dashboard;
