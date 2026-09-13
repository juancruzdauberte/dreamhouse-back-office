# Design — Mobile UX/UI Adaptation

## Architecture Overview

All changes are additive responsive Tailwind classes and minimal client-side
state additions. No new packages, no API changes, no new abstractions beyond one
new component (`MobileActionBar`).

```
app/components/layout/
  Navbar.tsx                          ← modified: hamburger drawer, ml fix

app/(pages)/
  page.tsx                            ← modified: order utilities on grid children
  dashboard/page.tsx                  ← modified: min-w-0 on chart grid cells

app/components/
  CalendarComponent.tsx               ← modified: mobile view + tap modal
  BookingSearchBar.tsx                ← modified: dropdown mobile constraint
  FormField.tsx                       ← modified: inputBase text-base md:text-sm
  dashboard/KPICards.tsx              ← modified: grid-cols-2 base
  dashboard/RevenueBarChart.tsx       ← modified: overflow guard wrapper
  dashboard/BookingsLineChart.tsx     ← modified: overflow guard wrapper
  dashboard/ChannelPieChart.tsx       ← modified: overflow guard wrapper
  inquiries/InquiryCard.tsx           ← modified: w-10 h-10 touch targets
  inquiries/BookingInquiryCard.tsx    ← modified: w-10 h-10 touch targets
  inquiries/AirbnbInquiryCard.tsx     ← modified: w-10 h-10 touch targets
  booking-detail/
    MobileActionBar.tsx               ← NEW: sticky bottom action bar

app/(pages)/bookings/[id]/
  page.tsx                            ← modified: pb-24 md:pb-0, MobileActionBar
```

---

## 1. Navbar.tsx — Hamburger Drawer

### State model

One boolean state `drawerOpen` lives inside the existing `Sidebar` component.
No new context or store is needed.

```ts
const [drawerOpen, setDrawerOpen] = useState(false);
```

### Rendering strategy

Two rendering modes driven by responsive classes, not JS media-query:

```tsx
{/* Mobile hamburger trigger — visible only < md */}
<button
  className="fixed top-4 left-4 z-50 md:hidden flex items-center justify-center w-11 h-11 rounded-xl bg-background border border-border shadow-sm"
  onClick={() => setDrawerOpen(true)}
  aria-label="Abrir menú"
>
  <Menu size={20} />
</button>

{/* Desktop sidebar — hidden < md */}
<aside className="hidden md:flex ... h-screen fixed left-0 top-0 z-50 ...">
  {/* existing sidebar content, unchanged */}
</aside>

{/* Mobile drawer overlay */}
{drawerOpen && (
  <>
    {/* Backdrop */}
    <div
      className="fixed inset-0 z-40 bg-black/40 md:hidden"
      onClick={() => setDrawerOpen(false)}
      aria-hidden="true"
    />
    {/* Drawer panel */}
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-background border-r border-border md:hidden flex flex-col">
      {/* Close button */}
      {/* Logo + name */}
      {/* Nav items — reuse SidebarItem, pass setDrawerOpen as onNavigate */}
      {/* Sign out button */}
    </div>
  </>
)}
```

### SidebarItem click handling on mobile

`SidebarItem` already calls `setExpanded(false)` on click via the context. On mobile
the drawer, `SidebarItem` receives an `onNavigate` prop (optional callback) that
closes the drawer. Alternatively the mobile `SidebarItem` instances can be inlined
inside the drawer panel — simpler, no prop drilling needed. The design uses **inline
duplication** of the link list inside the drawer: 5 items, trivial to maintain.

### `<main>` offset

```tsx
<main className="flex-1 ml-0 md:ml-[80px] w-full overflow-x-hidden">
```

### Escape key close

```ts
useEffect(() => {
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") setDrawerOpen(false);
  };
  document.addEventListener("keydown", onKey);
  return () => document.removeEventListener("keydown", onKey);
}, []);
```

---

## 2. page.tsx (Home) — Calendar-First Order on Mobile

