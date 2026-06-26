"use client";
import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";

type ReusableFormProps = {
  action: (
    formData: FormData,
  ) => void | Promise<void | { success: boolean; message: string }>;
  children: React.ReactNode;
  title?: string;
  submitText?: string;
  submitinText?: string;
  className?: string;
  gridCols?: 1 | 2 | 3 | 4 | 5;
  centered?: boolean;
  compact?: boolean;
  sections?: boolean;
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
  sections = false,
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const form = e.currentTarget;

    try {
      const formData = new FormData(form);
      const result = await action(formData);

      if (result && typeof result === "object" && "success" in result) {
        if (result.success) {
          toast.success(result.message);
          form.reset();
          onSuccess?.();
        } else {
          toast.error(result.message);
        }
      }
    } catch {
      toast.error("Error al procesar el formulario");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={centered ? "flex items-start justify-center p-4 md:p-6" : "p-4"}>
      <form
        onSubmit={handleSubmit}
        className={`w-full max-w-5xl animate-in fade-in-0 slide-in-from-bottom-4 duration-500 ${className}`}
      >
        {title && (
          <div className="mb-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {title}
            </h2>
            <div className="mt-1 h-0.5 w-12 rounded-full bg-primary" />
          </div>
        )}

        {sections ? (
          <div className="flex flex-col gap-4">{children}</div>
        ) : (
          <div
            className={`rounded-xl border border-border bg-white p-6 shadow-sm grid gap-4 ${gridClass} ${compact ? "p-4" : ""}`}
          >
            {children}
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`inline-flex items-center gap-2 rounded-xl px-8 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 active:scale-[0.97] ${
              isSubmitting
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-md"
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                {submitinText ?? "Procesando..."}
              </>
            ) : (
              submitText
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
