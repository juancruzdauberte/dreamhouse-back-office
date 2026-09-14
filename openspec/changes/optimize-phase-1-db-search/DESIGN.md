# DESIGN: Phase 1 Database & Search Optimization

**Change Name:** `optimize-phase-1-db-search`  
**Status:** Design  
**Arch. Decision Records:** 3  

---

## I. ARCHITECTURE & DESIGN DECISIONS

### Decision 1: google_event_id Storage Location

**Question:** Store `google_event_id` in `fact_reservas` table directly?

**Options:**
1. **Add column to `fact_reservas`** ← CHOSEN
2. Create separate `booking_calendar_events` lookup table
3. Store in Redis (ephemeral)

**Decision Rationale:**
- ✅ Denormalization acceptable: 1:1 relationship (one booking, one event)
- ✅ No performance penalty: Index is cheap
- ✅ Backward compatible: Nullable field, no breaking changes
- ✅ Simplest implementation
- ❌ Option 2 adds join complexity
- ❌ Option 3 loses data on process restart

**ADR:** `001_google_event_id_storage_location.md`

---

### Decision 2: Composite Index Column Order

**Question:** Which column order for `(estado_reserva, id_canal_fk, fecha_checkin_fk)`?

**Options:**
1. **Current proposed: (estado_reserva, id_canal_fk, fecha_checkin_fk)** ← CHOSEN
2. (fecha_checkin_fk, estado_reserva, id_canal_fk)
3. (id_canal_fk, estado_reserva, fecha_checkin_fk)

**Decision Rationale:**
- Selectivity order (most to least selective):
  - estado_reserva: 4 values (Confirmada, Realizada, Cancelada, Pendiente)
  - id_canal_fk: 6 channels
  - fecha_checkin_fk: continuous date range
- MySQL uses index left-to-right, so most selective first
- Optimizes: `WHERE estado='Realizada' AND canal=1 AND fecha BETWEEN...`

**Index Usage Analysis:**
```sql
-- Uses ALL 3 columns:
WHERE estado_reserva = 'Realizada' AND id_canal_fk = 1 AND fecha_checkin_fk BETWEEN ...
-- Index predicate: (Realizada, 1, [date_range])

-- Uses first 2 columns:
WHERE estado_reserva = 'Realizada' AND id_canal_fk = 1
-- Index predicate: (Realizada, 1)

-- Uses first column only:
WHERE estado_reserva = 'Realizada'
-- Index predicate: (Realizada)

-- Does NOT use index (wrong order):
WHERE id_canal_fk = 1 AND estado_reserva = 'Realizada'
-- MySQL reorder to use index anyway (query optimizer)
```

**ADR:** `002_composite_index_column_order.md`

---

### Decision 3: Search Pagination Strategy

**Question:** Server-side pagination vs. client-side infinite scroll?

**Options:**
1. **Server-side pagination (limit/offset)** ← CHOSEN
2. Client-side infinite scroll (fetch all, paginate in browser)
3. Cursor-based pagination (keyset pagination)

**Decision Rationale:**
- ✅ Server-side: Reduces payload, allows server-side filtering
- ✅ Simpler for small datasets (max ~1000 bookings)
- ✅ Better performance (DB-driven filtering)
- ✅ Standard API pattern
- ❌ Cursor-based: Overkill for this scale
- ❌ Client-side infinite scroll: 1MB+ JSON payload

**Trade-off:** 
- If user jumps to page 50, must read 50 * limit rows from DB
- Mitigation: Practical limit is ~100 pages (2000 bookings)

**ADR:** `003_search_pagination_strategy.md`

---

## II. SYSTEM DESIGN

### Data Flow: Booking Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│              BOOKING CREATION (NEW FLOW)                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. User fills form                                         │
│     ↓                                                       │
│  2. POST /api/action/createBooking (Server Action)         │
│     ↓                                                       │
│  3. Validate with Zod schema                               │
│     ├─ tenant_name, check_in, check_out, etc.             │
│     └─ google_event_id: NOT required (will be filled)     │
│     ↓                                                       │
│  4. INSERT INTO fact_reservas                              │
│     ├─ SET google_event_id = NULL (initially)              │
│     ├─ All other fields from form                          │
│     └─ RETURN insertId                                     │
│     ↓                                                       │
│  5. createGoogleCalendarEvent()                            │
│     ├─ API call to Google Calendar                         │
│     ├─ RETURN { eventId, link }                            │
│     └─ If fails: Log error, continue                      │
│     ↓                                                       │
│  6. ✨ NEW: updateGoogleEventId(bookingId, eventId)       │
│     ├─ UPDATE fact_reservas SET google_event_id = eventId  │
│     └─ Now row has event_id for future operations         │
│     ↓                                                       │
│  7. revalidatePath() → ISR cache refresh                   │
│     ↓                                                       │
│  8. Return { success: true, message: "..." }              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow: Booking Update (NEW FLOW)

