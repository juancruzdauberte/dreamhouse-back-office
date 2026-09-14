# TASKS: Phase 1 Database & Search Optimization

**Change Name:** `optimize-phase-1-db-search`  
**Status:** Tasks (Ready for Implementation)  
**Total Effort:** 5 hours  
**Review Budget:** 400 lines  

---

## TASK BREAKDOWN

### Task 1: Database Migrations
**Effort:** 1 hour  
**Owner:** Backend  
**Blockers:** None  

#### 1.1 Create migration: 001_add_google_event_id.sql
```
Location: app/lib/db/migrations/001_add_google_event_id.sql

CONTENT:
ALTER TABLE fact_reservas 
ADD COLUMN google_event_id VARCHAR(255) 
UNIQUE 
NOT NULL DEFAULT NULL 
AFTER precio_total_cotizado_ars;

CREATE INDEX idx_google_event_id ON fact_reservas(google_event_id);

Status: [ ] TODO
```

**Acceptance Criteria:**
- [ ] Column added to fact_reservas
- [ ] Column is VARCHAR(255)
- [ ] UNIQUE constraint enforced
- [ ] Index created on column
- [ ] Existing rows have NULL (no breaking changes)
- [ ] Test run successful on staging

#### 1.2 Create migration: 002_add_composite_indices.sql
```
Location: app/lib/db/migrations/002_add_composite_indices.sql

CONTENT:
ALTER TABLE fact_reservas 
ADD INDEX idx_analisis_completo (
  estado_reserva,
  id_canal_fk,
  fecha_checkin_fk
);

Status: [ ] TODO
```

**Acceptance Criteria:**
- [ ] Index created with correct column order
- [ ] Index creation completes in < 30 seconds
- [ ] No downtime during creation
- [ ] Index is used by optimizer (EXPLAIN shows idx_analisis_completo)

#### 1.3 Create migration runner script
```
Location: app/lib/db/run-migrations.ts

STATUS: [ ] TODO
```

**Acceptance Criteria:**
- [ ] Script is idempotent (safe to run multiple times)
- [ ] Checks schema version
- [ ] Only runs new migrations
- [ ] Logs all operations
- [ ] Exits with proper code on error

---

### Task 2: DTO & Type Updates
**Effort:** 1 hour  
**Owner:** Backend  
**Blockers:** Task 1 (migrations)  

#### 2.1 Update BookingDTO
```
Location: app/lib/repository/booking/booking.dto.ts

CHANGES:
+ google_event_id?: string | null;

Status: [ ] TODO
```

**Acceptance Criteria:**
- [ ] Field added to BookingDTO
- [ ] Field added to CreateBookingDTO
- [ ] Field added to UpdateBookingDTO
- [ ] TypeScript compiles without errors
- [ ] No breaking changes (field is optional)

#### 2.2 Update CalendarEventParams interface
```
Location: app/lib/services/calendar.service.ts

CHANGES:
+ export interface CalendarEventParams {
+   googleEventId?: string;  // NEW
    // ... existing fields
  }

Status: [ ] TODO
```

**Acceptance Criteria:**
- [ ] New field added to interface
- [ ] TypeScript compiles
- [ ] All existing code still type-checks

#### 2.3 Update function return types
```
Location: app/lib/services/calendar.service.ts

CHANGES:
- createGoogleCalendarEvent(): { success: boolean; link?: string }
+ createGoogleCalendarEvent(): { success: boolean; link?: string; eventId?: string }

- deleteGoogleCalendarEvent(idBooking: number)
+ deleteGoogleCalendarEvent(googleEventId: string)

Status: [ ] TODO
```

**Acceptance Criteria:**
- [ ] Return types updated
- [ ] Function signatures match specification
- [ ] TypeScript compiles
- [ ] All callers updated to match new signatures

---

### Task 3: Repository Methods
**Effort:** 1 hour  
**Owner:** Backend  
**Blockers:** Task 2  

#### 3.1 Add updateGoogleEventId method
```
Location: app/lib/repository/booking/booking.repository.ts

CODE:
async updateGoogleEventId(bookingId: number, eventId: string): Promise<void> {
  await pool.execute(
    "UPDATE fact_reservas SET google_event_id = ? WHERE id_reserva = ?",
    [eventId, bookingId],
  );
}

Status: [ ] TODO
```

**Acceptance Criteria:**
- [ ] Method exists in BookingRepository
- [ ] Properly executes UPDATE query
- [ ] Handles errors appropriately
- [ ] Unit test passes

#### 3.2 Add searchBookings method (paginated)
```
Location: app/lib/repository/booking/booking.repository.ts

CODE:
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

Status: [ ] TODO
```

**Acceptance Criteria:**
- [ ] Method exists
- [ ] Returns paginated results
- [ ] Searches guest_name, channel_name, phone
- [ ] Returns results in DESC chronological order
- [ ] Unit test passes

