# Tasks — booking-edit-ui-fixes

## Review Workload Forecast
- Estimated changed lines: ~60–80
- Chained PRs recommended: No
- 400-line budget risk: Low
- Files touched: 2

---

## Task List

### T1 — Fix DatePicker z-index in FormField.tsx
**File**: `app/components/FormField.tsx`
**Type**: patch

Add `popperProps={{ strategy: "fixed" }}` to the `<DatePicker>` element inside the
`type === "date"` branch.

Acceptance:
- [ ] Both "Check in" and "Check out" calendars render above all section cards.
- [ ] No other props on `<DatePicker>` are changed.

---

### T2 — Add `useCurrencyInput` hook in UpdateBookingFormClient.tsx
**File**: `app/components/UpdateBookingFormClient.tsx`
**Type**: feature — new inline hook

Implement the hook exactly as designed:

```ts
function useCurrencyInput(initial: string) { ... }
```

- `toDisplay(raw)`: formats integer part with `.` separators, joins decimal with `,`
- `toRaw(display)`: strips `.`, replaces `,` → `.`
- `onChange`: strips non-`\d,` chars, splits on `,`, caps decimal at 2 places, calls `setDisplayValue(toDisplay(raw))`

Acceptance:
- [ ] `useCurrencyInput("1500000")` → `displayValue = "1.500.000"`, `rawValue = "1500000"`
- [ ] `useCurrencyInput("1500000.50")` → `displayValue = "1.500.000,50"`, `rawValue = "1500000.50"`
- [ ] `useCurrencyInput("")` → `displayValue = ""`, `rawValue = ""`
- [ ] Typing `1500000` character by character produces correct intermediate states.

---

### T3 — Wire hook instances for ARS price fields
**File**: `app/components/UpdateBookingFormClient.tsx`
**Type**: integration

Instantiate:
```ts
const totalPriceArs = useCurrencyInput(booking.total_price_ars ?? "");
const prepaymentArs = useCurrencyInput(booking.deposit_payment_ars ?? "");
```

Replace the two `<FormField type="text" name="booking_total_price_ars" ...>` and
`<FormField type="text" name="prepayment_ars" ...>` inside the `currency === 1` branches
with inline field pairs:
- Visible `<input>`: `value={displayValue}`, `onChange`, `inputMode="numeric"`, no `name`
- Hidden `<input>`: `name="booking_total_price_ars"` (or `prepayment_ars`), `value={rawValue}`
- Wrap in `<div className="flex flex-col">` + `<label>` matching existing style

Acceptance:
- [ ] Typing in ARS total price field shows formatted display.
- [ ] Typing in ARS prepayment field shows formatted display.
- [ ] Hidden inputs carry raw numeric values (verify via browser DevTools → FormData).
- [ ] Labels and layout are visually identical to adjacent fields.

---

### T4 — Wire hook instances for USD price fields
**File**: `app/components/UpdateBookingFormClient.tsx`
**Type**: integration

Instantiate:
```ts
const totalPriceUsd = useCurrencyInput(booking.total_price_usd ?? "");
const prepaymentUsd = useCurrencyInput(booking.deposit_amount_usd ?? "");
```

Replace the two `<FormField type="text" name="booking_total_price_usd" ...>` and
`<FormField type="text" name="prepayment_usd" ...>` inside the `currency === 2` branches
with the same inline field pair pattern as T3.

Acceptance:
- [ ] Typing in USD total price field shows formatted display.
- [ ] Typing in USD prepayment field shows formatted display.
- [ ] Hidden inputs carry raw numeric values.

---

### T5 — Format balance defaultValue on mount
**File**: `app/components/UpdateBookingFormClient.tsx`
**Type**: patch

The `balance` fields remain as `<FormField type="text" readOnly>`. Pass a pre-formatted
`defaultValue` using the same `toDisplay` logic extracted as a standalone helper:

```ts
const formatCurrency = (val: string | null | undefined): string => { ... };
```

Pass `defaultValue={formatCurrency(booking.balance_payment_ars ?? "")}` (ARS branch) and
`defaultValue={formatCurrency(booking.balance_amount_usd ?? "")}` (USD branch).

Acceptance:
- [ ] Balance field renders formatted on page load (e.g. `125.000` not `125000`).
- [ ] Field remains read-only and non-interactive.

---

### T6 — Lint + build verification
**Type**: validation

```bash
npm run lint
npm run build
```

Acceptance:
- [ ] Zero lint errors introduced.
- [ ] Build completes without type errors.

---

## Dependency Order

```
T2 (hook) → T3 (ARS wire)
          → T4 (USD wire)
          → T5 (balance format, reuses formatCurrency from T2)
T1 (independent)
T6 (after T1–T5)
```

T1 and T2–T5 can be implemented in either order; T6 runs last.
