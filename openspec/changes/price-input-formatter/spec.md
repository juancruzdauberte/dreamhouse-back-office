# Spec: Price Input Formatter

## Functional Requirements

### FR-01 — Format on input
While the user types digits in any price field, the visible input must display the value with `.` as thousands separator and no decimals.

- Input sequence: `1` → `1`, `12` → `12`, `123` → `123`, `1234` → `1.234`, `12345` → `12.345`, `1234567` → `1.234.567`
- Rule applies to both ARS and USD fields identically.

### FR-02 — Digit-only input
Only digit characters (0–9) are accepted. Any other character typed is silently discarded.

### FR-03 — Paste sanitization
On paste, the pasted text is stripped of all non-digit characters before formatting is applied.
- Example: pasting `"$ 1.234.567"` → digits extracted → `"1234567"` → displayed as `"1.234.567"`.

### FR-04 — Hidden submit value
A hidden `<input type="hidden">` with the real field `name` always holds the raw integer string.
- Display input has no `name` attribute (excluded from FormData).
- If the field is empty, the hidden input value is `""`.

### FR-05 — Pre-filled value (edit form)
When a `defaultValue` prop is provided (numeric string or number from DB), the component formats it on mount.
- `defaultValue="1234567"` → display shows `"1.234.567"`, hidden holds `"1234567"`.
- `defaultValue={null}` or `defaultValue={undefined}` → field is empty.

### FR-06 — Clear behavior
Deleting characters updates both the display value and the hidden raw value in sync.
- Deleting the last digit → both display and hidden are `""`.

### FR-07 — Required validation
When `required` is true and the field is empty, native browser validation blocks submission.
- The hidden input carries the `required` attribute (not the visible input).

## Non-Functional Requirements

### NFR-01 — No Zod/server changes
The component's output (raw integer string) is compatible with the existing `parseFloat(val)` transform in all Zod schemas. Zero server-side changes required.

### NFR-02 — No external dependencies
The formatter is implemented with plain JavaScript string manipulation. No new npm packages.

### NFR-03 — Accessible label
The visible input has an `id` matching its `<label>` `htmlFor`. The hidden input has no label.

### NFR-04 — Lint and build clean
`npm run lint` and `npm run build` pass with no new warnings or errors.

## Component Contract

```ts
type PriceInputProps = {
  name: string;           // field name — goes on the hidden input
  label: string;          // visible label text
  currency: "ARS" | "USD"; // reserved for future divergence; currently both use same format
  defaultValue?: string | number | null;
  required?: boolean;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
};
```

## Fields in scope

| Form | Field name | Label |
|------|-----------|-------|
| Create | `booking_total_price_ars` | Precio total ARS |
| Create | `booking_total_price_usd` | Precio total USD |
| Create | `prepayment_ars` | Anticipo ARS |
| Create | `prepayment_usd` | Anticipo USD |
| Update | `booking_total_price_ars` | Precio total ARS |
| Update | `booking_total_price_usd` | Precio total USD |
| Update | `prepayment_ars` | Anticipo ARS |
| Update | `prepayment_usd` | Anticipo USD |
| Update | `balancepayment_ars` | Saldo ARS |
| Update | `balancepayment_usd` | Saldo USD |

## Out of scope

- Decimal support
- Currency symbol display inside the input
- Formatting of prices in display-only components (KPICards, PaymentProgressCard, etc.)
- Any server action or schema changes
