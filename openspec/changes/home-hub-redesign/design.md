# Design — Home Hub Redesign

## Architecture Overview

No new abstractions are introduced. The change redistributes existing components
across pages and adds one `useEffect` to an existing client component.

```
app/(pages)/
  page.tsx                        ← modified: split layout server component
  inquiries/page.tsx              ← DELETED

app/components/
  layout/Navbar.tsx               ← modified: items + logo
  inquiries/InquiryDashboard.tsx  ← modified: add autoSync useEffect
```

---

## 1. `app/(pages)/page.tsx` — Server Component

### Current structure
```
top-bar (title + button + search + próxima reserva)
CalendarComponent
```

### New structure
```
top-bar (unchanged)
split-section
  └─ left/top:  <InquiryDashboard />          (client, self-fetching)
  └─ right/bottom: <CalendarComponent />       (receives bookings as props)
```

### Layout implementation

The split section uses a two-column Tailwind grid on `lg+` and a single column on
mobile. The calendar data fetch remains exactly as today (server-side via
`bookingRepository`).

```tsx
{/* Split section */}
<div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6">
  <div className="min-w-0">
    <InquiryDashboard />
  </div>
  <div className="min-w-0">
    <CalendarComponent bookings={calendarBookings} initialDate={startDate} />
  </div>
</div>
```

Column ratio `2fr / 3fr` gives inquiries ~40% and the calendar ~60% on desktop.

### Server-side data fetching (unchanged)

```ts
const [calendarBookings, closestBooking] = await Promise.all([
  bookingRepository.getBookingsForCalendar(calendarStartDate, endDate, 200),
  bookingRepository.getClosestUpcomingBooking(),
]);
```

`InquiryDashboard` fetches its own data client-side — no server-side inquiry fetch
is added to `page.tsx`.

---

## 2. `app/components/inquiries/InquiryDashboard.tsx` — Auto-sync

### Change

Add a single `useEffect` that calls the existing `handleSync` function on mount:

```tsx
useEffect(() => {
  handleSync();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

`handleSync` is already defined in the component and handles all states (loading,
error, loaded). No new state or logic is required.

### Why not extract `handleSync` to a hook?

`handleSync` is tightly coupled to the component's local state setters. Extracting
it would add indirection with no benefit for this scope. A future refactor could
move it to a custom hook if the component grows.

### "Sincronizar" button behavior

The button remains visible and functional in all states. This lets the user
re-trigger a sync at any time without a full page reload.

---

## 3. `app/components/layout/Navbar.tsx` — Items + Logo

### Logo area

Replace the `<Image>` tag with a `House` icon from lucide:

```tsx
// Before
<Image src="https://..." width={40} height={40} alt="Dreamhouse Logo" />

// After
<House size={40} className="text-foreground shrink-0" aria-label="Dreamhouse" />
```

The `House` icon is already available in `lucide-react` (same package already
imported). The "Dreamhouse" text label next to it is preserved and animates with
the sidebar expand/collapse as today.

### Nav items

Remove `Mail` import and the "Consultas" `SidebarItem`.
Add `House` import.
Replace the "Ver Reservas" item with "Home":

```tsx
// Before
<SidebarItem icon={<Calendar size={20} />} text="Ver Reservas" href="/" />
<SidebarItem icon={<Mail size={20} />} text="Consultas" href="/inquiries" />

// After
<SidebarItem icon={<House size={20} />} text="Home" href="/" />
```

`Calendar`, `Mail` imports removed. `House` added to the lucide import line.

Final sidebar items (top → bottom):

```
House     → Home          /
ChartNoAxesCombined → Dashboard   /dashboard
CalendarPlus2 → Crear Reserva  /bookings/create
─────────────────────────────────────────────
LinkIcon  → Sitio Web     https://dreamhousebaradero.com/
─────────────────────────────────────────────
LogOut    → Cerrar Sesión  (signOut action)
```

---

## 4. `app/(pages)/inquiries/page.tsx` — Delete

File is deleted outright. Next.js App Router will return 404 for `/inquiries`
automatically. No redirect configuration needed.

---

## Data Flow Diagram

```
Login → redirect to /
  └─ page.tsx (server)
       ├─ fetch calendarBookings (DB)
       ├─ fetch closestBooking (DB)
       └─ render
            ├─ top-bar (static)
            ├─ InquiryDashboard (client)
            │    └─ useEffect mount → GET /api/inquiries (IMAP)
            │         └─ setState: items, newUids
            └─ CalendarComponent (client, receives bookings as props)
```

---

## Risk Notes

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| IMAP auto-sync on mount adds latency visible to user | Low | Loading state already handles this; no UX change needed |
| Split layout breaks on very narrow desktop viewports | Low | `min-w-0` on both columns prevents overflow; calendar is already responsive |
| Removing `/inquiries` breaks a saved browser bookmark | Accepted | Out of scope; no redirect configured per spec |
