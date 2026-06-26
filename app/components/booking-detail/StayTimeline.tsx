"use client";

import { animate } from "framer-motion";
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  checkIn: string;
  checkOut: string;
  nights: number;
  noon: boolean;
  delay?: number;
}

export default function StayTimeline({
  checkIn,
  checkOut,
  nights,
  noon,
  delay = 160,
}: Props) {
  const [displayedNights, setDisplayedNights] = useState(0);

  useEffect(() => {
    let controls: { stop: () => void } | null = null;
    const timer = setTimeout(() => {
      controls = animate(0, nights, {
        duration: 0.9,
        ease: "easeOut",
        onUpdate: (v) => setDisplayedNights(Math.round(v)),
      });
    }, delay + 400);

    return () => {
      clearTimeout(timer);
      controls?.stop();
    };
  }, [nights, delay]);

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
      className="bg-white rounded-xl border border-border/70 p-5 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/50">
        <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary shrink-0">
          <Calendar className="h-4 w-4" />
        </span>
        <h2 className="text-sm font-semibold text-foreground">Estadía</h2>
      </div>

      {/* Timeline visual */}
      <div className="flex items-center gap-2 mb-5 px-1">
        {/* Punto check-in */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 18,
            delay: delay / 1000 + 0.2,
          }}
          className="w-3 h-3 rounded-full bg-primary ring-4 ring-primary/20 shrink-0"
        />

        {/* Barra de progreso */}
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{
              duration: 0.9,
              delay: delay / 1000 + 0.35,
              ease: [0.22, 1, 0.36, 1],
            }}
            style={{ transformOrigin: "left center" }}
            className="h-full bg-gradient-to-r from-primary to-primary/40 rounded-full"
          />
        </div>

        {/* Punto check-out */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 18,
            delay: delay / 1000 + 0.6,
          }}
          className="w-3 h-3 rounded-full bg-primary/40 ring-4 ring-primary/10 shrink-0"
        />
      </div>

      {/* Datos de estadía */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">Check-in</p>
          <p className="text-sm font-semibold text-foreground">{checkIn}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">Check-out</p>
          <p className="text-sm font-semibold text-foreground">{checkOut}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">Noches</p>
          <p className="text-sm font-semibold text-primary">
            {displayedNights}{" "}
            {nights === 1 ? "noche" : "noches"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">Medio día</p>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              noon
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {noon ? "Sí" : "No"}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
