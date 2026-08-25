# Spec — Home Hub Redesign

## Acceptance Criteria

### AC-1 · Home page layout

**Given** an authenticated user visits `/`  
**Then** the page renders the following sections in order:

1. **Top bar** — identical to the current home:
   - Page title "Reservas" with subtitle
   - "Crear Reserva" button linking to `/bookings/create`
   - `BookingSearchBar` component
   - "Próxima Reserva" card (or "Sin reservas" if none exists)

2. **Split section** (below the top bar):
   - **Mobile** (`< lg`): `InquiryDashboard` stacked above `CalendarComponent`
   - **Desktop** (`>= lg`): `InquiryDashboard` on the left column (≈ 40% width),
     `CalendarComponent` on the right column (≈ 60% width)

**And** the existing calendar behavior (date navigation, booking click → detail page,
tooltip on hover) is fully preserved.

---

### AC-2 · Auto-sync on login

**Given** the user lands on `/` after authentication  
**When** `InquiryDashboard` mounts  
**Then** it automatically calls `GET /api/inquiries` without user interaction

**And** the loading state (`state === "loading"`) is shown immediately during the call

**And** if the call succeeds, inquiries are displayed sorted by date descending, with
new-item detection via `localStorage` (existing logic preserved)

**And** if the call fails, the error message is shown in the error state without
blocking the rest of the page (calendar and top bar remain visible)

**And** the manual "Sincronizar" button remains visible so the user can re-sync at
any time

---

### AC-3 · Navbar items

**Given** the authenticated user views any protected page  
**Then** the sidebar contains exactly these items (top to bottom):

| Order | Label | Icon | Route | Notes |
|-------|-------|------|-------|-------|
| 1 | Home | `House` (lucide) | `/` | active when `pathname === "/"` |
| 2 | Dashboard | `ChartNoAxesCombined` | `/dashboard` | unchanged |
| 3 | Crear Reserva | `CalendarPlus2` | `/bookings/create` | unchanged |
| — | *(divider)* | — | — | unchanged |
| 4 | Sitio Web | `LinkIcon` | external | unchanged |

**And** the "Consultas" item (`/inquiries`) is removed

**And** the sidebar logo area replaces the Dreamhouse `<Image>` with a `House` icon
from lucide (same size area, no external image dependency for the logo)

**And** the "Dreamhouse" text label next to the logo is preserved when the sidebar
is expanded

**And** the logout button at the bottom of the sidebar is unchanged

---

### AC-4 · Inquiries page removed

**Given** a user navigates to `/inquiries`  
**Then** the route returns a Next.js 404 (the file is deleted, no redirect configured)

**And** no other page or component contains a link to `/inquiries`

---

### AC-5 · No regression on existing pages

**Given** any existing protected page (dashboard, create booking, booking detail,
edit booking)  
**Then** its behavior and appearance are unchanged

**And** `npm run lint` passes with no new errors  
**And** `npm run build` completes successfully

---

## Constraints

- `InquiryDashboard` must remain a `"use client"` component.
- The auto-sync `useEffect` must use an empty dependency array `[]` to fire only on
  mount (once per page load / login session).
- The split layout must use Tailwind utilities only — no new CSS files.
- No new npm packages are required.
- The `CalendarComponent` receives data from the server component (`page.tsx`) via
  props, as it does today — no client-side fetch for calendar data.