### Implementation

The existing grid wrapper gains `flex-col` direction and the two children get `order`
utilities:

```tsx
<div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6 mb-8">
  {/* CalendarComponent — first visually on mobile, right column on desktop */}
  <div className="min-w-0 order-first lg:order-last">
    <CalendarComponent bookings={calendarBookings} initialDate={startDate} />
  </div>
  {/* InquiryDashboard — second visually on mobile, left column on desktop */}
  <div className="min-w-0 order-last lg:order-first">
    <InquiryDashboard />
  </div>
</div>
```

`order-first` / `order-last` are Tailwind utilities for `order: -9999` /
`order: 9999`. On `lg+` they are overridden by `lg:order-first` / `lg:order-last`.

No data fetching change. Server component.

---

## 3. CalendarComponent.tsx — Mobile View + Tap Modal

### Mobile view detection

FullCalendar's `initialView` must be set client-side (no `window` on server):

```ts
const [calView, setCalView] = useState<"dayGridMonth" | "dayGridWeek">("dayGridMonth");

useEffect(() => {
  setCalView(window.innerWidth < 768 ? "dayGridWeek" : "dayGridMonth");
}, []);
```

The `calView` state is passed to FullCalendar's `initialView` prop. Because
`initialView` only sets the view at mount time, a `key` prop is added to force
remount only if the view changes on resize (optional — not required for the spec;
the user can toggle manually via the toolbar).

### headerToolbar update

```ts
headerToolbar={{
  left: "prev,next today",
  center: "title",
  right: "dayGridMonth,dayGridWeek",   // toggle buttons for both views
}}
```

### Tap modal state

```ts
const [mobileEvent, setMobileEvent] = useState<EventApi | null>(null);
```

### handleEventClick — split by device

```ts
const handleEventClick = (clickInfo: EventClickArg) => {
  if (window.innerWidth < 768) {
    // Mobile: show modal
    setMobileEvent(clickInfo.event);
  } else {
    // Desktop: navigate directly (existing behavior)
    router.push(`/bookings/${clickInfo.event.id}`);
  }
};
```

### Mobile modal JSX

Rendered conditionally outside the FullCalendar wrapper, using a simple overlay
pattern (no new library):

```tsx
{mobileEvent && (
  <>
    <div
      className="fixed inset-0 z-50 bg-black/40 md:hidden"
      onClick={() => setMobileEvent(null)}
    />
    <div className="fixed inset-x-4 bottom-6 z-50 bg-white rounded-2xl shadow-2xl p-5 md:hidden">
      {/* guest name, status badge, channel, guests, nights, total */}
      <button onClick={() => router.push(`/bookings/${mobileEvent.id}`)}>
        Ver detalle →
      </button>
      <button onClick={() => setMobileEvent(null)}>×</button>
    </div>
  </>
)}
```

The existing `hoveredEvent` / `tooltipPosition` hover tooltip is preserved
unchanged and remains active on desktop.

---

## 4. KPICards.tsx — 2-Column Mobile Grid

Single class change:

```tsx
// Before
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
// After
<div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
```

`md:grid-cols-2` is redundant when `grid-cols-2` is the base. The result:
2 columns on mobile and tablet, 4 on desktop.

---

## 5. MobileActionBar.tsx (new) + bookings/[id]/page.tsx

### New component

