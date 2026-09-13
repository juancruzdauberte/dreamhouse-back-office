# Spec — Mobile UX/UI Adaptation

## Breakpoint Convention

All requirements use the following breakpoint definition:

- **Mobile:** viewport width < 768 px (below Tailwind `md`)
- **Desktop:** viewport width ≥ 768 px (at or above Tailwind `md`)

---

## AC-1 · Navbar — hamburger drawer

### AC-1.1 Desktop layout (≥ md) — unchanged
**Given** the user is on a desktop viewport  
**Then** the sidebar renders as the existing compact hover-expand bar (`w-[80px]`
collapsed, `w-[240px]` expanded on hover)  
**And** `<main>` carries `ml-[80px]` offset  
**And** no hamburger button is visible

### AC-1.2 Mobile layout (< md) — hidden sidebar
**Given** the user is on a mobile viewport  
**Then** the sidebar is not visible in its collapsed state  
**And** `<main>` carries `ml-0` (no left offset)  
**And** a hamburger button (`Menu` icon, 44 × 44 px tap target) is rendered in the
top-left corner of `<main>`, fixed to the viewport

### AC-1.3 Drawer open
**Given** the user taps the hamburger button on mobile  
**Then** a full-height overlay drawer slides in from the left  
**And** the drawer is `w-64` wide  
**And** a semi-transparent backdrop (`bg-black/40`) covers the rest of the screen  
**And** the hamburger icon changes to an `X` (close icon)  
**And** the drawer contains: the Dreamhouse logo + name, the full nav item list
(Home, Dashboard, Crear Reserva, divider, Sitio Web), and the "Cerrar Sesión" button
— identical content to the desktop sidebar

### AC-1.4 Drawer close
**Given** the drawer is open  
**When** the user taps any nav link, taps the backdrop, or presses the Escape key  
**Then** the drawer closes and the backdrop disappears  
**And** the hamburger icon returns to the `Menu` state

### AC-1.5 No layout shift on drawer open
**Given** the drawer opens  
**Then** the `<main>` content does not shift horizontally (the drawer overlays, it
does not push)

---

## AC-2 · Home page — calendar-first order on mobile

### AC-2.1 Mobile order
**Given** the user is on a mobile viewport and visits `/`  
**Then** `CalendarComponent` renders **above** `InquiryDashboard` visually  
**And** this is achieved via CSS `order` utilities (`order-first` / `order-last`)
with no change to the DOM's data-fetching or component logic

### AC-2.2 Desktop order — unchanged
**Given** the user is on a desktop viewport  
**Then** `InquiryDashboard` renders in the left column and `CalendarComponent` in
the right column, identical to the current behavior

---

## AC-3 · FullCalendar — mobile week view

### AC-3.1 Default view on mobile
**Given** the user is on a mobile viewport and the calendar mounts  
**Then** the calendar renders in `dayGridWeek` view (7-day week strip)  
**And** no SSR hydration mismatch occurs (view selection happens client-side after
mount via `useEffect`)

### AC-3.2 Default view on desktop — unchanged
**Given** the user is on a desktop viewport  
**Then** the calendar renders in `dayGridMonth` view, identical to the current behavior

### AC-3.3 Manual view toggle
**Given** the calendar is rendered  
**Then** the `headerToolbar` right section contains toggle buttons for both
`dayGridMonth` and `dayGridWeek`  
**And** the user can switch between views on any device

### AC-3.4 View persistence during date navigation
**Given** the user is on mobile in `dayGridWeek` view  
**When** the user navigates forward or backward using the prev/next buttons  
**Then** the view remains `dayGridWeek`

---

## AC-4 · FullCalendar — tap interaction on mobile

### AC-4.1 Desktop event click — unchanged
**Given** the user is on a desktop viewport  
**When** the user hovers over a calendar event  
**Then** the existing tooltip appears (guest name, status, channel, guests, nights,
total)  
**When** the user clicks the event  
**Then** the browser navigates directly to `/bookings/:id`

### AC-4.2 Mobile event tap — info modal
**Given** the user is on a mobile viewport  
**When** the user taps a calendar event  
**Then** a modal/sheet appears (does NOT navigate immediately)  
**And** the modal displays: guest name, status badge, channel, guest count, nights,
total price  
**And** the modal contains a "Ver detalle →" button that navigates to `/bookings/:id`  
**And** the modal contains an explicit close affordance (× button or tap-outside)

### AC-4.3 Modal close
**Given** the mobile event modal is open  
**When** the user taps the × button or outside the modal  
**Then** the modal closes without navigation

---

