# Proposal — Home Hub Redesign

## Problem

The current home page is focused solely on the bookings calendar. Email inquiries
(Cabañas.com, Booking.com, Airbnb) live on a separate `/inquiries` page that requires
extra navigation and a manual sync trigger every session. The daily workflow forces
the operator to visit two different pages to get a complete operational picture.

## Proposed Solution

Consolidate the daily operations into the home page (`/`) as a single hub:

1. **Home page redesign** — keep the existing top section (search bar, next booking
   card, create button) and add a split section below: inquiries on the left/top,
   calendar on the right/bottom.
2. **Auto-sync on login** — `InquiryDashboard` triggers `GET /api/inquiries`
   automatically on mount (via `useEffect`). Failures show an error without blocking
   the rest of the page.
3. **Navbar update** — remove the "Consultas" item, change the sidebar logo from the
   Dreamhouse image to a `House` icon, add a "Home" nav item pointing to `/`.
4. **Delete `/inquiries` page** — no redirect needed; the content now lives at `/`.

## Out of Scope

- Changes to the inquiries API or data model
- Pagination or filtering of the inquiry list on the home
- Navbar badge / push notifications for new inquiries
- A separate calendar-only page (home calendar is sufficient)
