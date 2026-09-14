# Spec — Inquiry Pagination (Infinite Scroll)

## Acceptance Criteria

### AC-1 · Initial render shows first 10 items

**Given** the auto-sync completes successfully  
**Then** only the first 10 items are rendered in the DOM (sorted by date descending)

**And** if total items ≤ 10, all items are shown and no sentinel is rendered

---

### AC-2 · Infinite scroll reveals next page

**Given** the list has more than 10 items  
**And** the user scrolls to the bottom of the list  
**When** the sentinel element enters the viewport  
**Then** the next 10 items are appended to the visible list

**And** this repeats until all items are visible

**And** once all items are visible the sentinel is removed from the DOM

---

### AC-3 · Re-sync resets pagination

**Given** the user clicks "Sincronizar"  
**When** the fetch completes successfully  
**Then** the visible count resets to 10  
**And** the list scrolls to show the most recent items first

---

### AC-4 · Loading and error states unchanged

**Given** the component is in `loading` or `error` state  
**Then** those states render exactly as before (no pagination UI shown)

---

### AC-5 · No new dependencies

**Then** the implementation uses only `IntersectionObserver` (native browser API)  
**And** no new npm packages are added

---

## Constraints

- Page size is a constant: `PAGE_SIZE = 10`
- The full items array stays in state — only the visible slice changes
- `IntersectionObserver` is created once when items load and cleaned up on unmount
- The sentinel is a plain `<div>` with a `ref` — no visible UI
- The existing `useEffect` for auto-sync remains unchanged
