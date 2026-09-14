# Proposal — booking-edit-ui-fixes

## Problem
Two UX defects in the booking edit form (`/bookings/[id]/edit`):

1. **Calendar overlap**: The `react-datepicker` popover in the "Estadía" section renders
   behind the "Financiero" card. Root cause: `react-datepicker` positions the calendar
   in normal document flow (no portal). Cards rendered later in the DOM with `bg-white`
   create a new stacking context that covers the popover.

2. **Price readability**: Price inputs (`total_price`, `prepayment`, `balance`) display raw
   numbers with no thousand separators. Users must count zeros manually to verify amounts
   like `1500000` vs `15000000`.

## Out of Scope
- Create booking form (`/bookings/new`) — not affected per user confirmation.
- Balance field recalculation — handled by a DB trigger, no client change needed.
- Currency symbol prefix/suffix (only thousand-separator formatting requested).

## Proposed Solution

### Fix 1 — DatePicker z-index
Add `popperProps={{ strategy: "fixed" }}` to both `DatePicker` instances in `FormField.tsx`.
This switches react-datepicker to use `position: fixed` for the calendar popover, which
escapes any parent stacking context and renders above all sibling cards regardless of DOM order.

No CSS globals change needed. No portal setup needed.

**File**: `app/components/FormField.tsx`

### Fix 2 — Thousand-separator formatting on price inputs
Introduce a `useCurrencyInput` hook (inline in `UpdateBookingFormClient.tsx`) that:
- Stores the raw numeric value (string of digits and at most one decimal separator).
- Derives the display value by inserting `.` every 3 digits from the right (Argentine convention).
- Strips separators on change so the underlying value sent to the server action is always a plain number string.
- Exposes `displayValue`, `rawValue`, and `onChange` for each price field.

Apply the hook to the three controlled price inputs: `total_price`, `prepayment`, and `balance`.
`balance` is `readOnly` — its formatted display is derived from the current raw values of the other two.

**File**: `app/components/UpdateBookingFormClient.tsx`

## Acceptance Criteria
- AC1: Clicking "Check in" or "Check out" inputs opens the calendar popover on top of
  all section cards, including "Financiero".
- AC2: Typing `1500000` in any price input displays `1.500.000` in real time.
- AC3: The value submitted to the server action is the raw number string (no separators).
- AC4: Switching currency (ARS ↔ USD) resets the formatted display and the raw value correctly.
- AC5: No regression on existing fields (channel, status, guest, notes, phone).
