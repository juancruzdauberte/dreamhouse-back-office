# Proposal — Mobile UX/UI Adaptation

## Problem

The back-office is built desktop-first. On viewports below 768 px (Tailwind `md`
breakpoint) several critical usability failures occur:

1. The sidebar always occupies 80 px of horizontal space, wasting screen real estate
   on narrow devices.
2. The inquiry list renders above the calendar on the home page; because it has
   infinite scroll, the calendar is completely buried and unreachable without heavy
   scrolling.
3. The FullCalendar month view renders tiny, unreadable events and its booking-info
   tooltip is mouse-only (`onMouseEnter`/`onMouseLeave`), which never fires on touch.
4. KPI dashboard cards display in a single column (1 per row) on mobile — 6 cards
   require extensive scrolling before reaching the charts.
5. Booking detail action buttons (Edit, PDF, WhatsApp, Delete) appear below all
   content on mobile because they live in the right column of a `lg:grid-cols-3` grid.
6. All form `<input>` elements use `text-sm` (14 px). iOS automatically zooms any
   input with `font-size < 16 px`, breaking the viewport and user experience.
7. The booking search dropdown panel uses `position: absolute` without viewport-aware
   constraints, causing it to overflow and clip on narrow screens.
8. Recharts chart containers lack `overflow-x: hidden` / `min-w-0` guards, causing
   horizontal layout bleed on small screens.
9. Inquiry card action buttons (`w-8 h-8` = 32 px) fall below the 44 px minimum
   touch-target guideline on iOS/Android.
10. The `<main>` element carries a hard `ml-[80px]` offset at all breakpoints; when the
    sidebar is hidden on mobile, this offset must be removed.

## Proposed Solution

Adapt the application to be fully responsive and touch-friendly below the `md`
(768 px) breakpoint. All changes are additive Tailwind responsive classes and
minimal component-level state additions — no new packages are introduced.

### 1 — Navbar: hamburger drawer (Navbar.tsx)

Replace the desktop expand-on-hover sidebar with a two-mode layout:

- **Mobile (< md):** hidden sidebar + hamburger button fixed top-left. Tapping it
  opens an overlay drawer (slides in from the left, full-height, `w-64`, backdrop
  with `bg-black/40`). The drawer closes on link tap, backdrop tap, or Escape key.
  The `<main>` element gets `ml-0 md:ml-[80px]` so content fills the full width on
  mobile.
- **Desktop (≥ md):** existing compact hover-expand sidebar, unchanged.

The hamburger button (`Menu` / `X` icon from lucide-react) is rendered only when
`< md`. The drawer overlay and open/close state live in the existing `Sidebar`
component; no new state store is needed.

### 2 — Home page: calendar-first order on mobile (page.tsx)

Swap the visual order of `CalendarComponent` and `InquiryDashboard` on mobile using
Tailwind `order` utilities:

```
Calendar  → order-first  lg:order-last
Inquiries → order-last   lg:order-first
```

No change to data fetching or component logic.

### 3 — FullCalendar: week view + tap interaction on mobile (CalendarComponent.tsx)

Two sub-changes:

**a) Mobile view:** use a `useEffect` + `window.innerWidth` check (or a small inline
`useMediaQuery` hook) to set FullCalendar's `initialView` to `dayGridWeek` on screens
< 768 px and `dayGridMonth` on ≥ 768 px. `dayGridWeek` is already available through
the installed `@fullcalendar/daygrid` plugin — no new package required. Add a
`headerToolbar` right-side toggle button `"dayGridMonth,dayGridWeek"` visible on all
sizes so the user can switch manually.

**b) Tap tooltip:** on mobile, `eventClick` shows a small modal/sheet (instead of
navigating immediately) displaying: guest name, status badge, channel, guests, nights,
total price, and a "Ver detalle →" button that navigates to `/bookings/:id`. On
desktop the existing hover tooltip + direct click-navigate behavior is preserved.
The mobile detection reuses the same media-query check from sub-change (a).

### 4 — KPI Cards: 2-column mobile grid (KPICards.tsx)

Change the grid from `md:grid-cols-2 lg:grid-cols-4` to
`grid-cols-2 md:grid-cols-2 lg:grid-cols-4`.
Cards are already compact enough for 2 columns at 320 px+.

### 5 — Booking detail: sticky mobile action bar (bookings/[id]/page.tsx + new component)

Add a new `MobileActionBar` client component (`app/components/booking-detail/MobileActionBar.tsx`)
that renders a `fixed bottom-0 left-0 right-0` bar visible only on `< md`:

```
[ ✏️ Editar ]  [ 💬 WhatsApp ]
```

The bar contains the two most-used actions (Edit, WhatsApp — when phone exists).
The existing right-column action card (Edit, PDF, WhatsApp, Delete) remains fully
intact and scrollable for less-frequent actions (PDF, Delete). The sticky bar is
hidden on desktop with `md:hidden` and adds `pb-[80px] md:pb-0` to the page
container so content is not obscured.

