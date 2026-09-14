# SPECIFICATION: Phase 1 Database & Search Optimization

**Change Name:** `optimize-phase-1-db-search`  
**Status:** Specification  
**Date Created:** 2026-09-14  

---

## I. DETAILED REQUIREMENTS

### 1. Google Event ID Storage

#### 1.1 Database Schema
```sql
-- Migration: 001_add_google_event_id.sql
ALTER TABLE fact_reservas 
ADD COLUMN google_event_id VARCHAR(255) 
UNIQUE 
NOT NULL DEFAULT NULL AFTER precio_total_cotizado_ars;

CREATE INDEX idx_google_event_id ON fact_reservas(google_event_id);

-- Rationale:
-- - VARCHAR(255): Google Calendar event IDs are max 255 chars
-- - UNIQUE: Each booking has exactly one Google event
-- - NULL allowed initially: Backfill for existing bookings
-- - Index: For fast lookups in delete/update
```

#### 1.2 Data Type Mapping
```typescript
// BookingDTO - Add field
export interface BookingDTO {
  // ... existing fields
  google_event_id?: string | null;  // New field
}

export interface CreateBookingDTO {
  // ... existing fields
  google_event_id?: string | null;  // New field
}

export interface UpdateBookingDTO {
  // ... existing fields
  google_event_id?: string | null;  // New field
}
```

#### 1.3 Business Logic
```typescript
// When creating a booking:
// 1. User submits form
// 2. Server action validates with Zod
// 3. INSERT into fact_reservas (google_event_id = NULL initially)
// 4. Get bookingId from INSERT result
// 5. Call createGoogleCalendarEvent() 
// 6. If success, UPDATE fact_reservas SET google_event_id = response.eventId
// 7. If fails, log error but booking is still created (graceful degradation)

// When updating a booking:
// 1. Get existing booking (including google_event_id)
// 2. If google_event_id exists, use it directly (no search needed)
// 3. PATCH /calendar/events/{eventId} (O(1) operation)

// When deleting a booking:
// 1. Get existing booking (including google_event_id)
// 2. If google_event_id exists, DELETE /calendar/events/{eventId}
// 3. Then DELETE from fact_reservas
```

---

### 2. Composite Index Creation

#### 2.1 Index Definition
```sql
-- Migration: 002_add_composite_indices.sql

-- Composite index for filtering queries:
-- Commonly used filters: estado_reserva, id_canal_fk, fecha_checkin_fk
ALTER TABLE fact_reservas 
ADD INDEX idx_analisis_completo (
  estado_reserva,      -- Column 1: Most selective
  id_canal_fk,         -- Column 2: Second most selective
  fecha_checkin_fk     -- Column 3: Date range filtering
);

-- Rationale:
-- - Order matters: stato_reserva is enum (4 values), so first
-- - id_canal_fk is int (6 channels), so second
-- - fecha_checkin_fk is used for range queries, so third
-- - Query: WHERE estado='Realizada' AND id_canal=1 AND fecha BETWEEN...
--   This index will be used fully (all 3 columns)
```

#### 2.2 Expected Query Improvements
```sql
-- BEFORE (without index): ~2000ms with 100k rows
-- AFTER (with index): ~5ms

-- Query Pattern 1: Dashboard metrics
SELECT SUM(precio_total_cotizado_ars), COUNT(*)
FROM fact_reservas
WHERE estado_reserva = 'Realizada' 
  AND id_canal_fk = 1 
  AND fecha_checkin_fk BETWEEN '2024-01-01' AND '2024-12-31'
-- Uses: idx_analisis_completo ✅

-- Query Pattern 2: Availability check
SELECT COUNT(*) 
FROM fact_reservas
WHERE estado_reserva IN ('Confirmada', 'Realizada')
  AND NOT (fecha_checkout_fk <= @checkIn OR fecha_checkin_fk >= @checkOut)
-- Uses: idx_overlap_check (existing) ✅

-- Query Pattern 3: Revenue by channel
SELECT id_canal_fk, SUM(precio_total_cotizado_ars)
FROM fact_reservas
WHERE estado_reserva != 'Cancelada' AND fecha_checkin_fk > DATE_SUB(NOW(), INTERVAL 12 MONTH)
GROUP BY id_canal_fk
-- Uses: idx_analisis_completo ✅
```

