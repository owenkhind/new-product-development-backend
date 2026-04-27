DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type type
    INNER JOIN pg_namespace namespace ON namespace.oid = type.typnamespace
    WHERE type.typname = 'launch_issue_status'
      AND namespace.nspname = 'new_product_development'
  ) THEN
    CREATE TYPE new_product_development.launch_issue_status AS ENUM (
      'BLOCKED',
      'CRITICAL_ISSUE',
      'MINOR_ISSUE',
      'NO_ISSUE'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_type type
    INNER JOIN pg_namespace namespace ON namespace.oid = type.typnamespace
    WHERE type.typname = 'feedback_severity'
      AND namespace.nspname = 'new_product_development'
  ) THEN
    CREATE TYPE new_product_development.feedback_severity AS ENUM (
      'CRITICAL',
      'HIGH',
      'LOW',
      'MEDIUM'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_type type
    INNER JOIN pg_namespace namespace ON namespace.oid = type.typnamespace
    WHERE type.typname = 'feedback_source'
      AND namespace.nspname = 'new_product_development'
  ) THEN
    CREATE TYPE new_product_development.feedback_source AS ENUM (
      'CUSTOMER',
      'DEALER',
      'KD_AFTER_SALES',
      'MARKETING'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_type type
    INNER JOIN pg_namespace namespace ON namespace.oid = type.typnamespace
    WHERE type.typname = 'day_30_verdict'
      AND namespace.nspname = 'new_product_development'
  ) THEN
    CREATE TYPE new_product_development.day_30_verdict AS ENUM (
      'CONTINUE',
      'ESCALATE',
      'HOLD_PO',
      'OPTIMIZE'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS new_product_development.launch_confirmations (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL UNIQUE REFERENCES new_product_development.products (id) ON DELETE CASCADE,
  launch_date DATE NOT NULL,
  notes TEXT NULL,
  channels JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT launch_confirmations_channels_array CHECK (jsonb_typeof(channels) = 'array')
);

CREATE TABLE IF NOT EXISTS new_product_development.sell_in_reports (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES new_product_development.products (id) ON DELETE CASCADE,
  report_period_start DATE NOT NULL,
  report_period_end DATE NOT NULL,
  notes TEXT NULL,
  total_sell_in_units INTEGER NOT NULL,
  total_sell_in_value NUMERIC(14, 2) NOT NULL,
  accounts JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT sell_in_reports_period_order CHECK (report_period_end >= report_period_start),
  CONSTRAINT sell_in_reports_total_units_non_negative CHECK (total_sell_in_units >= 0),
  CONSTRAINT sell_in_reports_total_value_non_negative CHECK (total_sell_in_value >= 0),
  CONSTRAINT sell_in_reports_accounts_array CHECK (jsonb_typeof(accounts) = 'array')
);

CREATE TABLE IF NOT EXISTS new_product_development.weekly_feedback_logs (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES new_product_development.products (id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  summary TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT weekly_feedback_logs_items_array CHECK (jsonb_typeof(items) = 'array')
);

CREATE TABLE IF NOT EXISTS new_product_development.day_30_reviews (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL UNIQUE REFERENCES new_product_development.products (id) ON DELETE CASCADE,
  review_summary TEXT NOT NULL,
  target_sell_through_units INTEGER NOT NULL,
  actual_sell_through_units INTEGER NOT NULL,
  target_revenue NUMERIC(14, 2) NOT NULL,
  actual_revenue NUMERIC(14, 2) NOT NULL,
  verdict new_product_development.day_30_verdict NOT NULL,
  action_plan TEXT NOT NULL,
  flags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  channel_gp JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT day_30_reviews_target_units_non_negative CHECK (target_sell_through_units >= 0),
  CONSTRAINT day_30_reviews_actual_units_non_negative CHECK (actual_sell_through_units >= 0),
  CONSTRAINT day_30_reviews_target_revenue_non_negative CHECK (target_revenue >= 0),
  CONSTRAINT day_30_reviews_actual_revenue_non_negative CHECK (actual_revenue >= 0),
  CONSTRAINT day_30_reviews_channel_gp_array CHECK (jsonb_typeof(channel_gp) = 'array')
);

CREATE INDEX IF NOT EXISTS idx_launch_confirmations_product_id
  ON new_product_development.launch_confirmations (product_id);

CREATE INDEX IF NOT EXISTS idx_sell_in_reports_product_period
  ON new_product_development.sell_in_reports (product_id, report_period_start DESC);

CREATE INDEX IF NOT EXISTS idx_weekly_feedback_logs_product_week
  ON new_product_development.weekly_feedback_logs (product_id, week_start_date DESC);

CREATE INDEX IF NOT EXISTS idx_day_30_reviews_product_id
  ON new_product_development.day_30_reviews (product_id);
