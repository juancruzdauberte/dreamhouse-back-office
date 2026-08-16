# Design: Price Input Formatter

## Component Architecture

Single new client component: `app/components/PriceInput.tsx`

```
PriceInput
├── <div> wrapper (same className structure as FormField)
├── <label> for visible input
├── <input type="text"> (display — no name attr)
│     └── onChange → format → update displayValue state
└── <input type="hidden"> (submit — carries name + required)
      └── value = rawValue state (digits only)
```

## State

```ts
const [rawValue, setRawValue]         = useState<string>(""); // digits only: "1234567"
const [displayValue, setDisplayValue] = useState<string>(""); // formatted: "1.234.567"
```

Both states are derived from the same source. The hidden input reads `rawValue`; the visible input reads `displayValue`.

## Format Function

```ts
function formatWithDots(digits: string): string {
  if (!digits) return "";
  // Insert "." every 3 digits from the right
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
```

Works identically for ARS and USD per the confirmed requirement.

## Event Handlers

### onChange (visible input)
```
1. Strip all non-digit chars from e.target.value
2. setRawValue(stripped)
3. setDisplayValue(formatWithDots(stripped))
```

### onPaste (visible input)
Paste fires onChange natively after React synthetic event — no special handler needed. The `onChange` digit-strip handles it.

## Initialization (defaultValue)

```ts
useEffect(() => {
  const digits = String(defaultValue ?? "").replace(/\D/g, "");
  setRawValue(digits);
  setDisplayValue(formatWithDots(digits));
}, []); // mount only
```

`defaultValue` from DB may arrive as a numeric string like `"1234567"` or a number `1234567`. Both are normalized to a digit string before formatting.

## Styles

Reuse the existing `inputBase` and `labelBase` constants already exported from `FormField.tsx`, or inline the same Tailwind classes to keep `PriceInput` self-contained (preferred — avoids coupling to FormField internals).

```ts
const inputBase = "w-full h-10 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground transition-all duration-200 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 hover:border-border/80";
const labelBase = "block text-xs font-medium text-muted-foreground mb-1.5";
```

## Integration in CreateBookingFormClient

Replace `<FormField type="text" name="booking_total_price_ars" ...>` etc. with `<PriceInput>`:

```tsx
// Before
<FormField type="text" name="booking_total_price_ars" label="Precio total ARS" required />

// After
<PriceInput name="booking_total_price_ars" label="Precio total ARS" currency="ARS" required />
```

The `currency` prop is passed even though formatting is currently identical — it keeps the component future-proof if decimal formats ever diverge.

## Integration in UpdateBookingFormClient

Same swap, plus `defaultValue`:

```tsx
<PriceInput
  name="booking_total_price_ars"
  label="Precio total ARS"
  currency="ARS"
  defaultValue={booking.total_price_ars}
  required
/>
```

## File List

| File | Action | Reason |
|------|--------|--------|
| `app/components/PriceInput.tsx` | Create | New controlled price input component |
| `app/components/CreateBookingFormClient.tsx` | Modify | Swap FormField → PriceInput for 4 price fields |
| `app/components/UpdateBookingFormClient.tsx` | Modify | Swap FormField → PriceInput for 6 price fields |

## No changes required in

- `app/lib/schema/*.ts` — Zod schema unchanged
- `app/lib/actions/booking.actions.ts` — server action unchanged
- `app/components/FormField.tsx` — untouched
- Any repository or service layer
