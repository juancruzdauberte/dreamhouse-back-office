# Proposal: Price Input Formatter

## Problem

Price fields in `CreateBookingFormClient` and `UpdateBookingFormClient` are plain `type="text"` inputs with no formatting. Users type raw numbers (`1234567`) with no visual grouping, making it hard to validate what they entered at a glance — especially for large ARS amounts.

Additionally, the current Zod schema uses `parseFloat(val)` directly on the submitted string. This means:
- Sending `"1.234"` → `parseFloat` returns `1.234` ❌ (should be `1234` for ARS)
- Sending `"1,234"` → `parseFloat` returns `1` ❌ (should be `1234` for USD)

Any formatting approach that submits the display value breaks the server parse.

## Proposed Solution

Create a `PriceInput` client component that:
1. Shows the user a **formatted display** as they type (thousands separators, no decimals).
2. Submits the **raw integer string** via a hidden `<input>` with the field name (e.g. `"1234567"`), keeping the Zod schema untouched.

### Format rules

| Currency | Thousands sep | Decimals | Example |
|----------|--------------|----------|---------|
| ARS      | `.`          | 0        | `1.234.567` |
| USD      | `.`          | 0        | `1.234.567` |

Both currencies share the same visual format (`.` as thousands separator, no decimals).

### Typing behavior

- Only digits allowed; non-numeric keystrokes are discarded.
- Thousands separators are inserted automatically on every keystroke.
- Paste is sanitized (strips non-digits, then formats).
- Clear/backspace works naturally (user sees formatted value shrink).
- If the field is empty, hidden input submits `""` (schema handles nullable).

### Pre-filled values (edit form)

`UpdateBookingFormClient` passes `defaultValue` (a numeric value from DB, e.g. `1234567`). The component formats it on mount.

## Scope

### New file
- `app/components/PriceInput.tsx` — the controlled input component.

### Modified files
- `app/components/CreateBookingFormClient.tsx` — replace `FormField type="text"` with `PriceInput` for all price fields.
- `app/components/UpdateBookingFormClient.tsx` — same, with `defaultValue` support.

### NOT in scope
- Zod schema changes (server-side parse stays as-is).
- Display of formatted prices outside forms (e.g. KPICards, PaymentProgressCard).
- Adding decimal support.
- Any currency conversion logic.

## Acceptance Criteria

1. Typing `1234567` in an ARS field shows `1.234.567` in the input.
2. Typing `1234567` in a USD field shows `1,234,567` in the input.
3. The hidden input always holds the raw integer string (`"1234567"`).
4. The server action receives the value and `parseFloat("1234567")` → `1234567` ✅.
5. Editing a booking pre-fills the formatted value from the DB numeric value.
6. Clearing the field submits `""` — the server treats it as nullable without errors.
7. Pasting a formatted string (`"1.234.567"`) strips separators and re-formats correctly.
8. Non-digit characters are rejected silently.
9. `npm run lint` and `npm run build` pass with no new errors.

## Risk

Low. The change is purely presentation-layer: one new component, two updated call sites. The hidden input preserves the existing server contract. No DB, no API, no schema changes.