#### 2.3 Index Maintenance
```sql
-- No special maintenance needed for online index creation
-- Railway MySQL 5.7+ supports ALGORITHM=INPLACE, LOCK=NONE
-- Safe to create during business hours

-- Post-creation statistics update (recommended):
ANALYZE TABLE fact_reservas;
```

---

### 3. Paginated Search Endpoint

#### 3.1 API Contract
```typescript
// GET /api/booking/search-v2?q=juan&page=1&limit=20

// Request:
interface SearchRequest {
  q: string;           // Search query (name, phone, channel)
  page: number;        // 1-indexed page number
  limit: number;       // Results per page (default 20, max 100)
}

// Response (200 OK):
interface SearchResponse {
  results: BookingSearchDTO[];
  pagination: {
    page: number;           // Current page
    limit: number;          // Results per page
    total: number;          // Total matching records
    pages: number;          // Total pages
    hasMore: boolean;       // Are there more pages?
  };
}

// Error Response (400 Bad Request):
interface ErrorResponse {
  error: string;  // "Invalid parameters" or similar
}
```

#### 3.2 Search Implementation
```typescript
// app/api/booking/search-v2/route.ts

export async function GET(req: Request) {
  // 1. Authenticate
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 2. Parse & validate query parameters
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));

  // 3. Validate search query
  if (q.length > 255) {
    return NextResponse.json({ error: "Query too long" }, { status: 400 });
  }

  try {
    const repo = DIContainer.getBookingRepository();
    const offset = (page - 1) * limit;

    // 4. Execute parallel queries (results + total count)
    const [results, total] = await Promise.all([
      repo.searchBookings(q, offset, limit),
      repo.countBookings(q),
    ]);

    // 5. Return paginated response
    return NextResponse.json({
      results,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    console.error("Error searching bookings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

#### 3.3 Repository Methods
```typescript
// app/lib/repository/booking/booking.repository.ts

async searchBookings(q: string, offset: number, limit: number): Promise<BookingSearchDTO[]> {
  const query = `%${q}%`;
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT
      fr.id_reserva as id,
      fr.nombre_huesped_ref as guest_name,
      dm.nombre_canal as channel_name,
      fr.fecha_checkin_fk as check_in,
      fr.fecha_checkout_fk as check_out,
      fr.estado_reserva as status
    FROM fact_reservas fr
    INNER JOIN dim_canales dm ON dm.id_canal = fr.id_canal_fk
    WHERE fr.nombre_huesped_ref LIKE ? 
      OR dm.nombre_canal LIKE ?
      OR fr.tel_huesped LIKE ?
    ORDER BY fr.fecha_checkin_fk DESC
    LIMIT ? OFFSET ?`,
    [query, query, query, limit, offset],
  );
  return rows as BookingSearchDTO[];
}

async countBookings(q: string): Promise<number> {
  const query = `%${q}%`;
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) as total FROM fact_reservas fr
    INNER JOIN dim_canales dm ON dm.id_canal = fr.id_canal_fk
    WHERE fr.nombre_huesped_ref LIKE ? 
      OR dm.nombre_canal LIKE ?
      OR fr.tel_huesped LIKE ?`,
    [query, query, query],
  );
  return (rows[0] as any).total || 0;
}

