"use client";
import React from "react";

type ReusableFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  children: React.ReactNode;
  title?: string;
  submitText?: string;
  className?: string;
  gridCols?: 1 | 2 | 3 | 4 | 5;
  centered?: boolean;
  compact?: boolean;
};

export function ReusableForm({
  action,
  children,
  title,
  submitText = "Enviar",
  className = "",
  gridCols = 2,
  centered = false,
  compact = false,
}: ReusableFormProps) {
  const gridClass =
    gridCols === 1
      ? "grid-cols-1"
      : gridCols === 2
      ? "grid-cols-1 md:grid-cols-2"
      : gridCols === 3
      ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      : gridCols === 4
      ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
      : "grid-cols-1 md:grid-cols-2 lg:grid-cols-5";

  const containerClass = centered
    ? "flex items-center justify-center  p-4"
    : "p-4";

  const formPadding = compact ? "p-6" : "p-8";

  return (
    <div className={containerClass}>
      <form
        action={action}
        onSubmit={(e) => {
          e.preventDefault();
        }}
        className={`w-full max-w-7xl rounded-xl border border-gray-200 bg-white shadow-xl ${formPadding} ${className}`}
      >
        {title && (
          <h2 className="mb-6 text-center text-2xl font-bold text-indigo-800 border-b border-gray-200 pb-4">
            {title}
          </h2>
        )}

        <div className={`grid gap-4 ${gridClass}`}>{children}</div>

        <div className="mt-6 flex justify-center border-t border-gray-200 pt-6">
          <button
            type="submit"
            className="group relative overflow-hidden rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 px-8 py-2.5 font-semibold text-white shadow-md transition-all duration-300 hover:from-indigo-700 hover:to-indigo-800 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-4 focus:ring-indigo-300"
          >
            <span className="relative z-10">{submitText}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
