"use client";
import React, { useState } from "react";
import { toast } from "react-toastify";

type ReusableFormProps = {
  action: (
    formData: FormData,
  ) => void | Promise<void | { success: boolean; message: string }>;
  children: React.ReactNode;
  title?: string;
  submitText?: string;
  className?: string;
  gridCols?: 1 | 2 | 3 | 4 | 5;
  centered?: boolean;
  submitinText?: string;
  compact?: boolean;
  onSuccess?: () => void;
};

export function ReusableForm({
  action,
  children,
  title,
  submitText = "Enviar",
  submitinText,
  className = "",
  gridCols = 2,
  centered = false,
  compact = false,
  onSuccess,
}: ReusableFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    ? "flex items-center justify-center p-2"
    : "p-4";

  const formPadding = compact ? "p-4" : "p-8";

  const maxWidthClass = gridCols >= 3 ? "max-w-6xl" : "max-w-4xl";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Store form reference before async operation
    const form = e.currentTarget;

    try {
      const formData = new FormData(form);
      const result = await action(formData);

      if (result && typeof result === "object" && "success" in result) {
        if (result.success) {
          toast.success(result.message);
          form.reset(); // Use stored reference instead of e.currentTarget
          onSuccess?.(); // Call onSuccess callback if provided
        } else {
          toast.error(result.message);
        }
      }
    } catch (error) {
      toast.error("Error al procesar el formulario");
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={containerClass}>
      <form
        onSubmit={handleSubmit}
        className={`w-full ${maxWidthClass} rounded-2xl border border-border bg-card backdrop-blur-sm transition-shadow duration-300 ${formPadding} ${className}`}
      >
        {title && (
          <h2 className="mb-8 text-center text-2xl font-bold tracking-tight text-foreground border-b border-border pb-6">
            {title}
          </h2>
        )}

        <div className={`grid gap-4 ${gridClass}`}>{children}</div>

        <div className="mt-6 flex justify-center gap-4 border-t border-border pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`group relative overflow-hidden rounded-lg px-8 py-2.5 font-medium text-primary-foreground transition-all duration-300 focus:outline-none cursor-pointer focus:ring-4 focus:ring-ring/20 active:scale-[0.98] ${
              isSubmitting
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary hover:bg-primary/90 hover:-translate-y-0.5"
            }`}
          >
            <span className="relative z-10 flex items-center gap-2">
              {isSubmitting && (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              )}
              {isSubmitting ? submitinText : submitText}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
