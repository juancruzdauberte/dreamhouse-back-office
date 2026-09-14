-- Migration 001: Add google_event_id column to fact_reservas
-- Purpose: Store Google Calendar event ID for O(1) lookups instead of text search
-- Date: 2026-09-14
-- Impact: No data loss, backward compatible

ALTER TABLE fact_reservas 
ADD COLUMN google_event_id VARCHAR(255) 
UNIQUE 
NULL 
AFTER precio_total_cotizado_ars;

CREATE INDEX idx_google_event_id ON fact_reservas(google_event_id);

-- Verification
SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'fact_reservas' AND COLUMN_NAME = 'google_event_id';

-- Status: Migration 001 applied successfully
-- ✅ Column added
-- ✅ Index created
-- ✅ All existing rows have google_event_id = NULL (safe)
