DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type type
    INNER JOIN pg_namespace namespace ON namespace.oid = type.typnamespace
    WHERE type.typname = 'gate_decision_outcome'
      AND namespace.nspname = 'new_product_development'
  ) THEN
    CREATE TYPE new_product_development.gate_decision_outcome AS ENUM (
      'SUBMITTED',
      'APPROVED',
      'REJECTED',
      'KILLED'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_type type
    INNER JOIN pg_namespace namespace ON namespace.oid = type.typnamespace
    WHERE type.typname = 'audit_action'
      AND namespace.nspname = 'new_product_development'
  ) THEN
    CREATE TYPE new_product_development.audit_action AS ENUM (
      'SUBMIT',
      'APPROVE',
      'REJECT',
      'KILL',
      'REOPEN',
      'BLOCK',
      'ARCHIVE',
      'QA_REVIEW_COMPLETED',
      'FINANCE_CONFIRMED',
      'GM_APPROVED'
    );
  END IF;
END $$;

ALTER TYPE new_product_development.product_status
  ADD VALUE IF NOT EXISTS 'KILLED';

ALTER TABLE new_product_development.gate_decisions
  ALTER COLUMN outcome TYPE TEXT;

UPDATE new_product_development.gate_decisions
SET outcome = CASE outcome
  WHEN 'SUBMIT' THEN 'SUBMITTED'
  WHEN 'APPROVE' THEN 'APPROVED'
  WHEN 'REJECT' THEN 'REJECTED'
  WHEN 'ARCHIVE' THEN 'KILLED'
  ELSE 'REJECTED'
END;

ALTER TABLE new_product_development.gate_decisions
  ALTER COLUMN outcome TYPE new_product_development.gate_decision_outcome
  USING outcome::new_product_development.gate_decision_outcome;

ALTER TABLE new_product_development.audit_logs
  ALTER COLUMN action TYPE TEXT;

ALTER TABLE new_product_development.audit_logs
  ALTER COLUMN action TYPE new_product_development.audit_action
  USING action::new_product_development.audit_action;

CREATE TABLE IF NOT EXISTS new_product_development.supplier_evaluations (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL UNIQUE REFERENCES new_product_development.products (id) ON DELETE CASCADE,
  summary TEXT NULL,
  scoring_methodology TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS new_product_development.supplier_evaluation_suppliers (
  id UUID PRIMARY KEY,
  supplier_evaluation_id UUID NOT NULL REFERENCES new_product_development.supplier_evaluations (id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL,
  supplier_name TEXT NOT NULL,
  factory_name TEXT NOT NULL,
  origin_country TEXT NOT NULL,
  moq INTEGER NOT NULL,
  lead_time_days INTEGER NOT NULL,
  payment_terms TEXT NOT NULL,
  tooling_notes TEXT NULL,
  spare_parts_support_notes TEXT NULL,
  weighted_score NUMERIC(5, 2) NOT NULL,
  is_qualified BOOLEAN NOT NULL DEFAULT FALSE,
  remarks TEXT NULL,
  CONSTRAINT supplier_evaluation_suppliers_moq_non_negative CHECK (moq >= 0),
  CONSTRAINT supplier_evaluation_suppliers_lead_time_non_negative CHECK (lead_time_days >= 0),
  CONSTRAINT supplier_evaluation_suppliers_weighted_score_non_negative CHECK (weighted_score >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_supplier_evaluation_suppliers_unique_order
  ON new_product_development.supplier_evaluation_suppliers (supplier_evaluation_id, display_order);

CREATE TABLE IF NOT EXISTS new_product_development.business_cases (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL UNIQUE REFERENCES new_product_development.products (id) ON DELETE CASCADE,
  market_opportunity_summary TEXT NOT NULL,
  product_summary TEXT NOT NULL,
  year_one_revenue NUMERIC(14, 2) NOT NULL,
  year_two_revenue NUMERIC(14, 2) NOT NULL,
  year_three_revenue NUMERIC(14, 2) NOT NULL,
  investment_needed NUMERIC(14, 2) NOT NULL,
  risk_summary TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  channel_gp_summary JSONB NOT NULL DEFAULT '[]'::jsonb,
  finance_notes TEXT NULL,
  commercial_notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT business_cases_year_one_revenue_non_negative CHECK (year_one_revenue >= 0),
  CONSTRAINT business_cases_year_two_revenue_non_negative CHECK (year_two_revenue >= 0),
  CONSTRAINT business_cases_year_three_revenue_non_negative CHECK (year_three_revenue >= 0),
  CONSTRAINT business_cases_investment_needed_non_negative CHECK (investment_needed >= 0)
);

CREATE TABLE IF NOT EXISTS new_product_development.gate_two_reviews (
  product_id UUID PRIMARY KEY REFERENCES new_product_development.products (id) ON DELETE CASCADE,
  qa_review_completed_at TIMESTAMPTZ NULL,
  qa_reviewed_by_user_id UUID NULL REFERENCES new_product_development.users (id),
  qa_comment TEXT NULL,
  finance_confirmed_at TIMESTAMPTZ NULL,
  finance_confirmed_by_user_id UUID NULL REFERENCES new_product_development.users (id),
  finance_comment TEXT NULL,
  gm_approved_at TIMESTAMPTZ NULL,
  gm_approved_by_user_id UUID NULL REFERENCES new_product_development.users (id),
  gm_comment TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_evaluations_product_id
  ON new_product_development.supplier_evaluations (product_id);

CREATE INDEX IF NOT EXISTS idx_business_cases_product_id
  ON new_product_development.business_cases (product_id);
