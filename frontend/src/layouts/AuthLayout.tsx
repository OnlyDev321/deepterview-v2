import Footer from "../components/Footer";
import Header from "../components/Header";
import Leftside from "../components/auth/Leftside";
import Rightside from "../components/auth/Rightside";
import { motion } from "framer-motion";

const AuthLayout = () => {
  return (
    <motion.div
      className="bg-[#05070a] text-white min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Header />
      <motion.main
        className="flex-1 flex flex-col md:flex-row"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {/* Left Side: Editorial Content */}
        <Leftside />
        {/* Right Side: Sign-in Form */}
        <Rightside />
      </motion.main>
      <Footer />
    </motion.div>
  );
};

export default AuthLayout;
