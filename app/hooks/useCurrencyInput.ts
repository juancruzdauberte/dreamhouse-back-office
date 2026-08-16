"use client";
import { useState } from "react";
import { formatCurrency } from "../utils/utils";

export type CurrencyInputResult = {
  displayValue: string;
  rawValue: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export function useCurrencyInput(
  initial: string | null | undefined,
): CurrencyInputResult {
  const [displayValue, setDisplayValue] = useState<string>(() =>
    formatCurrency(initial),
  );

  const rawValue = displayValue.replace(/\./g, "");

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "");
    setDisplayValue(formatCurrency(digits));
  };

  return { displayValue, rawValue, onChange };
}
