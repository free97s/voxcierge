-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Generic updated_at trigger function
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply updated_at trigger to tasks
CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Apply updated_at trigger to profiles
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Apply updated_at trigger to subscriptions
CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Auto-create profile row when a new auth.users record is inserted
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Record task history when a task's status changes
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION record_task_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action TEXT;
BEGIN
  -- Determine the action label from the new status
  v_action := CASE NEW.status
    WHEN 'completed'  THEN 'completed'
    WHEN 'postponed'  THEN 'postponed'
    WHEN 'cancelled'  THEN 'cancelled'
    WHEN 'in_progress' THEN 'updated'
    ELSE 'updated'
  END;

  -- On INSERT, always record a 'created' event
  IF TG_OP = 'INSERT' THEN
    INSERT INTO task_history (task_id, user_id, action, previous_status, new_status, metadata)
    VALUES (NEW.id, NEW.user_id, 'created', NULL, NEW.status, '{}'::jsonb);
    RETURN NEW;
  END IF;

  -- On UPDATE, only record when status actually changes
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO task_history (task_id, user_id, action, previous_status, new_status, metadata)
    VALUES (
      NEW.id,
      NEW.user_id,
      v_action,
      OLD.status,
      NEW.status,
      jsonb_build_object(
        'changed_at', now(),
        'postponed_until', NEW.postponed_until
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_tasks_record_history
  AFTER INSERT OR UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION record_task_history();

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Increment (upsert) a usage metric for a given user / metric / month
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id     UUID,
  p_metric_type TEXT,
  p_value       NUMERIC
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO usage_metrics (user_id, metric_type, value, period_month)
  VALUES (
    p_user_id,
    p_metric_type,
    p_value,
    date_trunc('month', now())::date
  )
  ON CONFLICT (user_id, metric_type, period_month)
  DO UPDATE SET value = usage_metrics.value + EXCLUDED.value;
END;
$$;