```
┌─────────────────────────────────────────────────────────────┐
│              BOOKING UPDATE (NEW FLOW)                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. User edits booking                                      │
│     ↓                                                       │
│  2. POST /api/action/updateBooking                         │
│     ↓                                                       │
│  3. SELECT * FROM fact_reservas WHERE id = bookingId       │
│     ├─ Get existing data                                   │
│     ├─ ✨ INCLUDING google_event_id                        │
│     └─ RETURN oldBooking                                   │
│     ↓                                                       │
│  4. Validate new form data                                 │
│     ↓                                                       │
│  5. UPDATE fact_reservas SET ...                           │
│     ↓                                                       │
│  6. ✨ updateGoogleCalendarEvent()                         │
│     ├─ PREVIOUS: calendar.events.list(q=bookingId)        │
│     │             Then find matching event (~2 sec)        │
│     ├─ NEW: Use eventId directly (O(1) lookup)            │
│     │        calendar.events.patch(eventId)                │
│     ├─ Update name, dates, colors, etc.                    │
│     └─ If fails: Log error (booking already updated)      │
│     ↓                                                       │
│  7. revalidatePath()                                       │
│     ↓                                                       │
│  8. Return success                                         │
│                                                             │
│  🚀 PERFORMANCE IMPROVEMENT: 1-2 API calls vs 2-3 before  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow: Booking Deletion (NEW FLOW)

```
┌─────────────────────────────────────────────────────────────┐
│              BOOKING DELETION (NEW FLOW)                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. User clicks "Delete"                                    │
│     ↓                                                       │
│  2. POST /api/action/deleteBooking(bookingId)             │
│     ↓                                                       │
│  3. SELECT * FROM fact_reservas WHERE id = bookingId       │
│     ├─ Get existing data                                   │
│     ├─ ✨ INCLUDING google_event_id                        │
│     └─ RETURN booking                                      │
│     ↓                                                       │
│  4. ✨ deleteGoogleCalendarEvent(eventId)                 │
│     ├─ PREVIOUS: calendar.events.list(q=bookingId)        │
│     │             Then find matching event (~2 sec)        │
│     ├─ NEW: Use eventId directly (O(1) lookup)            │
│     │        calendar.events.delete(eventId)               │
│     └─ If fails: Still delete booking (async cleanup)     │
│     ↓                                                       │
│  5. DELETE FROM fact_reservas WHERE id = bookingId         │
│     ↓                                                       │
│  6. revalidatePath()                                       │
│     ↓                                                       │
│  7. Return success                                         │
│                                                             │
│  🚀 PERFORMANCE IMPROVEMENT: 1-2 API calls vs 2-3 before  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow: Search Pagination (NEW ENDPOINT)

