INSERT INTO new_product_development.users (
  id,
  email,
  full_name,
  role,
  is_active,
  metadata,
  created_at,
  updated_at
)
VALUES
  (
    '00000000-0000-4000-8000-000000000001',
    'admin@khind.com',
    'Admin User',
    'ADMIN',
    TRUE,
    '{"seed":"uat","auth":"temporary-email-password"}'::jsonb,
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-4000-8000-000000000002',
    'product@khind.com',
    'Product Manager',
    'PRODUCT_MANAGER',
    TRUE,
    '{"seed":"uat","auth":"temporary-email-password"}'::jsonb,
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-4000-8000-000000000003',
    'head.product@khind.com',
    'Head of Product',
    'HEAD_OF_PRODUCT',
    TRUE,
    '{"seed":"uat","auth":"temporary-email-password"}'::jsonb,
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-4000-8000-000000000004',
    'sourcing@khind.com',
    'Sourcing Manager',
    'SOURCING_MANAGER',
    TRUE,
    '{"seed":"uat","auth":"temporary-email-password"}'::jsonb,
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-4000-8000-000000000005',
    'qa@khind.com',
    'QA TSD Reviewer',
    'QA_TSD_REVIEWER',
    TRUE,
    '{"seed":"uat","auth":"temporary-email-password"}'::jsonb,
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-4000-8000-000000000006',
    'finance@khind.com',
    'Finance Manager',
    'FINANCE_MANAGER',
    TRUE,
    '{"seed":"uat","auth":"temporary-email-password"}'::jsonb,
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-4000-8000-000000000007',
    'gm@khind.com',
    'GM Commercial Owner',
    'GM_COMMERCIAL_OWNER',
    TRUE,
    '{"seed":"uat","auth":"temporary-email-password"}'::jsonb,
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-4000-8000-000000000008',
    'coo@khind.com',
    'COO Executive Approver',
    'COO_EXECUTIVE_APPROVER',
    TRUE,
    '{"seed":"uat","auth":"temporary-email-password"}'::jsonb,
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-4000-8000-000000000009',
    'marketing@khind.com',
    'Marketing GTM Owner',
    'MARKETING_GTM_OWNER',
    TRUE,
    '{"seed":"uat","auth":"temporary-email-password"}'::jsonb,
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-4000-8000-000000000010',
    'cluster@khind.com',
    'Cluster Manager',
    'CLUSTER_MANAGER',
    TRUE,
    '{"seed":"uat","auth":"temporary-email-password"}'::jsonb,
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-4000-8000-000000000011',
    'kd@khind.com',
    'KD After Sales',
    'KD_AFTER_SALES',
    TRUE,
    '{"seed":"uat","auth":"temporary-email-password"}'::jsonb,
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-4000-8000-000000000012',
    'spdm@khind.com',
    'SPDM Product Ops',
    'SPDM_PRODUCT_OPS',
    TRUE,
    '{"seed":"uat","auth":"temporary-email-password"}'::jsonb,
    NOW(),
    NOW()
  )
ON CONFLICT (email)
DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  is_active = TRUE,
  metadata = new_product_development.users.metadata || EXCLUDED.metadata,
  updated_at = NOW();
