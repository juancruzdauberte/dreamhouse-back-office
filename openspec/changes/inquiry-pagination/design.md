# Design — Inquiry Pagination (Infinite Scroll)

## Overview

Single-file change. All logic lives inside `InquiryDashboard.tsx`.
No new components, no new hooks file, no API changes.

---

## State changes

Add two new pieces of state:

```ts
const PAGE_SIZE = 10;
const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
const sentinelRef = useRef<HTMLDivElement>(null);
```

The rendered list becomes a slice:

```ts
const visibleItems = items.slice(0, visibleCount);
const hasMore = visibleCount < items.length;
```

---

## IntersectionObserver lifecycle

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

**Why re-run on `items.length`:** when a re-sync loads a different number of items,
the observer must re-attach to the (possibly new) sentinel.

**Why `threshold: 0.1`:** fires as soon as 10% of the sentinel enters the viewport —
responsive enough without being too eager.

---

## Re-sync reset

Inside `handleSync`, after `setItems(merged)`, add:

```ts
setVisibleCount(PAGE_SIZE);
```

This resets the visible window to the first 10 on every successful sync.

---

## Sentinel element

Rendered only when `hasMore` is true, at the bottom of the items list:

```tsx
{state === "loaded" && hasMore && (
  <div ref={sentinelRef} className="h-4" aria-hidden="true" />
)}
```

`h-4` (16px) gives the observer enough target area without adding visible space.

---

## Render diff (loaded state)

```tsx
// Before
{state === "loaded" && items.length > 0 && (
  <div className="flex flex-col gap-2">
    {items.map((item) => ...)}
  </div>
)}

// After
{state === "loaded" && items.length > 0 && (
  <div className="flex flex-col gap-2">
    {visibleItems.map((item) => ...)}
    {hasMore && <div ref={sentinelRef} className="h-4" aria-hidden="true" />}
  </div>
)}
```

---

## No-items and idle states

Unchanged. The empty state check stays against `items.length`, not `visibleItems.length`.

---

## Data flow

```
handleSync() → setItems(merged) + setVisibleCount(10)
  └─ items in state (full array, sorted by date desc)
       └─ visibleItems = items.slice(0, visibleCount)  [derived, no extra state]
            └─ render visibleItems.map(...)
            └─ sentinel (if hasMore)
                 └─ IntersectionObserver fires → setVisibleCount(prev + 10)
```
