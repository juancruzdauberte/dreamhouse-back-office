"use client";
import React, { useEffect, useState } from "react";

export type PriceInputProps = {
  name: string;
  label: string;
  currency: "ARS" | "USD";
  defaultValue?: string | number | null;
  required?: boolean;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
};

const inputBase =
  "w-full h-10 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground transition-all duration-200 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 hover:border-border/80";

const labelBase = "block text-xs font-medium text-muted-foreground mb-1.5";

function formatWithDots(digits: string): string {
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Normalizes a DB/defaultValue (may include decimals like "220000.00") to a digit-only string. */
function normalizeDefault(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  const num = parseFloat(String(value));
  if (isNaN(num)) return "";
  return String(Math.round(num));
}

/** Strips all non-digit characters from a user-typed display value (e.g. "1.234" → "1234"). */
function stripNonDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function PriceInput({
  name,
  label,
  currency: _currency,
  defaultValue,
  required,
  placeholder,
  className,
  readOnly,
}: PriceInputProps) {
  const [rawValue, setRawValue] = useState<string>("");
  const [displayValue, setDisplayValue] = useState<string>("");

  useEffect(() => {
    const digits = normalizeDefault(defaultValue);
    setRawValue(digits);
    setDisplayValue(formatWithDots(digits));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = stripNonDigits(e.target.value);
    setRawValue(digits);
    setDisplayValue(formatWithDots(digits));
  }

  return (
    <div className={`flex flex-col ${className ?? ""}`}>
      <label htmlFor={`display-${name}`} className={labelBase}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      <input
        id={`display-${name}`}
        type="text"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        readOnly={readOnly}
        disabled={readOnly}
        inputMode="numeric"
        autoComplete="off"
        className={`${inputBase} ${readOnly ? "opacity-60 cursor-not-allowed" : ""}`}
      />
      <input
        type="hidden"
        name={name}
        value={rawValue}
        required={required}
      />
    </div>
  );
}
