"use client";
import React from "react";

interface BookingFormSectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  cols?: 1 | 2 | 3;
  animationDelay?: number;
}

const colsClass: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
};

export function BookingFormSection({
  icon,
  title,
  children,
  cols = 3,
  animationDelay = 0,
}: BookingFormSectionProps) {
  return (
    <div
      className="rounded-xl border border-border/70 bg-white p-5 shadow-sm animate-in fade-in-0 slide-in-from-bottom-2 duration-300 [animation-fill-mode:both]"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {/* Section header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/50">
        <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary shrink-0">
          {icon}
        </span>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>

      {/* Fields grid */}
      <div className={`grid gap-4 ${colsClass[cols]}`}>{children}</div>
    </div>
  );
}
