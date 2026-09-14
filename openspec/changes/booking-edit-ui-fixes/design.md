# Design — booking-edit-ui-fixes

## Architecture Overview

Two surgical, isolated changes. No new components, no new routes, no state lifted outside
the existing component tree.

---

## Fix 1 — DatePicker popover z-index

### Change
Single prop addition on the existing `<DatePicker>` element in `FormField.tsx`.

```tsx
// Before
<DatePicker
  selected={dateValue}
  onChange={(date: Date | null) => setDateValue(date)}
  name={props.name}
  dateFormat="yyyy-MM-dd"
  className={inputBase}
  placeholderText={props.placeholder ?? "Seleccionar fecha"}
  excludeDateIntervals={excludeIntervals}
  required={props.required}
  minDate={props.disablePastDates ? new Date() : undefined}
  autoComplete="off"
/>

// After
<DatePicker
  selected={dateValue}
  onChange={(date: Date | null) => setDateValue(date)}
  name={props.name}
  dateFormat="yyyy-MM-dd"
  className={inputBase}
  placeholderText={props.placeholder ?? "Seleccionar fecha"}
  excludeDateIntervals={excludeIntervals}
  required={props.required}
  minDate={props.disablePastDates ? new Date() : undefined}
  autoComplete="off"
  popperProps={{ strategy: "fixed" }}
/>
```

### Why `strategy: "fixed"` and not alternatives
| Option | Tradeoff |
|---|---|
| `popperProps={{ strategy: "fixed" }}` | Escapes stacking context cleanly; no layout impact; zero extra markup |
| `withPortal` | Full-screen overlay; overkill for desktop forms |
| CSS z-index override in globals | Fragile; affects all datepickers app-wide; brittle with future cards |
| `z-index` on `BookingFormSection` | Requires adding a prop + logic to every section; breaks encapsulation |

`strategy: "fixed"` is the minimal, targeted fix.

---

## Fix 2 — Thousand-separator formatting

### Hook design: `useCurrencyInput`

```tsx
function useCurrencyInput(initial: string) {
  const toDisplay = (raw: string): string => {
    if (!raw) return "";
    const [intPart, decPart] = raw.split(".");
    const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return decPart !== undefined ? `${formatted},${decPart}` : formatted;
  };

  const toRaw = (display: string): string => {
    // strip thousand dots, replace decimal comma with dot
    return display.replace(/\./g, "").replace(",", ".");
  };

  const [displayValue, setDisplayValue] = useState(() => toDisplay(initial));
  const rawValue = toRaw(displayValue);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // allow only digits, dots (thousand sep), and one comma (decimal)
    const cleaned = input.replace(/[^\d,]/g, "");
    const parts = cleaned.split(",");
    const intRaw = parts[0].replace(/\./g, ""); // strip any pasted dots
    const decRaw = parts[1]?.slice(0, 2);       // max 2 decimal places
    const raw = decRaw !== undefined ? `${intRaw}.${decRaw}` : intRaw;
    setDisplayValue(toDisplay(raw));
  };

  return { displayValue, rawValue, onChange };
}
```

### Integration pattern per price field

Each controlled price field becomes a pair of inputs:

```tsx
// Visible input — display only, no name attr
<input
  type="text"
  value={totalPriceArs.displayValue}
  onChange={totalPriceArs.onChange}
  inputMode="numeric"
  className={inputBase}
  placeholder="0"
  required
/>
// Hidden input — carries name + raw value for FormData
<input
  type="hidden"
  name="booking_total_price_ars"
  value={totalPriceArs.rawValue}
/>
```

The visible input has no `name` so it never appears in FormData.
The hidden input always carries the clean numeric string.

### Hook instances in UpdateBookingFormClient

```
totalPriceArs  = useCurrencyInput(booking.total_price_ars ?? "")
totalPriceUsd  = useCurrencyInput(booking.total_price_usd ?? "")
prepaymentArs  = useCurrencyInput(booking.deposit_payment_ars ?? "")
prepaymentUsd  = useCurrencyInput(booking.deposit_amount_usd ?? "")
```

`balance` fields remain `readOnly` FormField components — their display value comes from
`defaultValue` (DTO). They get the same `toDisplay` formatting on mount via a one-time
derived value passed as `defaultValue`. No hook needed.

### Currency switch reset
The existing `key={`price-${currency}`}` wrapper on each field group forces React to
**unmount + remount** the subtree on currency change. Because `useState` re-initialises
on mount, each hook naturally resets to its new `initial` value. No extra effect needed.

### Label wrappers
To preserve visual consistency with the rest of the form, wrap each field pair in the
same `<div className="flex flex-col">` + `<label>` pattern used by `FormField`. This
avoids a new shared component while keeping the UI identical.

---

## Component tree impact (diff summary)

```
UpdateBookingFormClient
  ├── [new] useCurrencyInput × 4 instances      ← added
  ├── BookingFormSection "Estadía"
  │   ├── FormField type="date" (check_in)      ← popperProps added in FormField.tsx
  │   └── FormField type="date" (check_out)     ← same
  └── BookingFormSection "Financiero"
      ├── FormField type="select" (currency)    ← unchanged
      ├── [inline] total price field pair       ← replaces FormField type="text"
      ├── [inline] prepayment field pair        ← replaces FormField type="text"
      └── FormField type="text" balance         ← unchanged (readOnly, defaultValue formatted)
```

---

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Pasted value with mixed separators (`1.500.000` pasted in) | Medium | `toRaw` strips all `.` before reformatting |
| User pastes a value with `$` or spaces | Low | `cleaned` regex `[^\d,]` strips all non-numeric chars |
| `strategy: "fixed"` breaks calendar position inside a scrolled container | Low | Form is a full-page scroll; fixed positioning is correct here |
| `balance` raw value contains separators from DTO | None | DTO values come from DB as plain numbers |
