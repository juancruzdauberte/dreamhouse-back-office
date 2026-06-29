/**
 * Argentine phone number normalization for WhatsApp (wa.me).
 *
 * WhatsApp expects: 549 + area_code (no leading 0) + local_number (no 15 prefix)
 * Total: 13 digits  →  549 + 10 digits
 *
 * Handles:
 *   "0351 345-6789"        → 5493456789      (strip 0, build e164)
 *   "0351 15-345-6789"     → 549351345678 9  (strip 0, strip 15)
 *   "351 15-345-6789"      → 549351345678 9  (strip 15)
 *   "+54 9 351 345-6789"   → 549351345678 9  (already valid)
 *   "+54 11 1234-5678"     → 54111234567 8   (landline, no 9)
 *   "15-345-6789"          → invalid          (no area code)
 *   "1234"                 → invalid          (too short)
 */

export interface NormalizedPhone {
  /** E.164-like string for wa.me — digits only, e.g. "549351345678 9" */
  e164: string;
  /** Human-readable display string, e.g. "+54 9 351 345-6789" */
  display: string;
  /** Whether the number could be normalized to a valid Argentine number */
  valid: boolean;
}

// Area codes that are 2 digits long (Buenos Aires city area codes)
const TWO_DIGIT_AREA_CODES = new Set(["11"]);

/**
 * Returns the likely area code length (2, 3, or 4) given the digits string
 * (already stripped of country code and leading 0).
 * Heuristic: BA city = 2 digits; most provincial cities = 3 digits; small towns = 4 digits.
 * We try each length and pick the one that yields a valid local number length (6–8 digits).
 */
function detectAreaLength(digits: string): number | null {
  for (const areaLen of [2, 3, 4]) {
    const area = digits.slice(0, areaLen);
    const rest = digits.slice(areaLen);
    if (TWO_DIGIT_AREA_CODES.has(area) && areaLen !== 2) continue;
    const localLen = rest.length;
    if (localLen >= 6 && localLen <= 8) return areaLen;
  }
  return null;
}

/**
 * Build a human-readable display string from the e164 digits.
 * Examples:
 *   5493513456789  → "+54 9 351 345-6789"
 *   541112345678   → "+54 11 1234-5678"
 */
function buildDisplay(e164: string): string {
  if (e164.startsWith("549")) {
    const rest = e164.slice(3); // area + number, 10 digits
    if (rest.length === 10) {
      const isTwoDigit = TWO_DIGIT_AREA_CODES.has(rest.slice(0, 2));
      const areaLen = isTwoDigit ? 2 : 3;
      const area = rest.slice(0, areaLen);
      const num = rest.slice(areaLen);
      const half = Math.ceil(num.length / 2);
      return `+54 9 ${area} ${num.slice(0, half)}-${num.slice(half)}`;
    }
  }
  if (e164.startsWith("54")) {
    const rest = e164.slice(2);
    return `+54 ${rest}`;
  }
  return `+${e164}`;
}

export function normalizeArgPhone(raw: string): NormalizedPhone {
  const invalid = (e164: string): NormalizedPhone => ({
    e164,
    display: raw.trim(),
    valid: false,
  });

  if (!raw || !raw.trim()) return invalid("");

  // 1. Strip everything except digits and leading +
  let digits = raw.replace(/\D/g, "");
  if (!digits) return invalid("");

  // 2. Already has full country code
  if (digits.startsWith("549") && digits.length >= 12 && digits.length <= 13) {
    return { e164: digits, display: buildDisplay(digits), valid: true };
  }
  if (digits.startsWith("54") && !digits.startsWith("549") && digits.length >= 11 && digits.length <= 12) {
    // Landline — valid as-is
    return { e164: digits, display: buildDisplay(digits), valid: true };
  }

  // 3. Strip leading country code fragments that are wrong length
  if (digits.startsWith("549") || digits.startsWith("54")) {
    // Has country code but wrong length — try to salvage by stripping it
    digits = digits.startsWith("549") ? digits.slice(3) : digits.slice(2);
  }

  // 4. Strip leading 0 (Argentine local area code prefix)
  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  // 5. Strip 15 mobile prefix after area code
  // Pattern: area(2–4 digits) + "15" + local(6–8 digits)
  const mobileMatch = digits.match(/^(\d{2,4})15(\d{6,8})$/);
  if (mobileMatch) {
    digits = mobileMatch[1] + mobileMatch[2];
  }

  // 6. Validate: should now be area(2–4) + number(6–8) = 8–12 digits total
  if (digits.length < 8 || digits.length > 12) return invalid(digits);

  const areaLen = detectAreaLength(digits);
  if (!areaLen) return invalid(digits);

  const e164 = `549${digits}`;
  return { e164, display: buildDisplay(e164), valid: true };
}

export function toWhatsAppUrl(phone: string): string {
  const { e164, valid } = normalizeArgPhone(phone);
  if (!valid) {
    // Fallback: strip digits and hope for the best
    const fallback = phone.replace(/\D/g, "");
    return `https://wa.me/${fallback}`;
  }
  return `https://wa.me/${e164}`;
}
