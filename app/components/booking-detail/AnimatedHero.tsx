"use client";

import { motion } from "framer-motion";

const STATUS_CFG: Record<string, { classes: string; pulse: string }> = {
  Confirmada: {
    classes: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    pulse: "bg-emerald-400",
  },
  Pendiente: {
    classes: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    pulse: "bg-amber-400",
  },
  Cancelada: {
    classes: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
    pulse: "",
  },
  Realizada: {
    classes: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
    pulse: "",
  },
};

interface Props {
  id: number;
  guestName: string;
  bookingDateFormatted: string;
  status: string;
}

export default function AnimatedHero({
  id,
  guestName,
  bookingDateFormatted,
  status,
}: Props) {
  const cfg = STATUS_CFG[status] ?? {
    classes: "bg-gray-50 text-gray-600 ring-1 ring-gray-200",
    pulse: "",
  };
  const initial = guestName.charAt(0).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white rounded-xl border border-border/70 shadow-sm p-5 mb-5 flex items-center gap-4"
    >
      {/* Avatar con spring pop */}
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 280,
          damping: 18,
          delay: 0.1,
        }}
        className="relative w-12 h-12 shrink-0"
      >
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-xl font-bold text-primary select-none">
            {initial}
          </span>
        </div>

        {/* Pulse ring para estados activos */}
        {cfg.pulse && (
          <motion.span
            className={`absolute inset-0 rounded-full ${cfg.pulse}`}
            animate={{
              scale: [1, 1.55, 1.55, 1],
              opacity: [0.35, 0, 0, 0.35],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        )}
      </motion.div>

      {/* Info con stagger */}
      <div className="min-w-0 flex-1">
        <motion.p
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.18 }}
          className="text-xs font-medium text-muted-foreground"
        >
          Reserva #{id}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.24 }}
          className="text-xl font-bold text-foreground truncate"
        >
          {guestName}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.3 }}
          className="text-xs text-muted-foreground mt-0.5"
        >
          Registrada el {bookingDateFormatted}
        </motion.p>
      </div>

      {/* Status badge con spring pop */}
      <motion.span
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 350,
          damping: 22,
          delay: 0.36,
        }}
        className={`shrink-0 relative text-xs font-semibold px-3 py-1 rounded-full ${cfg.classes}`}
      >
        {/* Punto pulsante en el badge */}
        {cfg.pulse && (
          <span
            className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${cfg.pulse} ring-2 ring-white`}
          />
        )}
        {status}
      </motion.span>
    </motion.div>
  );
}
