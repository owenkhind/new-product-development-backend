DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type type
    INNER JOIN pg_namespace namespace ON namespace.oid = type.typnamespace
    WHERE type.typname = 'product_brand'
      AND namespace.nspname = 'new_product_development'
  ) THEN
    CREATE TYPE new_product_development.product_brand AS ENUM (
      'KHIND',
      'MAYER',
      'MISTRAL',
      'OTHER'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_type type
    INNER JOIN pg_namespace namespace ON namespace.oid = type.typnamespace
    WHERE type.typname = 'product_category'
      AND namespace.nspname = 'new_product_development'
  ) THEN
    CREATE TYPE new_product_development.product_category AS ENUM (
      'FANS',
      'SDA',
      'MDA',
      'OTHER'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_type type
    INNER JOIN pg_namespace namespace ON namespace.oid = type.typnamespace
    WHERE type.typname = 'product_stage'
      AND namespace.nspname = 'new_product_development'
  ) THEN
    CREATE TYPE new_product_development.product_stage AS ENUM (
      'STAGE_1',
      'STAGE_2',
      'STAGE_3',
      'STAGE_4',
      'STAGE_5',
      'STAGE_6'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_type type
    INNER JOIN pg_namespace namespace ON namespace.oid = type.typnamespace
    WHERE type.typname = 'product_status'
      AND namespace.nspname = 'new_product_development'
  ) THEN
    CREATE TYPE new_product_development.product_status AS ENUM (
      'DRAFT',
      'IN_REVIEW',
      'APPROVED',
      'REJECTED',
      'BLOCKED',
      'ARCHIVED'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS new_product_development.products (
  id UUID PRIMARY KEY,
  product_code TEXT NULL UNIQUE,
  working_name TEXT NOT NULL,
  brand new_product_development.product_brand NOT NULL,
  category new_product_development.product_category NOT NULL,
  description TEXT NULL,
  current_stage new_product_development.product_stage NOT NULL DEFAULT 'STAGE_1',
  status new_product_development.product_status NOT NULL DEFAULT 'DRAFT',
  product_owner_user_id UUID NOT NULL REFERENCES new_product_development.users (id),
  commercial_owner_user_id UUID NULL REFERENCES new_product_development.users (id),
  finance_owner_user_id UUID NULL REFERENCES new_product_development.users (id),
  marketing_owner_user_id UUID NULL REFERENCES new_product_development.users (id),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS new_product_development.product_cluster_assignments (
  product_id UUID NOT NULL REFERENCES new_product_development.products (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES new_product_development.users (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (product_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_products_stage ON new_product_development.products (current_stage);
CREATE INDEX IF NOT EXISTS idx_products_status ON new_product_development.products (status);
CREATE INDEX IF NOT EXISTS idx_products_product_owner ON new_product_development.products (product_owner_user_id);
CREATE INDEX IF NOT EXISTS idx_products_commercial_owner ON new_product_development.products (commercial_owner_user_id);
CREATE INDEX IF NOT EXISTS idx_products_finance_owner ON new_product_development.products (finance_owner_user_id);
CREATE INDEX IF NOT EXISTS idx_products_marketing_owner ON new_product_development.products (marketing_owner_user_id);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON new_product_development.products (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_cluster_assignments_user_id
  ON new_product_development.product_cluster_assignments (user_id);
