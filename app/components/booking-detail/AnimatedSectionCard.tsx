"use client";

import { motion } from "framer-motion";

interface Props {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export default function AnimatedSectionCard({
  icon,
  title,
  children,
  delay = 0,
  className = "",
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        delay: delay / 1000,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{
        y: -2,
        boxShadow: "0 8px 24px -6px rgba(0,0,0,0.10)",
        transition: { duration: 0.2 },
      }}
      className={`bg-white rounded-xl border border-border/70 p-5 shadow-sm ${className}`}
    >
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/50">
        <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary shrink-0">
          {icon}
        </span>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      {children}
    </motion.div>
  );
}