```tsx
// app/components/booking-detail/MobileActionBar.tsx
"use client";

interface Props {
  bookingId: number;
  guestPhone?: string | null;
}

export default function MobileActionBar({ bookingId, guestPhone }: Props) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden
                 bg-white/95 backdrop-blur border-t border-border
                 px-4 py-3 flex gap-3
                 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]"
    >
      <Link
        href={`/bookings/${bookingId}/edit`}
        className="flex-1 inline-flex items-center justify-center gap-2
                   py-2.5 bg-blue-600 text-white text-sm font-medium
                   rounded-xl hover:bg-blue-700 transition-colors"
      >
        <Pencil className="w-4 h-4" />
        Editar
      </Link>

      {guestPhone && (
        <a
          href={`https://wa.me/${guestPhone}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-2
                     py-2.5 bg-[#25D366] text-white text-sm font-medium
                     rounded-xl hover:bg-[#20ba5a] transition-colors"
        >
          {/* WhatsApp icon */}
          WhatsApp
        </a>
      )}
    </div>
  );
}
```

### bookings/[id]/page.tsx changes

1. Add `pb-24 md:pb-0` to the outermost `<div>` container.
2. Import and render `<MobileActionBar>` at the bottom of the page (outside the
   grid), passing `bookingId` and `booking.guest_phone`.

---

## 6. FormField.tsx — inputBase

```ts
// Before
const inputBase =
  "w-full h-10 rounded-lg border border-border bg-background px-3 py-2 text-sm ...";

// After
const inputBase =
  "w-full h-10 rounded-lg border border-border bg-background px-3 py-2 text-base md:text-sm ...";
```

One line change. Propagates to all `<input>`, `<select>`, and `<textarea>` elements
in both `CreateBookingForm` and `UpdateBookingForm`.

---

## 7. BookingSearchBar.tsx — Dropdown Mobile Constraint

Add responsive max-width to the dropdown panel:

```tsx
<div
  className="absolute z-50 mt-2 w-full max-w-[calc(100vw-1.5rem)]
             bg-white border border-border rounded-2xl shadow-2xl
             overflow-hidden ..."
>
```

`max-w-[calc(100vw-1.5rem)]` prevents the panel from exceeding the viewport width
minus a 12 px gutter on each side. The `w-full` relative to the input container
already matches the input width on most layouts; the `max-w` only clamps on
narrow viewports where the container is close to viewport edge.

---

## 8. Dashboard Charts — Overflow Guard

Each chart component wraps its `ResponsiveContainer` in:

```tsx
<div className="w-full overflow-x-hidden min-w-0">
  <ResponsiveContainer width="100%" height={...}>
    ...
  </ResponsiveContainer>
</div>
```

In `dashboard/page.tsx`, the grid cells that wrap charts gain `min-w-0`:

```tsx
<div className="col-span-1 lg:col-span-2 min-w-0">
  <RevenueBarChart data={revenueData} />
</div>
```

`min-w-0` overrides the flex/grid child's implicit `min-width: auto` which is the
root cause of chart overflow in Safari.

---

## 9. Inquiry Cards — Touch Targets

In all three card components (`InquiryCard`, `BookingInquiryCard`, `AirbnbInquiryCard`):

```tsx
// Before
className="flex items-center justify-center w-8 h-8 rounded-lg ..."
// After
className="flex items-center justify-center w-10 h-10 rounded-lg ..."
```

`w-10 h-10` = 40 px. Combined with the surrounding `gap-2` and the card's `px-4`
padding, the effective touch area reaches the 44 px guideline. No visual overflow.

---

## Design Constraints and Tradeoffs

| Decision | Alternative Considered | Reason Chosen |
|---|---|---|
| Overlay drawer (not bottom tab-bar) | Bottom tab navigation | Admin back-office pattern; bottom tabs suit consumer apps |
| `dayGridWeek` for mobile (not `listMonth`) | Install `@fullcalendar/list` | Zero new dependencies; daygrid already installed |
| Inline drawer link duplication | Prop-drill `onNavigate` to SidebarItem | Simpler; drawer has 5 links, low maintenance cost |
| `window.innerWidth` check in useEffect | `useMediaQuery` hook | No new abstraction; single-use |
| `MobileActionBar` as new file | Inline in booking detail page | Keeps server component clean; action bar needs `"use client"` |
| `inputBase` change in FormField.tsx | Change each form individually | Single source of truth; both forms use the same base |
| `max-w-[calc(100vw-1.5rem)]` on dropdown | `position: fixed` dropdown | Simpler; no JS scroll/resize tracking needed |
