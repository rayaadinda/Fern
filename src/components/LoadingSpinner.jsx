import { motion } from "framer-motion";

export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center w-full h-full">
      <motion.div
        className="w-12 h-12 border-4 border-t-transparent border-gray-800 rounded-full"
        animate={{ rotate: 360 }}
        transition={{
          loop: Infinity,
          ease: "linear",
          duration: 1,
        }}
      />
    </div>
  );
} 