#### 3.3 Add countBookings method
```
Location: app/lib/repository/booking/booking.repository.ts

CODE:
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

Status: [ ] TODO
```

**Acceptance Criteria:**
- [ ] Method exists
- [ ] Returns accurate count
- [ ] Uses same WHERE clause as searchBookings
- [ ] Unit test passes

#### 3.4 Update getBooking to include google_event_id
```
Location: app/lib/repository/booking/booking.repository.ts

CHANGE:
SELECT
  ...
  fr.google_event_id as google_event_id  // ADD THIS
  ...

Status: [ ] TODO
```

**Acceptance Criteria:**
- [ ] Column included in SELECT
- [ ] Returned in BookingDTO
- [ ] All existing callers work unchanged

---

### Task 4: Calendar Service Updates
**Effort:** 1.5 hours  
**Owner:** Backend  
**Blockers:** Task 3  

#### 4.1 Update createGoogleCalendarEvent to return eventId
```
Location: app/lib/services/calendar.service.ts

CHANGES:
const response = await calendar.events.insert({...});
return { 
  success: true, 
  link: response.data.htmlLink,
  eventId: response.data.id  // ADD THIS
};

Status: [ ] TODO
```

**Acceptance Criteria:**
- [ ] Function returns eventId
- [ ] eventId matches Google Calendar event ID format
- [ ] Unit test passes
- [ ] Error handling still works

#### 4.2 Update updateGoogleCalendarEvent to use eventId (no search)
```
Location: app/lib/services/calendar.service.ts

CHANGES (REMOVE):
const listResponse = await calendar.events.list({
  calendarId,
  q: idBooking?.toString(),
});
const eventToUpdate = (listResponse.data.items ?? []).find(
  (e) => e.summary?.endsWith(`-${idBooking}`),
);

CHANGES (ADD):
const eventId = params.googleEventId;
if (!eventId) {
  return { success: false, message: "google_event_id no disponible" };
}

PATCH CALL:
const response = await calendar.events.patch({
  calendarId,
  eventId,  // DIRECT, no search
  requestBody: eventPatch,
});

Status: [ ] TODO
```

**Acceptance Criteria:**
- [ ] No list() call (direct PATCH with eventId)
- [ ] Falls back to list() search if eventId is null (backward compat)
- [ ] API call count reduced from 2 to 1
- [ ] Unit test passes
- [ ] Integration test passes

#### 4.3 Update deleteGoogleCalendarEvent to use eventId (no search)
```
Location: app/lib/services/calendar.service.ts

CHANGES (REMOVE OLD):
const listResponse = await calendar.events.list({
  calendarId,
  q: idBooking.toString(),
});
const eventToDelete = (listResponse.data.items ?? []).find(
  (e) => e.summary?.endsWith(`-${idBooking}`),
);

CHANGES (NEW):
export async function deleteGoogleCalendarEvent(
  googleEventId: string,  // CHANGED parameter
): Promise<...> {
  if (!googleEventId) {
    return { success: false, message: "google_event_id no disponible" };
  }

  await calendar.events.delete({
    calendarId,
    eventId: googleEventId,  // DIRECT, no search
  });
}

Status: [ ] TODO
```

**Acceptance Criteria:**
- [ ] Function signature changed from (idBooking: number) to (googleEventId: string)
- [ ] No list() call (direct DELETE with eventId)
- [ ] API call count reduced from 2 to 1
- [ ] Error handling works
- [ ] Unit test passes
- [ ] All callers updated

---

### Task 5: Booking Actions Updates
**Effort:** 0.5 hours  
**Owner:** Backend  
**Blockers:** Task 4  

#### 5.1 Update createBooking to persist eventId
```
Location: app/lib/actions/booking.actions.ts

CHANGES:
try {
  const result = await createGoogleCalendarEvent({...});
  
  // NEW: Persist eventId to DB
  if (result.eventId && bookingId) {
    await DIContainer.getBookingRepository().updateGoogleEventId(
      bookingId,
      result.eventId,
    );
  }
} catch (calendarError) {
  console.error("Calendar error:", calendarError);
  // Continue even if calendar fails
}

Status: [ ] TODO
```

**Acceptance Criteria:**
- [ ] eventId is persisted to DB after creation
- [ ] Graceful degradation if calendar fails
- [ ] No breaking changes
- [ ] Unit test passes

#### 5.2 Update updateBooking to use stored eventId
```
Location: app/lib/actions/booking.actions.ts

CHANGES (OLD):
await updateGoogleCalendarEvent(calendarParams);

CHANGES (NEW):
const calendarParams: CalendarEventParams = {
  ...
  googleEventId: oldBooking?.google_event_id,  // ADD THIS
};
await updateGoogleCalendarEvent(calendarParams);

Status: [ ] TODO
```

**Acceptance Criteria:**
- [ ] Passes stored eventId to calendar service
- [ ] Uses direct PATCH instead of list search
- [ ] No breaking changes
- [ ] Unit test passes

