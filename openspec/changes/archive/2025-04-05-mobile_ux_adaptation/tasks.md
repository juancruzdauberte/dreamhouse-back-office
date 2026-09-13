# Tasks — Mobile UX/UI Adaptation

## Review Workload Forecast

| Metric | Value |
|--------|-------|
| Files modified | 15 |
| New files | 1 |
| Estimated changed lines | ~320–380 |
| 400-line budget risk | Low — within budget |
| Chained PRs recommended | No |
| Decision needed before apply | No |

**Delivery strategy: single PR** — estimated diff is within the 400-line review budget.

---

## Task List

- [x] TASK-1 · Navbar hamburger drawer — `app/components/layout/Navbar.tsx`
- [x] TASK-2 · Home page calendar-first order — `app/(pages)/page.tsx`
- [x] TASK-3 · FullCalendar mobile week view — `app/components/CalendarComponent.tsx`
- [x] TASK-4 · FullCalendar mobile tap modal — `app/components/CalendarComponent.tsx`
- [x] TASK-5 · KPI Cards 2-column mobile grid — `app/components/dashboard/KPICards.tsx`
- [x] TASK-6 · New MobileActionBar component — `app/components/booking-detail/MobileActionBar.tsx`
- [x] TASK-7 · Booking detail sticky bar integration — `app/(pages)/bookings/[id]/page.tsx`
- [x] TASK-8 · FormField inputBase font size fix — `app/components/FormField.tsx`
- [x] TASK-9 · BookingSearchBar dropdown mobile constraint — `app/components/BookingSearchBar.tsx`
- [x] TASK-10 · Dashboard charts overflow guard — `RevenueBarChart.tsx`, `BookingsLineChart.tsx`, `ChannelPieChart.tsx`, `dashboard/page.tsx`
- [x] TASK-11 · Inquiry cards touch targets — `InquiryCard.tsx`, `BookingInquiryCard.tsx`, `AirbnbInquiryCard.tsx`
- [x] TASK-12 · Verify lint and build — `npm run lint` && `npm run build`

---

## Task Details

### TASK-1 · Navbar hamburger drawer
- **AC:** AC-1.1 – AC-1.5
- **File:** `app/components/layout/Navbar.tsx`
- **Estimated lines:** ~90
- **Done when:** hamburger button appears on mobile (< md), drawer opens/closes on
  tap, backdrop closes drawer, Escape key closes drawer, desktop sidebar is unchanged,
  `<main>` has `ml-0 md:ml-[80px]`

**What to change:**
1. Add `Menu`, `X` to lucide-react imports.
2. Add `drawerOpen` state and `setDrawerOpen` to `Sidebar` component.
3. Add `useEffect` for Escape key listener (cleanup on unmount).
4. Render hamburger button: `fixed top-4 left-4 z-50 md:hidden w-11 h-11`.
5. Wrap the existing `<aside>` with `hidden md:flex` (desktop only).
6. Add mobile drawer below the aside:
   - Backdrop: `fixed inset-0 z-40 bg-black/40 md:hidden` with `onClick` close.
   - Drawer panel: `fixed inset-y-0 left-0 z-50 w-64 bg-background border-r
     border-border md:hidden flex flex-col justify-between`.
   - Drawer content: logo+name header, nav link list (inline — 5 links matching
     desktop items), divider, sign-out button.
   - Each nav link calls `setDrawerOpen(false)` on click.
7. Change `<main>` className from `ml-[80px]` to `ml-0 md:ml-[80px]`.

---

### TASK-2 · Home page — calendar-first order on mobile
- **AC:** AC-2.1 – AC-2.2
- **File:** `app/(pages)/page.tsx`
- **Estimated lines:** ~6
- **Done when:** on mobile the calendar renders above the inquiry list; on desktop
  the layout is unchanged (inquiries left, calendar right)

**What to change:**
1. In the grid wrapper `<div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6 mb-8">`:
   - Calendar `<div>`: add `order-first lg:order-last`.
   - InquiryDashboard `<div>`: add `order-last lg:order-first`.

---

### TASK-3 · FullCalendar — mobile week view
- **AC:** AC-3.1 – AC-3.4
- **File:** `app/components/CalendarComponent.tsx`
- **Estimated lines:** ~25
- **Done when:** calendar mounts in `dayGridWeek` on mobile, `dayGridMonth` on
  desktop; toolbar shows both toggle buttons; navigating prev/next preserves the
  current view; no SSR hydration warning

**What to change:**
1. Add state: `const [calView, setCalView] = useState<"dayGridMonth" | "dayGridWeek">("dayGridMonth")`.
2. Add `useEffect`:
   ```ts
   useEffect(() => {
     setCalView(window.innerWidth < 768 ? "dayGridWeek" : "dayGridMonth");
   }, []);
   ```
3. Update FullCalendar `initialView` prop: `initialView={calView}`.
4. Update `headerToolbar`:
   ```ts
   headerToolbar={{
     left: "prev,next today",
     center: "title",
     right: "dayGridMonth,dayGridWeek",
   }}
   ```
5. Add responsive CSS in the `<style jsx global>` block for the toolbar button
   toggle active state (FullCalendar adds `.fc-button-active` automatically).

---

### TASK-4 · FullCalendar — mobile tap modal
- **AC:** AC-4.1 – AC-4.3
- **File:** `app/components/CalendarComponent.tsx`
- **Estimated lines:** ~55
- **Done when:** tapping an event on mobile shows the info modal (no navigation);
  modal shows guest name, status badge, channel, guests, nights, total; "Ver detalle"
  button navigates to `/bookings/:id`; tapping backdrop or × closes modal; desktop
  click-navigate behavior is unchanged

