DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type type
    INNER JOIN pg_namespace namespace ON namespace.oid = type.typnamespace
    WHERE type.typname = 'eol_milestone_status'
      AND namespace.nspname = 'new_product_development'
  ) THEN
    CREATE TYPE new_product_development.eol_milestone_status AS ENUM (
      'BLOCKED',
      'COMPLETED',
      'IN_PROGRESS',
      'NOT_STARTED'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_type type
    INNER JOIN pg_namespace namespace ON namespace.oid = type.typnamespace
    WHERE type.typname = 'clearance_tracker_status'
      AND namespace.nspname = 'new_product_development'
  ) THEN
    CREATE TYPE new_product_development.clearance_tracker_status AS ENUM (
      'BLOCKED',
      'COMPLETED',
      'IN_PROGRESS',
      'NOT_STARTED'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS new_product_development.eol_execution_plans (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL UNIQUE REFERENCES new_product_development.products (id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  stock_positions JSONB NOT NULL DEFAULT '[]'::jsonb,
  milestones JSONB NOT NULL DEFAULT '[]'::jsonb,
  kd_handoff_notes TEXT NOT NULL,
  service_continuity_plan TEXT NOT NULL,
  spare_parts_plan TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT eol_execution_stock_positions_array CHECK (jsonb_typeof(stock_positions) = 'array'),
  CONSTRAINT eol_execution_milestones_array CHECK (jsonb_typeof(milestones) = 'array')
);

CREATE TABLE IF NOT EXISTS new_product_development.clearance_plans (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL UNIQUE REFERENCES new_product_development.products (id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  pricing_rows JSONB NOT NULL DEFAULT '[]'::jsonb,
  allocations JSONB NOT NULL DEFAULT '[]'::jsonb,
  execution_instructions TEXT NOT NULL,
  weekly_trackers JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT clearance_plans_pricing_rows_array CHECK (jsonb_typeof(pricing_rows) = 'array'),
  CONSTRAINT clearance_plans_allocations_array CHECK (jsonb_typeof(allocations) = 'array'),
  CONSTRAINT clearance_plans_weekly_trackers_array CHECK (jsonb_typeof(weekly_trackers) = 'array')
);

CREATE INDEX IF NOT EXISTS idx_eol_execution_plans_product_id
  ON new_product_development.eol_execution_plans (product_id);

CREATE INDEX IF NOT EXISTS idx_clearance_plans_product_id
  ON new_product_development.clearance_plans (product_id);
