DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type type
    INNER JOIN pg_namespace namespace ON namespace.oid = type.typnamespace
    WHERE type.typname = 'product_scorecard_class'
      AND namespace.nspname = 'new_product_development'
  ) THEN
    CREATE TYPE new_product_development.product_scorecard_class AS ENUM (
      'A',
      'B',
      'C'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_type type
    INNER JOIN pg_namespace namespace ON namespace.oid = type.typnamespace
    WHERE type.typname = 'portfolio_review_status'
      AND namespace.nspname = 'new_product_development'
  ) THEN
    CREATE TYPE new_product_development.portfolio_review_status AS ENUM (
      'APPROVED',
      'DRAFT',
      'IN_REVIEW',
      'REJECTED'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_type type
    INNER JOIN pg_namespace namespace ON namespace.oid = type.typnamespace
    WHERE type.typname = 'revamp_eol_recommendation_outcome'
      AND namespace.nspname = 'new_product_development'
  ) THEN
    CREATE TYPE new_product_development.revamp_eol_recommendation_outcome AS ENUM (
      'EOL',
      'HOLD',
      'REVAMP'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_type type
    INNER JOIN pg_namespace namespace ON namespace.oid = type.typnamespace
    WHERE type.typname = 'revamp_eol_decision'
      AND namespace.nspname = 'new_product_development'
  ) THEN
    CREATE TYPE new_product_development.revamp_eol_decision AS ENUM (
      'APPROVED',
      'REJECTED'
    );
  END IF;
END $$;

ALTER TYPE new_product_development.audit_action
  ADD VALUE IF NOT EXISTS 'GM_COMMERCIAL_INPUT_RECORDED';

ALTER TYPE new_product_development.audit_action
  ADD VALUE IF NOT EXISTS 'COO_RECOMMENDATION_DECIDED';

CREATE TABLE IF NOT EXISTS new_product_development.product_scorecards (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES new_product_development.products (id) ON DELETE CASCADE,
  review_date DATE NOT NULL,
  sell_through_percent NUMERIC(5, 2) NOT NULL,
  gross_profit_percent NUMERIC(5, 2) NOT NULL,
  revenue NUMERIC(14, 2) NOT NULL,
  margin NUMERIC(14, 2) NOT NULL,
  complaint_count INTEGER NOT NULL,
  market_feedback_summary TEXT NOT NULL,
  notes TEXT NULL,
  classification new_product_development.product_scorecard_class NOT NULL,
  classification_reason TEXT NOT NULL,
  is_escalation_required BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT product_scorecards_sell_through_non_negative CHECK (sell_through_percent >= 0),
  CONSTRAINT product_scorecards_gp_non_negative CHECK (gross_profit_percent >= 0),
  CONSTRAINT product_scorecards_revenue_non_negative CHECK (revenue >= 0),
  CONSTRAINT product_scorecards_margin_non_negative CHECK (margin >= 0),
  CONSTRAINT product_scorecards_complaints_non_negative CHECK (complaint_count >= 0)
);

CREATE TABLE IF NOT EXISTS new_product_development.portfolio_updates (
  id UUID PRIMARY KEY,
  review_quarter TEXT NOT NULL,
  summary TEXT NOT NULL,
  coo_review_status new_product_development.portfolio_review_status NOT NULL DEFAULT 'DRAFT',
  rows JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT portfolio_updates_rows_array CHECK (jsonb_typeof(rows) = 'array')
);

CREATE TABLE IF NOT EXISTS new_product_development.revamp_eol_recommendations (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL UNIQUE REFERENCES new_product_development.products (id) ON DELETE CASCADE,
  trigger_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  root_cause_analysis TEXT NOT NULL,
  revamp_option TEXT NULL,
  eol_option TEXT NULL,
  hold_option TEXT NULL,
  recommendation_outcome new_product_development.revamp_eol_recommendation_outcome NOT NULL,
  recommendation_summary TEXT NOT NULL,
  gm_commercial_input TEXT NULL,
  gm_input_by_user_id UUID NULL REFERENCES new_product_development.users (id),
  gm_input_at TIMESTAMPTZ NULL,
  coo_decision new_product_development.revamp_eol_decision NULL,
  coo_decision_by_user_id UUID NULL REFERENCES new_product_development.users (id),
  coo_decision_at TIMESTAMPTZ NULL,
  coo_decision_comment TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT revamp_eol_trigger_reasons_array CHECK (jsonb_typeof(trigger_reasons) = 'array')
);

CREATE INDEX IF NOT EXISTS idx_product_scorecards_product_review_date
  ON new_product_development.product_scorecards (product_id, review_date DESC);

CREATE INDEX IF NOT EXISTS idx_product_scorecards_escalation
  ON new_product_development.product_scorecards (product_id, is_escalation_required)
  WHERE is_escalation_required = TRUE;

CREATE INDEX IF NOT EXISTS idx_portfolio_updates_review_quarter
  ON new_product_development.portfolio_updates (review_quarter DESC);

CREATE INDEX IF NOT EXISTS idx_revamp_eol_recommendations_product_id
  ON new_product_development.revamp_eol_recommendations (product_id);
