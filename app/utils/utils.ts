// ── Number formatting ──────────────────────────────────────────────────────

/**
 * Formats a numeric string with dots as thousand separators.
 * Strips non-digit characters before formatting.
 * Examples: "1500000" → "1.500.000" | "250" → "250" | "" → ""
 */
export function formatCurrency(raw: string | null | undefined): string {
  if (!raw) return "";
  const digits = String(raw).replace(/\D/g, "");
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// ─────────────────────────────────────────────────────────────────────────────

export const toTitleCase = (str: string) => {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
  );
};
