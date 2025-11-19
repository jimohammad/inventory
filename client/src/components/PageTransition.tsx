import { motion } from "framer-motion";
import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

/**
 * PageTransition - Animated page transitions with teal glow effect
 * Features: fade/slide animation, teal glow on page load
 */
export function PageTransition({ children }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: 0.3,
        ease: "easeInOut",
      }}
      className="relative"
    >
      {/* Teal glow effect on page load */}
      <motion.div
        initial={{ opacity: 0.6 }}
        animate={{ opacity: 0 }}
        transition={{
          duration: 0.8,
          ease: "easeOut",
        }}
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at center, rgba(52, 211, 153, 0.15) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      {children}
    </motion.div>
  );
}
