"use client";

import { animate, motion } from "framer-motion";
import { CreditCard } from "lucide-react";
import { useEffect, useState } from "react";

/* ── AnimatedAmount ──────────────────────────────────────────────── */

function AnimatedAmount({
  value,
  currency,
  startDelay,
}: {
  value: number;
  currency: string;
  startDelay: number;
}) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    let controls: { stop: () => void } | null = null;
    const timer = setTimeout(() => {
      controls = animate(0, value, {
        duration: 1.1,
        ease: "easeOut",
        onUpdate: (v) => setDisplayed(Math.round(v)),
      });
    }, startDelay);

    return () => {
      clearTimeout(timer);
      controls?.stop();
    };
  }, [value, startDelay]);

  return (
    <span>
      ${displayed.toLocaleString("es-AR")} {currency}
    </span>
  );
}

/* ── PaymentProgressCard ─────────────────────────────────────────── */

interface Props {
  depositAmt: number;
  balanceAmt: number;
  totalAmt: number;
  currency: string;
  delay?: number;
}

export default function PaymentProgressCard({
  depositAmt,
  balanceAmt,
  totalAmt,
  currency,
  delay = 320,
}: Props) {
  const depositPct =
    totalAmt > 0 ? Math.min(Math.round((depositAmt / totalAmt) * 100), 100) : 0;

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
          <CreditCard className="h-4 w-4" />
        </span>
        <h2 className="text-sm font-semibold text-foreground">Pagos</h2>
      </div>

      {/* Barra de progreso de anticipo */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>Anticipo pagado</span>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay / 1000 + 0.65 }}
            className="font-semibold text-foreground"
          >
            {depositPct}%
          </motion.span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: `${depositPct}%` }}
            transition={{
              duration: 1.2,
              delay: delay / 1000 + 0.25,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="h-full bg-primary rounded-full"
          />
        </div>
      </div>

      {/* Cards de montos con count-up */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: delay / 1000 + 0.35 }}
          className="rounded-lg bg-primary/5 border border-primary/10 p-4"
        >
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Anticipo
          </p>
          <p className="text-lg font-bold text-foreground">
            <AnimatedAmount
              value={depositAmt}
              currency={currency}
              startDelay={delay + 350}
            />
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: delay / 1000 + 0.45 }}
          className="rounded-lg bg-emerald-50 border border-emerald-100 p-4"
        >
          <p className="text-xs font-medium text-emerald-600 mb-1">Saldo</p>
          <p className="text-lg font-bold text-emerald-700">
            <AnimatedAmount
              value={balanceAmt}
              currency={currency}
              startDelay={delay + 450}
            />
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
