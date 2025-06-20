import { SignUp } from "@clerk/clerk-react";
import { motion } from "framer-motion";

export default function SignUpPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="fixed inset-0 -z-10 w-full h-full">
        <div
          className="w-full h-full"
          style={{
            background: "radial-gradient(ellipse 80% 60% at 50% 20%, #38bdf8 0%, #93c5fd 40%, #f1f5f9 100%)",
            opacity: 1,
            filter: "blur(40px)",
          }}
        />
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <SignUp />
      </motion.div>
    </div>
  );
} 