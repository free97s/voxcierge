-- ─────────────────────────────────────────────────────────────────────────────
-- daily_diaries table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_diaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  diary_date DATE NOT NULL,
  content TEXT NOT NULL, -- AI 생성 일기 텍스트 (마크다운)
  mood TEXT, -- 'great' | 'good' | 'neutral' | 'tired' | 'tough'
  highlights JSONB DEFAULT '[]', -- 주요 성과 배열
  stats JSONB DEFAULT '{}', -- { completed: N, added: N, postponed: N, voiceSessions: N }
  audio_url TEXT, -- TTS 오디오 URL (Supabase Storage)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, diary_date)
);

ALTER TABLE daily_diaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own diaries" ON daily_diaries
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_diaries_user_date ON daily_diaries(user_id, diary_date DESC);

CREATE TRIGGER update_daily_diaries_updated_at
  BEFORE UPDATE ON daily_diaries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
