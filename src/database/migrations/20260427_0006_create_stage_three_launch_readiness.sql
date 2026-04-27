DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type type
    INNER JOIN pg_namespace namespace ON namespace.oid = type.typnamespace
    WHERE type.typname = 'channel_type'
      AND namespace.nspname = 'new_product_development'
  ) THEN
    CREATE TYPE new_product_development.channel_type AS ENUM (
      'CS',
      'EXPORT_KME',
      'ITO_RETAILERS',
      'ITO_WHOLESALE',
      'MM',
      'MTO',
      'PROJECTS'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_type type
    INNER JOIN pg_namespace namespace ON namespace.oid = type.typnamespace
    WHERE type.typname = 'gtm_owner_role'
      AND namespace.nspname = 'new_product_development'
  ) THEN
    CREATE TYPE new_product_development.gtm_owner_role AS ENUM (
      'CLUSTER_MANAGER',
      'FINANCE_MANAGER',
      'GM_COMMERCIAL_OWNER',
      'MARKETING_GTM_OWNER',
      'PRODUCT_MANAGER'
    );
  END IF;
END $$;

ALTER TYPE new_product_development.audit_action
  ADD VALUE IF NOT EXISTS 'MARKETING_REVIEW_COMPLETED';

CREATE TABLE IF NOT EXISTS new_product_development.channel_listing_plans (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL UNIQUE REFERENCES new_product_development.products (id) ON DELETE CASCADE,
  summary TEXT NULL,
  shopee_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  lazada_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  channels JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT channel_listing_plans_channels_array CHECK (jsonb_typeof(channels) = 'array')
);

CREATE TABLE IF NOT EXISTS new_product_development.channel_pricing (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL UNIQUE REFERENCES new_product_development.products (id) ON DELETE CASCADE,
  currency TEXT NOT NULL,
  notes TEXT NULL,
  pricing_rows JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT channel_pricing_currency_length CHECK (char_length(currency) = 3),
  CONSTRAINT channel_pricing_rows_array CHECK (jsonb_typeof(pricing_rows) = 'array')
);

CREATE TABLE IF NOT EXISTS new_product_development.gtm_plans (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL UNIQUE REFERENCES new_product_development.products (id) ON DELETE CASCADE,
  launch_objectives TEXT NOT NULL,
  activation_plan TEXT NOT NULL,
  communications_plan TEXT NOT NULL,
  budget NUMERIC(14, 2) NOT NULL,
  campaign_start_date DATE NULL,
  campaign_end_date DATE NULL,
  checklist_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT gtm_plans_budget_non_negative CHECK (budget >= 0),
  CONSTRAINT gtm_plans_checklist_items_array CHECK (jsonb_typeof(checklist_items) = 'array')
);

CREATE TABLE IF NOT EXISTS new_product_development.gate_three_reviews (
  product_id UUID PRIMARY KEY REFERENCES new_product_development.products (id) ON DELETE CASCADE,
  finance_confirmed_at TIMESTAMPTZ NULL,
  finance_confirmed_by_user_id UUID NULL REFERENCES new_product_development.users (id),
  finance_comment TEXT NULL,
  marketing_reviewed_at TIMESTAMPTZ NULL,
  marketing_reviewed_by_user_id UUID NULL REFERENCES new_product_development.users (id),
  marketing_comment TEXT NULL,
  gm_approved_at TIMESTAMPTZ NULL,
  gm_approved_by_user_id UUID NULL REFERENCES new_product_development.users (id),
  gm_comment TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_channel_listing_plans_product_id
  ON new_product_development.channel_listing_plans (product_id);

CREATE INDEX IF NOT EXISTS idx_channel_pricing_product_id
  ON new_product_development.channel_pricing (product_id);

CREATE INDEX IF NOT EXISTS idx_gtm_plans_product_id
  ON new_product_development.gtm_plans (product_id);
