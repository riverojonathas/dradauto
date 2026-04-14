-- ==============================================================================
-- PLANO 5A: Alteração de Schema para Integração Google Calendar (dradauto)
-- Execute este script no SQL Editor do Dashboard do Supabase.
-- ==============================================================================

-- Tokens OAuth e configurações Google por clínica
ALTER TABLE clinics
  ADD COLUMN IF NOT EXISTS google_connected        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS google_access_token     TEXT,
  ADD COLUMN IF NOT EXISTS google_refresh_token    TEXT,
  ADD COLUMN IF NOT EXISTS google_token_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS google_calendar_id      TEXT NOT NULL DEFAULT 'primary',
  ADD COLUMN IF NOT EXISTS working_hours_start     TIME NOT NULL DEFAULT '08:00',
  ADD COLUMN IF NOT EXISTS working_hours_end       TIME NOT NULL DEFAULT '18:00',
  ADD COLUMN IF NOT EXISTS working_days            INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5}';
  -- working_days: 0=Dom, 1=Seg, ..., 6=Sáb

-- Índice para busca por token (futuro: revogação em massa)
CREATE INDEX IF NOT EXISTS idx_clinics_google_connected
  ON clinics(google_connected) WHERE google_connected = true;
