CREATE SCHEMA IF NOT EXISTS new_product_development;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type type
    INNER JOIN pg_namespace namespace ON namespace.oid = type.typnamespace
    WHERE type.typname = 'user_role'
      AND namespace.nspname = 'new_product_development'
  ) THEN
    CREATE TYPE new_product_development.user_role AS ENUM (
      'ADMIN',
      'PRODUCT_MANAGER',
      'HEAD_OF_PRODUCT',
      'SOURCING_MANAGER',
      'QA_TSD_REVIEWER',
      'FINANCE_MANAGER',
      'GM_COMMERCIAL_OWNER',
      'COO_EXECUTIVE_APPROVER',
      'MARKETING_GTM_OWNER',
      'CLUSTER_MANAGER',
      'KD_AFTER_SALES',
      'SPDM_PRODUCT_OPS'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS new_product_development.users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role new_product_development.user_role NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_users_role ON new_product_development.users (role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON new_product_development.users (is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON new_product_development.users (created_at DESC);