#### 5.3 Update deleteBooking to use stored eventId
```
Location: app/lib/actions/booking.actions.ts

CHANGES (OLD):
await deleteGoogleCalendarEvent(bookingId);

CHANGES (NEW):
if (booking?.google_event_id) {
  await deleteGoogleCalendarEvent(booking.google_event_id);  // PASS eventId
}

Status: [ ] TODO
```

**Acceptance Criteria:**
- [ ] Passes stored eventId to calendar service
- [ ] Function signature matches new deleteGoogleCalendarEvent
- [ ] Handles null eventId gracefully
- [ ] Unit test passes

---

### Task 6: Search API Endpoint
**Effort:** 1 hour  
**Owner:** Backend  
**Blockers:** Task 3  

#### 6.1 Create new endpoint: GET /api/booking/search-v2
```
Location: app/api/booking/search-v2/route.ts

CODE:
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { DIContainer } from "../../../core/DiContainer";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));

  if (q.length > 255) {
    return NextResponse.json({ error: "Query too long" }, { status: 400 });
  }

  try {
    const repo = DIContainer.getBookingRepository();
    const offset = (page - 1) * limit;

    const [results, total] = await Promise.all([
      repo.searchBookings(q, offset, limit),
      repo.countBookings(q),
    ]);

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

Status: [ ] TODO
```

**Acceptance Criteria:**
- [ ] Endpoint exists at /api/booking/search-v2
- [ ] Requires authentication
- [ ] Validates query parameters
- [ ] Returns paginated results
- [ ] Returns correct pagination metadata
- [ ] Handles empty query gracefully
- [ ] Unit test passes
- [ ] Integration test passes

---

### Task 7: Testing
**Effort:** 0.5 hours  
**Owner:** QA  
**Blockers:** All tasks above  

#### 7.1 Unit Tests
```
Files to create/update:
- app/lib/repository/booking/__tests__/booking.repository.test.ts
- app/lib/services/__tests__/calendar.service.test.ts
- app/api/booking/search-v2/__tests__/route.test.ts

Status: [ ] TODO

Tests needed:
- searchBookings: returns paginated results
- searchBookings: searches all three fields
- countBookings: returns accurate count
- updateGoogleEventId: stores eventId
- createGoogleCalendarEvent: returns eventId
- updateGoogleCalendarEvent: uses direct eventId (no search)
- deleteGoogleCalendarEvent: uses direct eventId (no search)
- Search API: returns paginated response
- Search API: handles authentication
```

**Acceptance Criteria:**
- [ ] All unit tests pass (100% coverage)
- [ ] All integration tests pass
- [ ] No TypeScript errors
- [ ] Linter passes

#### 7.2 Database Testing
```
Tests needed:
- Migration 001: google_event_id column created correctly
- Migration 002: Composite index created and used
- Existing data unaffected (no rows deleted)
- UNIQUE constraint works

Status: [ ] TODO
```

**Acceptance Criteria:**
- [ ] Migrations work on staging replica
- [ ] Migrations are idempotent
- [ ] No data loss
- [ ] Index is used by optimizer

#### 7.3 Performance Benchmarks
```
Benchmarks to run:
- Dashboard query: should be < 10ms (was ~2000ms)
- Search API: should be < 100ms per page
- Google API calls: should be reduced 50%

Status: [ ] TODO
```

**Acceptance Criteria:**
- [ ] Dashboard query improved 100x
- [ ] Search API fast (< 100ms)
- [ ] Google API calls reduced from 300 to 150/month

---

## TASK DEPENDENCIES

```
Task 1 (Migrations)
  └─→ Task 2 (DTOs)
       └─→ Task 3 (Repository)
            ├─→ Task 4 (Calendar Service)
            │    └─→ Task 5 (Booking Actions)
            │         └─→ Task 7 (Testing)
            └─→ Task 6 (Search API)
                 └─→ Task 7 (Testing)
```

---

## IMPLEMENTATION TIMELINE

| Day | Tasks | Hours | Owner |
|-----|-------|-------|-------|
| Day 1 | 1, 2 | 2h | Backend |
| Day 2 | 3, 4 | 2.5h | Backend |
| Day 2 | 5, 6 | 1.5h | Backend |
| Day 3 | 7 | 0.5h | QA |

**Total: 5 hours**

---

## SIGN-OFF CHECKLIST

Implementation:
- [ ] All tasks completed
- [ ] Code follows project conventions
- [ ] No linter errors
- [ ] TypeScript compiles
- [ ] All tests pass

Testing:
- [ ] Unit tests: 100% pass
- [ ] Integration tests: 100% pass
- [ ] Performance benchmarks met
- [ ] Staging deployment successful
- [ ] No regressions in existing features

Deployment:
- [ ] Code review approved
- [ ] Database migrations verified
- [ ] Rollback plan ready
- [ ] Monitoring configured
- [ ] Production deployment scheduled

---

**Tasks Ready for Implementation** ✅
