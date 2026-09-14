# Tasks: Price Input Formatter

## T-01 — Create PriceInput component
**File**: `app/components/PriceInput.tsx`

- [ ] Define `PriceInputProps` type (name, label, currency, defaultValue, required, placeholder, className, readOnly)
- [ ] Implement `formatWithDots(digits: string): string` using regex `/\B(?=(\d{3})+(?!\d))/g`
- [ ] Initialize `rawValue` and `displayValue` state
- [ ] `useEffect` on mount: normalize `defaultValue` to digits, set both states
- [ ] `onChange` handler: strip non-digits → update both states
- [ ] Render: label + visible text input (no name) + hidden input (name + required)
- [ ] Apply `inputBase` / `labelBase` Tailwind classes inline (self-contained)
- [ ] `readOnly` support: disable visible input + apply opacity class

## T-02 — Update CreateBookingFormClient
**File**: `app/components/CreateBookingFormClient.tsx`

- [ ] Import `PriceInput`
- [ ] Replace `<FormField type="text" name="booking_total_price_ars" ...>` → `<PriceInput currency="ARS" ...>`
- [ ] Replace `<FormField type="text" name="booking_total_price_usd" ...>` → `<PriceInput currency="USD" ...>`
- [ ] Replace `<FormField type="text" name="prepayment_ars" ...>` → `<PriceInput currency="ARS" ...>`
- [ ] Replace `<FormField type="text" name="prepayment_usd" ...>` → `<PriceInput currency="USD" ...>`

## T-03 — Update UpdateBookingFormClient
**File**: `app/components/UpdateBookingFormClient.tsx`

- [ ] Import `PriceInput`
- [ ] Replace price field → `<PriceInput currency="ARS" defaultValue={booking.total_price_ars} ...>`
- [ ] Replace price field → `<PriceInput currency="USD" defaultValue={booking.total_price_usd} ...>`
- [ ] Replace prepayment_ars → `<PriceInput currency="ARS" defaultValue={booking.deposit_payment_ars} ...>`
- [ ] Replace prepayment_usd → `<PriceInput currency="USD" defaultValue={booking.deposit_amount_usd} ...>`
- [ ] Replace balancepayment_ars → `<PriceInput currency="ARS" defaultValue={booking.balance_payment_ars ?? ""} ...>`
- [ ] Replace balancepayment_usd → `<PriceInput currency="USD" defaultValue={booking.balance_amount_usd ?? ""} ...>`

## T-04 — Verify
- [ ] `npm run lint` — no new errors
- [ ] `npm run build` — no type errors, build succeeds
