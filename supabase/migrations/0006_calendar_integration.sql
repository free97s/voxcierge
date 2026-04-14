-- ─────────────────────────────────────────────────────────────────────────────
-- Calendar Integration Migration
-- Tables: calendar_connections, calendar_events
-- ─────────────────────────────────────────────────────────────────────────────

-- 캘린더 연동 계정
CREATE TABLE IF NOT EXISTS calendar_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'outlook')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  calendar_id TEXT, -- 기본 캘린더 ID
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- 동기화된 캘린더 이벤트 (캐시)
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES calendar_connections(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL, -- Google/Outlook event ID
  title TEXT NOT NULL,
  description TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  location TEXT,
  is_all_day BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'confirmed',
  source_provider TEXT NOT NULL,
  raw_data JSONB,
  synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(connection_id, external_id)
);

-- calendar_connections RLS
ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own connections" ON calendar_connections
  FOR ALL USING (auth.uid() = user_id);

-- calendar_events RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own events" ON calendar_events
  FOR ALL USING (auth.uid() = user_id);

-- 인덱스
CREATE INDEX idx_calendar_events_user_time ON calendar_events(user_id, start_at, end_at);
CREATE INDEX idx_calendar_connections_user ON calendar_connections(user_id);

-- updated_at 트리거
CREATE TRIGGER update_calendar_connections_updated_at
  BEFORE UPDATE ON calendar_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