```
┌─────────────────────────────────────────────────────────────┐
│              BOOKING SEARCH (NEW ENDPOINT)                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. User types in search box                               │
│     ↓                                                       │
│  2. onChange → call useBookingSearch.search(q, page)      │
│     ↓                                                       │
│  3. GET /api/booking/search-v2?q=juan&page=1&limit=20     │
│     ↓                                                       │
│  4. Server: Authenticate                                   │
│     ↓                                                       │
│  5. Server: Parse query parameters                         │
│     ├─ q: search string (max 255 chars)                   │
│     ├─ page: current page (1-indexed)                     │
│     └─ limit: results per page (default 20, max 100)      │
│     ↓                                                       │
│  6. Server: Execute parallel queries                       │
│     ├─ SELECT results (WITH LIMIT/OFFSET)                  │
│     │  query = `%${q}%`                                    │
│     │  WHERE name LIKE query OR channel LIKE query OR tel  │
│     │  LIMIT 20 OFFSET 0                                   │
│     │  (~50-100ms with index)                              │
│     │                                                      │
│     └─ SELECT COUNT(*) total matching records             │
│        (~50-100ms with index)                              │
│     ↓                                                       │
│  7. Server: Construct response                             │
│     ├─ results: Array of bookings (20 max)                │
│     ├─ pagination:                                         │
│     │  ├─ page: 1                                          │
│     │  ├─ limit: 20                                        │
│     │  ├─ total: 237 (example)                             │
│     │  ├─ pages: 12                                        │
│     │  └─ hasMore: true                                    │
│     └─ Payload: ~50KB                                      │
│     ↓                                                       │
│  8. Server: Return response (200 OK)                       │
│     ↓                                                       │
│  9. Client: Update search results                          │
│     ├─ Display first 20 results                            │
│     ├─ Show pagination info ("1-20 of 237")               │
│     └─ Enable "Next Page" button                           │
│     ↓                                                       │
│  10. User clicks "Next Page"                               │
│     ↓                                                       │
│  11. useBookingSearch.search(q, 2) → GO TO STEP 3         │
│                                                             │
│  🚀 PERFORMANCE IMPROVEMENT:                                │
│  - Payload: 1MB → 50KB (-95%)                              │
│  - Latency: 500ms → 50ms (-90%)                            │
│  - Index: Uses existing indices automatically              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## III. DATABASE SCHEMA CHANGES

### Before
```sql
fact_reservas {
  id_reserva (PK)
  fecha_reserva_fk (FK)
  fecha_checkin_fk (FK, INDEX)
  fecha_checkout_fk (FK, INDEX)
  id_canal_fk (FK, INDEX)
  cant_huespedes
  noches_estadia
  estado_reserva (INDEX)
  nombre_huesped_ref
  precio_noche_cotizado_usd
  precio_total_cotizado_usd
  monto_anticipo_usd
  monto_saldo_usd
  pago_anticipo_ars
  tipo_cambio_anticipo
  pago_saldo_ars
  tipo_cambio_saldo
  comision_canal_usd
  reserva_por_adv
  precio_total_cotizado_ars
  tel_huesped
  medio_dia
  observaciones
}

INDICES:
- PRIMARY KEY (id_reserva)
- idx_cal_anio_mes (anio, mes)  [dim_calendario]
- idx_checkin (fecha_checkin_fk)
- idx_checkout (fecha_checkout_fk)
- idx_overlap_check (fecha_checkin_fk, fecha_checkout_fk, estado_reserva)
- idx_canal (id_canal_fk)
- idx_estado_checkin (estado_reserva, fecha_checkin_fk)
- idx_canal_checkin (id_canal_fk, fecha_checkin_fk)
- idx_checkin_checkout (fecha_checkin_fk, fecha_checkout_fk)
```

### After
```sql
fact_reservas {
  id_reserva (PK)
  fecha_reserva_fk (FK)
  fecha_checkin_fk (FK, INDEX)
  fecha_checkout_fk (FK, INDEX)
  id_canal_fk (FK, INDEX)
  cant_huespedes
  noches_estadia
  estado_reserva (INDEX)
  nombre_huesped_ref
  precio_noche_cotizado_usd
  precio_total_cotizado_usd
  monto_anticipo_usd
  monto_saldo_usd
  pago_anticipo_ars
  tipo_cambio_anticipo
  pago_saldo_ars
  tipo_cambio_saldo
  comision_canal_usd
  reserva_por_adv
  precio_total_cotizado_ars
  tel_huesped
  medio_dia
  observaciones
  ✨ google_event_id (VARCHAR(255), UNIQUE, INDEX)  [NEW]
}

INDICES:
- PRIMARY KEY (id_reserva)
- idx_cal_anio_mes (anio, mes)  [dim_calendario]
- idx_checkin (fecha_checkin_fk)
- idx_checkout (fecha_checkout_fk)
- idx_overlap_check (fecha_checkin_fk, fecha_checkout_fk, estado_reserva)
- idx_canal (id_canal_fk)
- idx_estado_checkin (estado_reserva, fecha_checkin_fk)
- idx_canal_checkin (id_canal_fk, fecha_checkin_fk)
- idx_checkin_checkout (fecha_checkin_fk, fecha_checkout_fk)
✨ idx_analisis_completo (estado_reserva, id_canal_fk, fecha_checkin_fk)  [NEW]
✨ idx_google_event_id (google_event_id)  [NEW]
```

---

## IV. API CHANGES

### Removed Endpoints
None (backward compatible).

### New Endpoints
- `GET /api/booking/search-v2` (paginated search)
- Keep old `GET /api/booking/search` (backward compatible)

### Modified Endpoints
None (only internal implementation).

### Data Type Changes

```typescript
// booking.dto.ts - ADD fields
+ google_event_id?: string | null;

