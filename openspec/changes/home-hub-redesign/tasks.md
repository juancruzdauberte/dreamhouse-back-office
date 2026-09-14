# Tasks — Home Hub Redesign

## Delivery Strategy: single PR (< 400 lines)

Estimated changed lines: ~80–120. Single PR, no chaining needed.

---

## Task List

### TASK-1 · Switch to branch `test`
- **Type**: setup
- **File**: —
- **Done when**: `git branch --show-current` returns `test`
- **Note**: Already done. No action needed.

---

### TASK-2 · Add auto-sync `useEffect` to `InquiryDashboard`
- **Type**: feature
- **File**: `app/components/inquiries/InquiryDashboard.tsx`
- **Done when**: AC-2 passes — component calls `GET /api/inquiries` on mount without
  user interaction, loading state shows immediately, error state appears if the call
  fails without blocking the rest of the page, manual "Sincronizar" button still works

**What to change:**
1. Add `useEffect` import from React (already likely imported — verify)
2. Inside `InquiryDashboard`, after the state declarations, add:
   ```tsx
   useEffect(() => {
     handleSync();
     // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);
   ```

---

### TASK-3 · Update `Navbar` — logo + items
- **Type**: feature
- **File**: `app/components/layout/Navbar.tsx`
- **Done when**: AC-3 passes — sidebar shows exactly 4 nav items (Home, Dashboard,
  Crear Reserva, Sitio Web), logo is `House` icon, "Consultas" item is gone

**What to change:**
1. In the lucide import line: remove `Calendar`, `Mail`; add `House`
2. Replace `<Image ...>` logo with `<House size={40} className="text-foreground shrink-0" aria-label="Dreamhouse" />`
3. Remove the `Image` import from `next/image` (only if it's no longer used elsewhere
   in the file — verify)
4. Replace the "Ver Reservas" `SidebarItem` with:
   ```tsx
   <SidebarItem icon={<House size={20} />} text="Home" href="/" />
   ```
5. Delete the "Consultas" `SidebarItem`

---

### TASK-4 · Redesign home `page.tsx` — split layout
- **Type**: feature
- **File**: `app/(pages)/page.tsx`
- **Done when**: AC-1 passes — top bar is visually identical to today, split section
  shows inquiries and calendar side by side on desktop, stacked on mobile

**What to change:**
1. Add `InquiryDashboard` import
2. Replace the current `<div className="mb-8"><CalendarComponent .../></div>` section
   with the split grid:
   ```tsx
   <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6 mb-8">
     <div className="min-w-0">
       <InquiryDashboard />
     </div>
     <div className="min-w-0">
       <CalendarComponent bookings={calendarBookings} initialDate={startDate} />
     </div>
   </div>
   ```
3. No changes to the top bar section (title, button, search bar, próxima reserva card)
4. No changes to the server-side data fetching logic

---

### TASK-5 · Delete `/inquiries` page
- **Type**: cleanup
- **File**: `app/(pages)/inquiries/page.tsx`
- **Done when**: AC-4 passes — file is deleted, `/inquiries` returns 404, no other
  file references `/inquiries`

**What to change:**
1. Delete `app/(pages)/inquiries/page.tsx`
2. Verify no remaining links to `/inquiries` in the codebase:
   ```bash
   grep -r "inquiries" app --include="*.tsx" --include="*.ts" -l
   ```
   Expected survivors: `app/api/inquiries/` routes and `app/components/inquiries/`
   components — those are fine (API + UI components, not page navigation links)

---

### TASK-6 · Lint + build verification
- **Type**: verification
- **Done when**: AC-5 passes

```bash
npm run lint
npm run build
```

Both must exit with code 0 and no new errors.

---

## Execution Order

```
TASK-2 → TASK-3 → TASK-4 → TASK-5 → TASK-6
```

TASK-2 first so `InquiryDashboard` is ready before it gets embedded in the home.
TASK-3 and TASK-4 are independent and can be done in either order.
TASK-5 is last before verification to avoid broken imports during development.

---

## Review Workload Forecast

| Metric | Value |
|--------|-------|
| Files modified | 3 |
| Files deleted | 1 |
| Estimated changed lines | ~80–120 |
| Chained PRs recommended | No |
| 400-line budget risk | Low |
| Decision needed before apply | No |