### 6 — Form inputs: prevent iOS zoom (CreateBookingForm.tsx, UpdateBookingForm.tsx)

Add `text-base md:text-sm` to all `<input>`, `<select>`, and `<textarea>` elements
in both forms. 16 px on mobile prevents automatic iOS viewport zoom; 14 px is
restored on desktop where it matches the existing design.

### 7 — BookingSearchBar: mobile-safe dropdown (BookingSearchBar.tsx)

On mobile, the dropdown changes from `position: absolute` to `position: fixed` with
`inset-x-3 top-[calc(var(--search-top)+56px)]` (using a CSS custom property set via
inline `style` on the container). This keeps the panel within viewport bounds and
scrollable. On desktop, existing absolute positioning is preserved.

A simpler alternative (no CSS custom property): use `max-w-[calc(100vw-1.5rem)]` and
`left-0 right-auto` on mobile to keep the dropdown from clipping at the right edge.
The spec adopts this simpler approach.

### 8 — Dashboard charts: overflow guard (dashboard components)

Wrap each chart in `<div className="w-full overflow-x-hidden min-w-0">` inside the
existing `ResponsiveContainer`. Add `min-w-0` to parent grid cells in the dashboard
page. Recharts `ResponsiveContainer` with `width="100%"` already handles
responsiveness; the guard prevents a known flex-child expansion bug in Safari.

### 9 — Touch targets: 44 px minimum (InquiryCard, BookingInquiryCard, AirbnbInquiryCard)

Change action icon buttons from `w-8 h-8` (32 px) to `w-10 h-10` (40 px) with an
additional `p-1` padding, achieving an effective tap area of ≥ 44 px. This applies to
WhatsApp, Email, and Phone buttons in all three inquiry card variants.

### 10 — Sidebar ml offset fix (Navbar.tsx)

Change `ml-[80px]` on `<main>` to `ml-0 md:ml-[80px]`. Covered by change #1 above.

## Non-Goals

- New bottom tab-bar navigation (overlay drawer is the right pattern for admin
  back-offices; bottom tab-bars suit consumer apps).
- Installing `@fullcalendar/list` for a list view — `dayGridWeek` from the already-
  installed daygrid plugin provides adequate mobile density without a new dependency.
- Dark mode or theme changes.
- PWA / offline support.
- Changes to API routes, data models, or server actions.
- Changes to the PDF generation flow.
- Redesigning the dashboard chart data or KPI calculations.

## Files Affected

| File | Type | Change |
|------|------|--------|
| `app/components/layout/Navbar.tsx` | client | hamburger drawer, ml fix |
| `app/(pages)/page.tsx` | server | order utilities |
| `app/components/CalendarComponent.tsx` | client | mobile view + tap modal |
| `app/components/dashboard/KPICards.tsx` | server | grid-cols-2 base |
| `app/(pages)/bookings/[id]/page.tsx` | server | pb-[80px] md:pb-0, import MobileActionBar |
| `app/components/booking-detail/MobileActionBar.tsx` | client (new) | sticky action bar |
| `app/components/CreateBookingForm.tsx` | client | text-base md:text-sm on inputs |
| `app/components/UpdateBookingForm.tsx` | client | text-base md:text-sm on inputs |
| `app/components/BookingSearchBar.tsx` | client | dropdown mobile constraint |
| `app/components/dashboard/RevenueBarChart.tsx` | client | overflow guard |
| `app/components/dashboard/BookingsLineChart.tsx` | client | overflow guard |
| `app/components/dashboard/ChannelPieChart.tsx` | client | overflow guard |
| `app/(pages)/dashboard/page.tsx` | server | min-w-0 on grid cells |
| `app/components/inquiries/InquiryCard.tsx` | client | w-10 h-10 touch targets |
| `app/components/inquiries/BookingInquiryCard.tsx` | client | w-10 h-10 touch targets |
| `app/components/inquiries/AirbnbInquiryCard.tsx` | client | w-10 h-10 touch targets |

Total: 15 modified + 1 new = **16 files**.

## Risks

- **FullCalendar `initialView` hydration:** the view is set based on `window.innerWidth`
  which is not available on the server. The change uses a `useEffect` / state pattern
  to avoid SSR mismatch.
- **Sticky action bar z-index:** the bar uses `z-50`; the existing sidebar uses `z-50`
  too. On mobile the sidebar becomes an overlay, so they cannot appear simultaneously
  — no conflict.
- **iOS bounce scroll + fixed bar:** `position: fixed` elements on iOS Safari can
  occasionally flicker during momentum scroll. Using `safe-area-inset-bottom` padding
  (`pb-safe`) or `env(safe-area-inset-bottom)` mitigates this. The spec includes this.
