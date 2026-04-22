DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type type
    INNER JOIN pg_namespace namespace ON namespace.oid = type.typnamespace
    WHERE type.typname = 'workflow_transition_action'
      AND namespace.nspname = 'new_product_development'
  ) THEN
    CREATE TYPE new_product_development.workflow_transition_action AS ENUM (
      'SUBMIT',
      'APPROVE',
      'REJECT',
      'REOPEN',
      'BLOCK',
      'ARCHIVE'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_type type
    INNER JOIN pg_namespace namespace ON namespace.oid = type.typnamespace
    WHERE type.typname = 'audit_entity_type'
      AND namespace.nspname = 'new_product_development'
  ) THEN
    CREATE TYPE new_product_development.audit_entity_type AS ENUM (
      'PRODUCT'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS new_product_development.gate_decisions (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES new_product_development.products (id) ON DELETE CASCADE,
  gate_stage new_product_development.product_stage NOT NULL,
  outcome new_product_development.workflow_transition_action NOT NULL,
  actor_user_id UUID NOT NULL REFERENCES new_product_development.users (id),
  acting_as_user_id UUID NULL REFERENCES new_product_development.users (id),
  comment TEXT NULL,
  override_reason TEXT NULL,
  is_admin_support_action BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS new_product_development.audit_logs (
  id UUID PRIMARY KEY,
  entity_type new_product_development.audit_entity_type NOT NULL,
  entity_id UUID NOT NULL,
  product_id UUID NULL REFERENCES new_product_development.products (id) ON DELETE CASCADE,
  actor_user_id UUID NOT NULL REFERENCES new_product_development.users (id),
  acting_as_user_id UUID NULL REFERENCES new_product_development.users (id),
  action new_product_development.workflow_transition_action NOT NULL,
  from_state JSONB NULL,
  to_state JSONB NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gate_decisions_product_id
  ON new_product_development.gate_decisions (product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gate_decisions_actor_user_id
  ON new_product_development.gate_decisions (actor_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_product_id
  ON new_product_development.audit_logs (product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
  ON new_product_development.audit_logs (entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_user_id
  ON new_product_development.audit_logs (actor_user_id, created_at DESC);
