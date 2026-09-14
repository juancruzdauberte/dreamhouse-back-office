# Spec — booking-edit-ui-fixes

## Scope
Two isolated fixes in the booking edit form. No new routes, no DB changes, no API changes.

---

## Feature 1 — DatePicker popover z-index

### Context
`react-datepicker` renders its calendar via an absolute-positioned div injected adjacent to
the input. When sibling `BookingFormSection` cards (rendered later in the DOM) carry
`bg-white` they implicitly form a new stacking context that covers the calendar.

### Behaviour spec
- The calendar popover MUST render above every `BookingFormSection` card on the page.
- The fix MUST NOT require changes to `BookingFormSection`, `globals.css`, or any other component.
- Both date fields ("Check in" and "Check out") are affected and MUST be fixed.

### Implementation contract
In `app/components/FormField.tsx`, on the `<DatePicker>` element rendered for `type === "date"`:

```
popperProps={{ strategy: "fixed" }}
```

This prop instructs react-datepicker to use `position: fixed` for the popper, which removes
the calendar from the normal stacking context and places it relative to the viewport.
No other props change.

---

## Feature 2 — Thousand-separator formatting on price inputs

### Context
Price inputs in "Financiero" section are uncontrolled `type="text"` fields whose `defaultValue`
comes from the booking DTO. Users cannot easily verify large ARS amounts (e.g. `1500000`).

### Behaviour spec
- While typing, the visible input value MUST show `.` as a thousand separator
  (Argentine convention: `1.500.000`, `250.000`, `12.500.000,50`).
- Decimal part: accept up to 2 decimal places using `,` as the decimal separator.
- The value sent to the server action (FormData) MUST be the raw numeric string
  (separators stripped): `"1500000"` or `"1500000.50"`.
- On currency switch (ARS ↔ USD) the formatted display and raw value MUST reset
  to the new `defaultValue` coming from the booking DTO.
- The `balance` field is `readOnly`: it receives its formatted display from the DB-computed
  value passed via `defaultValue`; it does NOT need a controlled onChange handler.
- Fields affected: `booking_total_price_ars/usd`, `prepayment_ars/usd`.
  `balancepayment_ars/usd` gets format-on-mount only (read-only, no interaction).

### Implementation contract

#### Hook: `useCurrencyInput`
Defined inline (not exported) at the top of `UpdateBookingFormClient.tsx`.

```ts
function useCurrencyInput(initial: string) {
  // strips non-numeric except one comma/dot for decimals
  // stores raw value: digits + optional "." decimal separator
  // derives display value: insert "." every 3 digits from right, keep "," decimal
  // returns { displayValue, rawValue, onChange }
}
```

Signature:
```ts
type CurrencyInputResult = {
  displayValue: string;   // shown in the visible <input>
  rawValue: string;       // submitted via hidden <input> or used as the name= value
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

function useCurrencyInput(initial: string): CurrencyInputResult
```

#### Formatting rules
| Input typed | rawValue | displayValue |
|---|---|---|
| `1500000` | `1500000` | `1.500.000` |
| `1500000,5` | `1500000.5` | `1.500.000,5` |
| `1500000,50` | `1500000.50` | `1.500.000,50` |
| `250` | `250` | `250` |
| `` (empty) | `` | `` |

Parsing rules:
1. Strip all `.` (thousand separators the user may have pasted).
2. Replace `,` with `.` to normalise to JS decimal.
3. Allow only digits and at most one `.`; strip everything else.
4. Store as `rawValue`.
5. To build `displayValue`: split on `.`, format integer part with `.` every 3 digits,
   rejoin with `,` if decimal part exists.

#### Integration in UpdateBookingFormClient
- Instantiate one `useCurrencyInput` per price field using the booking DTO value as `initial`.
- For the visible `<input>`: `value={displayValue}`, `onChange={onChange}`.
- The `name` attribute stays on the visible input with `rawValue` submitted via a controlled
  input swap: replace `defaultValue` with `value={rawValue}` and add a hidden sibling if needed,
  OR pass `rawValue` directly via a hidden input and make the visible input display-only.

  **Chosen approach** (simpler, avoids two inputs):
  Use the existing `FormField` `type="text"` but bypass it for these three fields:
  render inline `<div>` + `<label>` + `<input>` directly in `UpdateBookingFormClient`,
  with `value={displayValue}` for display and a hidden `<input name="..." value={rawValue}>` for submission.

#### Re-initialisation on currency switch
The `key={`price-${currency}`}` wrapper already forces React to remount the subtree.
Each `useCurrencyInput` call will re-run with the new `initial` value derived from the DTO.

---

## Files Changed

| File | Change |
|---|---|
| `app/components/FormField.tsx` | Add `popperProps={{ strategy: "fixed" }}` to `<DatePicker>` |
| `app/components/UpdateBookingFormClient.tsx` | Add `useCurrencyInput` hook; replace 2 controlled price fields with inline inputs + hidden inputs |

## Non-Goals
- No changes to `BookingFormSection`, `ReusableForm`, server actions, or DB layer.
- No changes to the create booking form.
- No locale-switching logic (format is always Argentine convention).
