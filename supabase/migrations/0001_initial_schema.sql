-- organizations (Enterprise tier)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  tier TEXT NOT NULL DEFAULT 'enterprise' CHECK (tier IN ('enterprise')),
  created_at TIMESTAMPTZ DEFAULT now(),
  settings JSONB DEFAULT '{}'::jsonb
);

-- profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  tier TEXT NOT NULL DEFAULT 'personal' CHECK (tier IN ('personal', 'professional', 'enterprise')),
  org_id UUID REFERENCES organizations(id),
  timezone TEXT DEFAULT 'Asia/Seoul',
  locale TEXT DEFAULT 'ko',
  briefing_time_morning TIME DEFAULT '07:00:00',
  briefing_time_evening TIME DEFAULT '20:00:00',
  briefing_enabled BOOLEAN DEFAULT true,
  agent_persona JSONB DEFAULT '{}'::jsonb,
  encryption_key_hint TEXT,
  push_subscription JSONB,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- voice_sessions
CREATE TABLE voice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'recording' CHECK (status IN ('recording', 'processing', 'transcribed', 'analyzed', 'failed', 'deleted')),
  audio_storage_path TEXT,
  audio_deleted_at TIMESTAMPTZ,
  duration_seconds NUMERIC(8,2),
  raw_transcript TEXT,
  encrypted_transcript BYTEA,
  whisper_language TEXT DEFAULT 'ko',
  stt_method TEXT CHECK (stt_method IN ('whisper', 'webspeech', 'hybrid')),
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- intent_extractions
CREATE TABLE intent_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES voice_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  raw_text TEXT NOT NULL,
  intent_type TEXT CHECK (intent_type IN ('task', 'note', 'reminder', 'query', 'unknown')),
  extracted_action TEXT,
  extracted_person TEXT,
  extracted_place TEXT,
  extracted_time TIMESTAMPTZ,
  extracted_time_raw TEXT,
  confidence NUMERIC(4,3),
  model_used TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id),
  session_id UUID REFERENCES voice_sessions(id),
  intent_id UUID REFERENCES intent_extractions(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'postponed', 'cancelled')),
  priority INTEGER DEFAULT 2 CHECK (priority BETWEEN 1 AND 5),
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  postponed_until TIMESTAMPTZ,
  person TEXT,
  place TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- task_history
CREATE TABLE task_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'completed', 'postponed', 'cancelled', 'checkin_sent', 'checkin_responded')),
  previous_status TEXT,
  new_status TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- briefings
CREATE TABLE briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('morning', 'evening', 'adhoc')),
  content TEXT NOT NULL,
  tts_url TEXT,
  tts_deleted_at TIMESTAMPTZ,
  tasks_summary JSONB,
  model_used TEXT,
  generated_at TIMESTAMPTZ DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ
);

-- insights
CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  productive_days TEXT[],
  productive_times JSONB,
  task_categories JSONB,
  completion_rate NUMERIC(4,3),
  recommendations JSONB,
  model_used TEXT,
  generated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, period_start, period_end)
);

-- checkin_events
CREATE TABLE checkin_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ,
  response_action TEXT CHECK (response_action IN ('completed', 'postponed', 'cancelled', 'ignored')),
  postponed_until TIMESTAMPTZ,
  channel TEXT CHECK (channel IN ('push', 'email', 'in_app'))
);

-- subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  status TEXT CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'paused')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- usage_metrics
CREATE TABLE usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  metric_type TEXT NOT NULL CHECK (metric_type IN ('voice_minutes', 'transcriptions', 'ai_calls', 'briefings', 'storage_mb')),
  value NUMERIC NOT NULL,
  period_month DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, metric_type, period_month)
);

-- Performance indexes
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX idx_tasks_due_at ON tasks(due_at) WHERE status = 'pending';
CREATE INDEX idx_voice_sessions_user ON voice_sessions(user_id, created_at DESC);
CREATE INDEX idx_briefings_user_type ON briefings(user_id, type, generated_at DESC);
CREATE INDEX idx_checkin_events_pending ON checkin_events(user_id, sent_at) WHERE responded_at IS NULL;