**What to change:**
1. Add state: `const [mobileEvent, setMobileEvent] = useState<EventApi | null>(null)`.
2. Replace `handleEventClick`:
   ```ts
   const handleEventClick = (clickInfo: EventClickArg) => {
     if (window.innerWidth < 768) {
       setMobileEvent(clickInfo.event);
     } else {
       router.push(`/bookings/${clickInfo.event.id}`);
     }
   };
   ```
3. Add modal JSX below the calendar container (inside the component's return).
4. Reuse `extendedProps` fields already present on each event (guest_name, status,
   channel_name, guest_count, nights_stay, total_price) — no new data fetching.
5. The existing hover tooltip (`hoveredEvent`) is untouched.

---

### TASK-5 · KPI Cards — 2-column mobile grid
- **AC:** AC-5
- **File:** `app/components/dashboard/KPICards.tsx`
- **Estimated lines:** ~2
- **Done when:** 6 KPI cards display in 2 columns on mobile, 4 columns on desktop

**What to change:**
1. Change the grid className:
   ```tsx
   // Before
   <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
   // After
   <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
   ```

---

### TASK-6 · New MobileActionBar component
- **AC:** AC-6.1 – AC-6.4
- **File:** `app/components/booking-detail/MobileActionBar.tsx` (new file)
- **Estimated lines:** ~45
- **Done when:** component renders a fixed bottom bar with Edit and optional WhatsApp
  buttons; hidden on desktop with `md:hidden`; safe-area inset applied

---

### TASK-7 · Booking detail page — add sticky bar
- **AC:** AC-6.3 – AC-6.5
- **File:** `app/(pages)/bookings/[id]/page.tsx`
- **Estimated lines:** ~8
- **Done when:** `MobileActionBar` is rendered, page container has `pb-24 md:pb-0`,
  existing action card is unchanged

**What to change:**
1. Import `MobileActionBar`.
2. Add `pb-24 md:pb-0` to the outermost `<div className="min-h-screen ...">`.
3. Render `<MobileActionBar bookingId={booking.id} guestPhone={booking.guest_phone} />`
   at the bottom of the returned JSX (after the main grid, before the closing div).

---

### TASK-8 · FormField.tsx — inputBase font size fix
- **AC:** AC-7.1 – AC-7.3
- **File:** `app/components/FormField.tsx`
- **Estimated lines:** ~2
- **Done when:** all inputs/selects/textareas in both forms have `font-size: 16px`
  on mobile; iOS does not auto-zoom on focus

**What to change:**
1. In the `inputBase` constant, replace `text-sm` with `text-base md:text-sm`.
2. In the `<textarea>` className, replace `text-sm` with `text-base md:text-sm`.

---

### TASK-9 · BookingSearchBar — dropdown mobile constraint
- **AC:** AC-8.1 – AC-8.2
- **File:** `app/components/BookingSearchBar.tsx`
- **Estimated lines:** ~3
- **Done when:** dropdown does not overflow viewport on mobile; desktop behavior
  unchanged

**What to change:**
1. Add `max-w-[calc(100vw-1.5rem)]` to the dropdown panel's className alongside the
   existing `w-full`.

---

### TASK-10 · Dashboard charts — overflow guard
- **AC:** AC-9
- **Files:**
  - `app/components/dashboard/RevenueBarChart.tsx`
  - `app/components/dashboard/BookingsLineChart.tsx`
  - `app/components/dashboard/ChannelPieChart.tsx`
  - `app/(pages)/dashboard/page.tsx`
- **Estimated lines:** ~12
- **Done when:** no chart causes horizontal overflow on mobile

**What to change (each chart component):**
1. Wrap the `<ResponsiveContainer>` in `<div className="w-full overflow-x-hidden min-w-0">`.

**What to change in `dashboard/page.tsx`:**
2. Add `min-w-0` to each chart grid cell wrapper.

---

### TASK-11 · Inquiry cards — touch targets
- **AC:** AC-10.1
- **Files:**
  - `app/components/inquiries/InquiryCard.tsx`
  - `app/components/inquiries/BookingInquiryCard.tsx`
  - `app/components/inquiries/AirbnbInquiryCard.tsx`
- **Estimated lines:** ~6
- **Done when:** WhatsApp and Email/Phone action buttons are `w-10 h-10` in all
  three card variants

**What to change (each file):**
1. Replace `w-8 h-8` with `w-10 h-10` on the action icon buttons.

---

### TASK-12 · Verify, lint, build
- **AC:** AC-11
- **Done when:** `npm run lint` exits 0, `npm run build` completes successfully

---

## Implementation Order

1. TASK-8 (FormField — self-contained, 2 lines)
2. TASK-5 (KPICards — self-contained, 2 lines)
3. TASK-9 (BookingSearchBar — self-contained, 3 lines)
4. TASK-10 (charts + dashboard page — independent files)
5. TASK-11 (inquiry cards — independent files)
6. TASK-2 (home page order — requires reading current grid)
7. TASK-6 (new MobileActionBar — creates file, no dependencies)
8. TASK-7 (booking detail — depends on TASK-6)
9. TASK-3 (CalendarComponent week view)
10. TASK-4 (CalendarComponent tap modal — depends on TASK-3 being in same file)
11. TASK-1 (Navbar — largest task, last to avoid blocking other work)
12. TASK-12 (lint + build verification)
