-- Enable RLS on all tables
ALTER TABLE organizations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_sessions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE intent_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks              ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_history       ENABLE ROW LEVEL SECURITY;
ALTER TABLE briefings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights           ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_metrics      ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────
-- profiles
-- ─────────────────────────────────────────────
CREATE POLICY "profiles: owner select"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: owner insert"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: owner update"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: owner delete"
  ON profiles FOR DELETE
  USING (auth.uid() = id);

-- ─────────────────────────────────────────────
-- organizations
-- ─────────────────────────────────────────────
-- Any authenticated member whose profile.org_id matches can read
CREATE POLICY "organizations: member select"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT org_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Only service role can insert/update/delete organizations (no user-facing policy)

-- ─────────────────────────────────────────────
-- voice_sessions
-- ─────────────────────────────────────────────
CREATE POLICY "voice_sessions: owner select"
  ON voice_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "voice_sessions: owner insert"
  ON voice_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "voice_sessions: owner update"
  ON voice_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "voice_sessions: owner delete"
  ON voice_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- intent_extractions
-- ─────────────────────────────────────────────
CREATE POLICY "intent_extractions: owner select"
  ON intent_extractions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "intent_extractions: owner insert"
  ON intent_extractions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "intent_extractions: owner update"
  ON intent_extractions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "intent_extractions: owner delete"
  ON intent_extractions FOR DELETE
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- tasks
-- ─────────────────────────────────────────────
CREATE POLICY "tasks: owner select"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

-- Enterprise org members can read tasks that belong to their org
CREATE POLICY "tasks: org member select"
  ON tasks FOR SELECT
  USING (
    org_id IS NOT NULL
    AND org_id IN (
      SELECT org_id FROM profiles WHERE id = auth.uid() AND org_id IS NOT NULL
    )
  );

CREATE POLICY "tasks: owner insert"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tasks: owner update"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tasks: owner delete"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- task_history
-- ─────────────────────────────────────────────
CREATE POLICY "task_history: owner select"
  ON task_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "task_history: owner insert"
  ON task_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- task_history rows are immutable; no update/delete policies for users

-- ─────────────────────────────────────────────
-- briefings
-- ─────────────────────────────────────────────
CREATE POLICY "briefings: owner select"
  ON briefings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "briefings: owner insert"
  ON briefings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "briefings: owner update"
  ON briefings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "briefings: owner delete"
  ON briefings FOR DELETE
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- insights
-- ─────────────────────────────────────────────
CREATE POLICY "insights: owner select"
  ON insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "insights: owner insert"
  ON insights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "insights: owner update"
  ON insights FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "insights: owner delete"
  ON insights FOR DELETE
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- checkin_events
-- ─────────────────────────────────────────────
CREATE POLICY "checkin_events: owner select"
  ON checkin_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "checkin_events: owner insert"
  ON checkin_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "checkin_events: owner update"
  ON checkin_events FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "checkin_events: owner delete"
  ON checkin_events FOR DELETE
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- subscriptions
-- ─────────────────────────────────────────────
CREATE POLICY "subscriptions: owner select"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Insert/update/delete handled exclusively by service role (Stripe webhook handler)

-- ─────────────────────────────────────────────
-- usage_metrics
-- ─────────────────────────────────────────────
CREATE POLICY "usage_metrics: owner select"
  ON usage_metrics FOR SELECT
  USING (auth.uid() = user_id);

-- Insert/update handled exclusively by service role (server-side increment function)
