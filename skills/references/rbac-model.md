# RBAC Model

Use this reference when implementing users, role checks, gate approvals, assignments, or admin support behavior.

## System roles
Start with these login roles:

- `ADMIN`
- `PRODUCT_MANAGER`
- `HEAD_OF_PRODUCT`
- `SOURCING_MANAGER`
- `QA_TSD_REVIEWER`
- `FINANCE_MANAGER`
- `GM_COMMERCIAL_OWNER`
- `COO_EXECUTIVE_APPROVER`
- `MARKETING_GTM_OWNER`
- `CLUSTER_MANAGER`
- `KD_AFTER_SALES`
- `SPDM_PRODUCT_OPS`

The first 9 are the clean MVP roles. `KD_AFTER_SALES`, `SPDM_PRODUCT_OPS`, and `ADMIN` remain important but can be introduced or tightened separately if the business wants a smaller day-1 setup.

## Authorization model
Do not use global RBAC alone. Combine 3 layers:

1. system role
2. record-level assignment
3. action policy check

Role answers what a user may do. Assignment answers which product or workflow they may do it on.

## Record-level assignments
For workflow-heavy products, keep ownership fields explicit. Typical examples:

- `productOwnerUserId`
- `commercialOwnerUserId`
- `financeOwnerUserId`
- `marketingOwnerUserId`
- `clusterOwnerUserIds[]`

Do not assume that everyone with the same role can edit every product.

## Standard action vocabulary
Use explicit action names in policy code:

- `CREATE`
- `EDIT`
- `SUBMIT`
- `APPROVE`
- `REJECT`
- `REOPEN`
- `VIEW`
- `ASSIGN`
- `COMMENT`
- `UPLOAD_DOCUMENT`
- `CHANGE_STATUS`
- `OVERRIDE`

## Admin support model
Admin is a superuser, but support actions must stay auditable.

Admin may:

- create, edit, submit, approve, reject, reopen, and view across all stages
- repair workflow state
- reassign owners and approvers
- see audit logs
- perform support overrides

Admin should still obey business rules unless an explicit override is used.

When admin overrides workflow behavior, store:

- `overrideReason`
- `isAdminSupportAction`
- `actingAsUserId`
- `actedByUserId`
- `actedAsRole`
- before and after state snapshots when practical

## Role groupings
Useful conceptual groupings:

- makers
  - Product Manager
  - Sourcing Manager
  - Marketing
  - Cluster Manager
- controllers
  - QA/TSD Reviewer
  - Finance Manager
- approvers
  - Head of Product
  - GM / Commercial Owner
  - COO / Executive Approver
- support ops
  - KD / After-Sales
  - SPDM / Product Ops
  - Admin

## Gate authorities
Default approval authorities:

- Gate 1
  - Product Manager prepares
  - GM noted
  - Head of Product approves or rejects
- Gate 2
  - Product and Sourcing coordinate inputs
  - QA/TSD notes compliance readiness
  - Finance confirms P&L / GP
  - GM and COO approve commercial progression
- Gate 4
  - Product, Cluster, Finance, and Marketing prepare readiness
  - GM and COO approve launch readiness
- Stage 5 escalations
  - COO handles major escalations
- Stage 6 quarterly, EOL, and clearance decisions
  - COO is the main authority

## Stage-specific behavior notes
- Stage 1 is Product-led with governance approval from Head of Product.
- Stage 2 splits into supplier, QA, finance, and commercial sub-checks. Prefer separate status flags instead of one flat boolean.
- Stage 3 is still undefined in the source templates. Treat it as a controlled internal stage until business rules are confirmed.
- Stage 4 blocks should include channel count, e-commerce readiness, GP floors, and unresolved critical checklist items.
- Stage 5 should produce system flags such as `on_track`, `below_target`, `significantly_below`, `gp_issue`, and `halt_po_required`.
- Stage 6 should support automatic escalation triggers for repeated C-class or repeated GP underperformance.

## Data model guidance
For the first user slice, start with a simple `users` table containing:

- `id`
- `email`
- `full_name`
- `role`
- `is_active`
- `created_at`
- `updated_at`
- `last_login_at`

Add assignment tables later when product ownership is introduced. Do not over-model those before the `products` module exists.