// calendar.service.ts - RETURN changes
createGoogleCalendarEvent()
  - Old: { success: boolean; link?: string }
  + New: { success: boolean; link?: string; eventId?: string }

// calendar.service.ts - PARAMETER changes
updateGoogleCalendarEvent()
  + New param: googleEventId?: string

deleteGoogleCalendarEvent()
  - Old: (idBooking: number)
  + New: (googleEventId: string)
```

---

## V. IMPLEMENTATION PHASES

### Phase 1a: Database (1h)
- Create migration script
- Test on staging
- Backup production
- Execute migration

### Phase 1b: Code Updates (3.5h)
- Update DTOs
- Update repository
- Update calendar service
- Update booking actions
- Create search endpoint

### Phase 1c: Testing & Verification (0.5h)
- Unit tests
- Integration tests
- Staging validation
- Production health check

---

## VI. ERROR HANDLING & RECOVERY

### Scenario 1: Google Calendar API fails during create
```
1. Booking is created successfully in DB
2. Google Calendar API call fails (network, auth, etc.)
3. eventId is NOT stored (google_event_id stays NULL)
4. Calendar sync is attempted again in Phase 3 (future cron)

Recovery: ✅ Graceful degradation
- Booking still exists
- User can retry calendar sync later
- No data loss
```

### Scenario 2: Duplicate google_event_id (UNIQUE constraint)
```
1. Two bookings try to store same eventId (shouldn't happen)
2. UNIQUE constraint prevents duplicate
3. Exception thrown

Recovery: ✅ Can't happen
- Google Calendar eventIds are globally unique
- Only possible if code bug
- Add validation before insert
```

### Scenario 3: Migration fails on production
```
1. Index creation takes longer than expected
2. Statement times out or is killed

Recovery: ✅ Safe to retry
- Index creation is idempotent
- Can re-run migration any time
- No data is affected
```

### Scenario 4: Old code (without google_event_id) tries to update event
```
1. Old deployment is running
2. booking.google_event_id is NULL (no event_id stored)
3. updateGoogleCalendarEvent(googleEventId: null) is called
4. Function detects null and falls back to list search

Recovery: ✅ Backward compatible
- Falls back to old behavior (list search)
- No breakage
- Performance degraded temporarily
- Once new code deploys, uses fast path
```

---

## VII. MONITORING & OBSERVABILITY

### Metrics to Track
```typescript
// In calendar.service.ts
metrics.track('calendar.create.success', { eventId });
metrics.track('calendar.update.used_direct_id', { userId });
metrics.track('calendar.update.used_fallback_search', { userId });
metrics.track('calendar.delete.success', { eventId });

// In booking repository
metrics.track('search.query_time', { queryTimeMs, resultCount });
metrics.track('search.index_used', { indexName });

// In API endpoint
metrics.track('search_api.request', { page, limit, resultCount });
metrics.track('search_api.latency', { latencyMs });
```

### Alerts
- Alert if `calendar.update.used_fallback_search` > 10% (means many NULL event_ids)
- Alert if search query time > 100ms (index not used)
- Alert if google_event_id UNIQUE constraint violations

---

## VIII. DEPLOYMENT CHECKLIST

- [ ] Migrations tested on staging replica
- [ ] All code changes reviewed
- [ ] Unit & integration tests passing
- [ ] Staging deployment successful
- [ ] Performance benchmarks verified
- [ ] Monitoring setup complete
- [ ] Rollback plan documented
- [ ] Production backup created
- [ ] Deployment window scheduled
- [ ] Runbook prepared

---

## IX. ROLLBACK PLAN

### If migration fails:
```bash
# Drop the indices (safe, no data loss)
ALTER TABLE fact_reservas DROP INDEX idx_analisis_completo;
ALTER TABLE fact_reservas DROP INDEX idx_google_event_id;

# Drop the column (if needed)
ALTER TABLE fact_reservas DROP COLUMN google_event_id;

# Revert to old code
git revert <commit>
```

### If update/delete calendar calls fail:
- New code falls back to list search (old behavior)
- No user impact
- Performance degraded but functional

---

**Design Document Complete.**