## AC-5 · KPI Cards — 2-column mobile grid

**Given** the user visits `/dashboard` on any viewport  
**Then** KPI cards render in a responsive grid:

| Breakpoint | Columns |
|------------|---------|
| < md (mobile) | 2 |
| md – lg | 2 |
| ≥ lg | 4 |

**And** all 6 cards are visible without horizontal scrolling

---

## AC-6 · Booking detail — sticky mobile action bar

### AC-6.1 Sticky bar visibility
**Given** the user views `/bookings/:id` on a mobile viewport  
**Then** a sticky bar is fixed to the bottom of the viewport  
**And** the bar is hidden on desktop (`md:hidden`)

### AC-6.2 Sticky bar contents
**Given** the sticky bar is visible  
**Then** it contains an "Editar" button linking to `/bookings/:id/edit`  
**And** if `booking.guest_phone` is present, it also contains a WhatsApp button
opening `https://wa.me/:phone`  
**And** if `booking.guest_phone` is absent, only the "Editar" button is shown

### AC-6.3 Content not obscured
**Given** the sticky bar is visible  
**Then** the page container has bottom padding (`pb-24 md:pb-0`) so no scrollable
content is hidden behind the bar

### AC-6.4 Safe area inset
**Given** the user is on an iOS device with a home indicator (notched/dynamic island)  
**Then** the sticky bar respects `env(safe-area-inset-bottom)` to avoid overlap with
the system gesture area

### AC-6.5 Existing action card — unchanged
**Given** the user scrolls to the "Acciones" section  
**Then** the existing Edit, PDF, WhatsApp, and Delete buttons remain fully functional
on both mobile and desktop

---

## AC-7 · Form inputs — prevent iOS zoom

### AC-7.1 Input font size on mobile
**Given** the user is on a mobile viewport and focuses any `<input>`, `<select>`, or
`<textarea>` in the create or edit booking form  
**Then** the element's computed `font-size` is ≥ 16 px  
**And** iOS Safari does NOT auto-zoom the viewport

### AC-7.2 Input font size on desktop — unchanged
**Given** the user is on a desktop viewport  
**Then** the input's computed `font-size` is 14 px (`text-sm`), matching the current
design

### AC-7.3 Single source change
**Then** the change is applied once in the `inputBase` constant in `FormField.tsx`
(value: `text-base md:text-sm`) and propagates to all field types automatically

---

## AC-8 · BookingSearchBar — mobile dropdown constraint

### AC-8.1 Dropdown stays within viewport on mobile
**Given** the user is on a mobile viewport and opens the search dropdown  
**Then** the dropdown panel does not overflow the right edge of the viewport  
**And** the panel has `max-w-[calc(100vw-1.5rem)]` and is left-aligned within its
container

### AC-8.2 Desktop dropdown — unchanged
**Given** the user is on a desktop viewport  
**Then** the dropdown panel behaves exactly as today (`w-full`, `position: absolute`)

---

## AC-9 · Dashboard charts — overflow guard

**Given** the user views `/dashboard` on a mobile viewport  
**Then** no chart (`RevenueBarChart`, `BookingsLineChart`, `ChannelPieChart`) causes
horizontal scrolling or content bleed beyond the viewport  
**And** each chart container has `overflow-x: hidden` and `min-w: 0`  
**And** chart rendering and data remain unchanged

---

## AC-10 · Touch targets — minimum 44 px

### AC-10.1 Inquiry card action buttons
**Given** the user views any inquiry card (`InquiryCard`, `BookingInquiryCard`,
`AirbnbInquiryCard`) on a mobile viewport  
**Then** the WhatsApp and Email/Phone action buttons have an effective tap area of
≥ 44 × 44 px  
**And** the visual size is `w-10 h-10` (40 px) with `p-0.5` padding achieving the
44 px effective target

### AC-10.2 Hamburger button
**Given** AC-1.2: the hamburger button is rendered  
**Then** its tap target is ≥ 44 × 44 px

---

## AC-11 · No regressions

**Given** any of the above changes are applied  
**Then** the following behaviors are fully preserved on desktop (≥ md):

- Sidebar expand-on-hover and all nav links
- Calendar month view, date navigation, hover tooltip, event click → detail
- Booking search dropdown positioning and behavior
- All booking form fields, validation, and submission
- All dashboard KPI values and chart data
- All inquiry card expand/collapse, WhatsApp, and email actions
- Booking detail: all action buttons (Edit, PDF, WhatsApp, Delete)
- Print styles (`@media print`) remain unaffected

**And** `npm run lint` exits with 0 errors  
**And** `npm run build` completes successfully
