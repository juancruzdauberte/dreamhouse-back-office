# Tasks — Inquiry Pagination (Infinite Scroll)

## Delivery: single PR, single file

Estimated changed lines: ~25–35. No chaining needed.

---

### TASK-1 · Add `PAGE_SIZE`, `visibleCount` state and `sentinelRef`

**File**: `app/components/inquiries/InquiryDashboard.tsx`

**What to change:**

1. Add `useRef` to the React import (already has `useState`, `useEffect`)
2. After the existing state declarations, add:
   ```ts
   const PAGE_SIZE = 10;
   const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
   const sentinelRef = useRef<HTMLDivElement>(null);
   ```
3. After the state block, derive the slice:
   ```ts
   const visibleItems = items.slice(0, visibleCount);
   const hasMore = visibleCount < items.length;
   ```

**Done when:** the constants and refs compile without errors.

---

### TASK-2 · Reset `visibleCount` on re-sync

**File**: `app/components/inquiries/InquiryDashboard.tsx`

**What to change:**

Inside `handleSync`, immediately after `setItems(merged)` and before `setState("loaded")`, add:
```ts
setVisibleCount(PAGE_SIZE);
```

**Done when:** AC-3 — clicking "Sincronizar" resets the visible window to 10.

---

### TASK-3 · Add `IntersectionObserver` effect

**File**: `app/components/inquiries/InquiryDashboard.tsx`

**What to change:**

Add a new `useEffect` after the existing auto-sync `useEffect`:
```ts
useEffect(() => {
  if (!hasMore || !sentinelRef.current) return;

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, items.length));
      }
    },
    { threshold: 0.1 }
  );

  observer.observe(sentinelRef.current);
  return () => observer.disconnect();
}, [hasMore, items.length]);
```

**Done when:** AC-2 — scrolling to the bottom of a list with >10 items reveals the next 10.

---

### TASK-4 · Update rendered list to use `visibleItems` + sentinel

**File**: `app/components/inquiries/InquiryDashboard.tsx`

**What to change:**

In the loaded + items > 0 block, replace `items.map(...)` with `visibleItems.map(...)`
and add the sentinel after the map:

```tsx
{state === "loaded" && items.length > 0 && (
  <div className="flex flex-col gap-2">
    {visibleItems.map((item) =>
      item.kind === "visitor" ? (
        <InquiryCard ... />
      ) : item.kind === "booking" ? (
        <BookingInquiryCard ... />
      ) : (
        <AirbnbInquiryCard ... />
      )
    )}
    {hasMore && (
      <div ref={sentinelRef} className="h-4" aria-hidden="true" />
    )}
  </div>
)}
```

**Done when:** AC-1 — only 10 items render initially; AC-2 — sentinel triggers load more.

---

### TASK-5 · Verify empty-state check still uses `items.length`

**File**: `app/components/inquiries/InquiryDashboard.tsx`

**What to verify:**

The empty state condition reads `items.length === 0`, not `visibleItems.length === 0`.
No code change needed if already correct — just confirm.

**Done when:** empty state shows correctly when the API returns zero results.

---

## Execution Order

```
TASK-1 → TASK-2 → TASK-3 → TASK-4 → TASK-5
```

Linear — each task builds on the previous.

---

## Review Workload Forecast

| Metric | Value |
|--------|-------|
| Files modified | 1 |
| Estimated changed lines | ~25–35 |
| Chained PRs recommended | No |
| 400-line budget risk | None |
| Decision needed before apply | No |