async updateGoogleEventId(bookingId: number, eventId: string): Promise<void> {
  await pool.execute(
    "UPDATE fact_reservas SET google_event_id = ? WHERE id_reserva = ?",
    [eventId, bookingId],
  );
}
```

#### 3.4 Frontend Integration
```typescript
// Hook for search functionality
export function useBookingSearch() {
  const [results, setResults] = useState<BookingSearchDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const search = async (q: string, newPage = 1) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/booking/search-v2?q=${encodeURIComponent(q)}&page=${newPage}&limit=20`,
      );
      const data = await res.json();
      setResults(data.results);
      setPage(newPage);
      setTotal(data.pagination.total);
      setHasMore(data.pagination.hasMore);
    } finally {
      setIsLoading(false);
    }
  };

  return { results, isLoading, page, total, hasMore, search };
}
```

---

### 4. Calendar Service Updates

#### 4.1 Create Function
```typescript
export async function createGoogleCalendarEvent(
  params: CalendarEventParams,
): Promise<{ success: boolean; link?: string | null; eventId?: string }> {
  if (!isCalendarEnabled()) {
    return { success: true };
  }

  try {
    // ... existing code ...
    
    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
    });

    // ✨ NEW: Return eventId
    return { 
      success: true, 
      link: response.data.htmlLink,
      eventId: response.data.id,  // <- NEW
    };
  } catch (error) {
    // ... error handling ...
  }
}
```

#### 4.2 Update Function
```typescript
export async function updateGoogleCalendarEvent(
  params: CalendarEventParams & { googleEventId?: string },  // ← NEW parameter
): Promise<{ success: boolean; link?: string | null; message?: string }> {
  if (!isCalendarEnabled()) {
    return { success: true };
  }

  try {
    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    if (!calendarId) throw new Error("GOOGLE_CALENDAR_ID no definido");

    const calendar = google.calendar({ version: "v3", auth: createAuth() });

    // ✨ CHANGED: Use googleEventId directly (no list search)
    const eventId = params.googleEventId;
    if (!eventId) {
      return { success: false, message: "google_event_id no disponible" };
    }

    const eventPatch = {
      summary: `${params.nombreCliente}-${params.idBooking}`,
      description: buildDescription(params),
      colorId: getColorId(params.estado),
      start: { /* ... */ },
      end: { /* ... */ },
      attendees: params.emailCliente ? [{ email: params.emailCliente }] : undefined,
    };

    const response = await calendar.events.patch({
      calendarId,
      eventId,  // ← Direct lookup, no search!
      requestBody: eventPatch,
    });

    return { success: true, link: response.data.htmlLink };
  } catch (error) {
    // ... error handling ...
  }
}
```

#### 4.3 Delete Function
```typescript
export async function deleteGoogleCalendarEvent(
  googleEventId: string,  // ← CHANGED: Accept eventId directly
): Promise<{ success: boolean; message?: string }> {
  if (!isCalendarEnabled()) {
    return { success: true };
  }

  try {
    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    if (!calendarId) throw new Error("GOOGLE_CALENDAR_ID no definido");

    const calendar = google.calendar({ version: "v3", auth: createAuth() });

    // ✨ CHANGED: Direct delete using eventId (no list search)
    await calendar.events.delete({
      calendarId,
      eventId: googleEventId,  // ← Direct, no search!
    });

    return { success: true };
  } catch (error) {
    // ... error handling ...
  }
}
```

---

### 5. Booking Actions Updates

#### 5.1 Create Booking
```typescript
export async function createBooking(
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  try {
    // ... existing validation ...

    const bookingId = await DIContainer.getBookingRepository().createBooking(booking);

    try {
      // Create calendar event
      const result = await createGoogleCalendarEvent({ /* ... */ });
      
      // ✨ NEW: Persist eventId to DB
      if (result.eventId && bookingId) {
        await DIContainer.getBookingRepository().updateGoogleEventId(
          bookingId,
          result.eventId,
        );
      }
    } catch (calendarError) {
      console.error("Calendar create error:", calendarError);
      // Continue even if calendar fails (graceful degradation)
    }

    revalidatePath("/bookings/create");
    return { success: true, message: "Reserva creada exitosamente" };
  } catch (error) {
    // ... error handling ...
  }
}
```

#### 5.2 Update Booking
```typescript
export async function updateBooking(
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  try {
    // ... existing validation ...

    const oldBooking = await DIContainer.getBookingRepository().getBooking(bookingId);
    
    await DIContainer.getBookingRepository().updateBooking(booking);

    if (oldBooking?.google_event_id) {  // ← Use stored event_id
      try {
        await updateGoogleCalendarEvent({
          // ... other params ...
          idBooking: bookingId,
          googleEventId: oldBooking.google_event_id,  // ← Pass eventId
        });
      } catch (calendarError) {
        console.error("Calendar update error:", calendarError);
      }
    }

    revalidatePath("/bookings/create");
    return { success: true, message: "Reserva actualizada exitosamente" };
  } catch (error) {
    // ... error handling ...
  }
}
```

#### 5.3 Delete Booking
```typescript
export async function deleteBooking(
  bookingId: number,
): Promise<{ success: boolean; message: string }> {
  try {
    const booking = await DIContainer.getBookingRepository().getBooking(bookingId);

    if (booking?.google_event_id) {  // ← Use stored event_id
      try {
        await deleteGoogleCalendarEvent(booking.google_event_id);  // ← Direct delete
      } catch (calendarError) {
        console.error("Calendar delete error:", calendarError);
      }
    }

    await DIContainer.getBookingRepository().deleteBooking(bookingId);
    revalidatePath("/bookings/create");

    return { success: true, message: "Reserva eliminada exitosamente" };
  } catch (error) {
    // ... error handling ...
  }
}
```

---

## II. TESTING REQUIREMENTS

### Unit Tests

#### 2.1 Repository Tests
```typescript
// Tests for searchBookings
describe('BookingRepository.searchBookings', () => {
  it('should return paginated results', async () => {
    const results = await repo.searchBookings('juan', 0, 20);
    expect(results.length).toBeLessThanOrEqual(20);
  });

  it('should search by guest name', async () => {
    const results = await repo.searchBookings('Maria', 0, 20);
    expect(results.some(r => r.guest_name.includes('Maria'))).toBe(true);
  });

  it('should search by channel name', async () => {
    const results = await repo.searchBookings('Booking', 0, 20);
    expect(results.length).toBeGreaterThan(0);
  });

  it('should respect offset/limit', async () => {
    const page1 = await repo.searchBookings('', 0, 10);
    const page2 = await repo.searchBookings('', 10, 10);
    expect(page1[0].id).not.toBe(page2[0].id);
  });
});

// Tests for updateGoogleEventId
describe('BookingRepository.updateGoogleEventId', () => {
  it('should store event_id', async () => {
    await repo.updateGoogleEventId(1, 'abc123');
    const booking = await repo.getBooking(1);
    expect(booking.google_event_id).toBe('abc123');
  });

  it('should reject duplicate event_id (UNIQUE constraint)', async () => {
    await repo.updateGoogleEventId(1, 'abc123');
    expect(() => repo.updateGoogleEventId(2, 'abc123')).rejects.toThrow();
  });
});
```

#### 2.2 Calendar Service Tests
```typescript
describe('Calendar Service', () => {
  it('should return eventId on create', async () => {
    const result = await createGoogleCalendarEvent({ /* ... */ });
    expect(result.eventId).toBeDefined();
    expect(result.eventId).toMatch(/^[a-zA-Z0-9_-]+$/);
  });

  it('should update event using eventId (no search)', async () => {
    const updateSpy = jest.spyOn(calendar.events, 'patch');
    await updateGoogleCalendarEvent({ 
      googleEventId: 'known-id',
      // ...
    });
    // Verify patch was called with eventId directly
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: 'known-id',
      })
    );
  });

  it('should delete event using eventId (no search)', async () => {
    const deleteSpy = jest.spyOn(calendar.events, 'delete');
    await deleteGoogleCalendarEvent('known-id');
    // Verify delete was called with eventId directly
    expect(deleteSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: 'known-id',
      })
    );
  });
});
```

### Integration Tests

#### 2.3 API Integration
```typescript
describe('GET /api/booking/search-v2', () => {
  it('should return paginated results', async () => {
    const res = await fetch('/api/booking/search-v2?q=test&page=1&limit=20');
    const data = await res.json();
    expect(data.pagination.page).toBe(1);
    expect(data.pagination.limit).toBe(20);
    expect(data.results.length).toBeLessThanOrEqual(20);
  });

  it('should handle pagination correctly', async () => {
    const page1 = await fetch('/api/booking/search-v2?q=&page=1&limit=10');
    const page2 = await fetch('/api/booking/search-v2?q=&page=2&limit=10');
    expect(page1.pagination.total).toBe(page2.pagination.total);
    expect(page1.results[0].id).not.toBe(page2.results[0].id);
  });
});
```

---

## III. MIGRATION & DEPLOYMENT

### Database Migration Strategy
1. Create migration script in `app/lib/db/migrations/`
2. Test migration on staging replica
3. Backup production DB
4. Execute migration during low-traffic window (2am UTC)
5. Verify index creation success
6. Deploy application code

### Rollback Plan
- If index creation fails: Drop index, retry
- If event_id lookup fails: Fallback to event list search
- If search API breaks: Keep old endpoint `/api/booking/search` active

---

## IV. CONFIGURATION & ENV VARS

No new environment variables needed.

---

## V. SIGN-OFF CHECKLIST

- [ ] Proposal reviewed and approved
- [ ] Specification complete and verified
- [ ] Design document ready
- [ ] Tasks created and estimated
- [ ] Migration script tested
- [ ] Tests written and passing
- [ ] Code review completed
- [ ] Staging deployment successful
- [ ] Production deployment scheduled

