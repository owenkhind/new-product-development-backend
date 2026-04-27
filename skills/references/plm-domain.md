# Product Lifecycle Management Domain

Use this reference when the request touches the actual business workflow behind the product development system.

## Workflow summary
The product lifecycle runs through a stage-gate process with 17 templates:

- Stage 1
  - T1 Product Opportunity Brief
  - T2 Market Sizing Template
  - T3 Competitor Matrix / Shootout
  - output: Gate 1 decision
- Stage 2
  - T4 Supplier Evaluation Matrix
  - T5 Business Case
  - output: Gate 2 decision
- Stage 3
  - T6 Channel Listing Plan
  - T7 RSP by Channel
  - T8 GTM Plan
  - output: Gate 3 decision
- Stage 4
  - T9 Launch Confirmation & Live Listing
  - T10 Sell-In Report
  - T11 Weekly Feedback Log
  - T12 Day 30 Review Report + Action Plan
- Stage 5
  - T13 90-Day Product Scorecard
  - T14 Product Classification & Portfolio Update
  - T15 Revamp Brief or EOL Recommendation
- Stage 6
  - T16 EOL Execution Plan
  - T17 Clearance Plan

## Recommended module boundaries
Use feature modules unless the existing codebase already established another pattern:

- `products`
- `stages` or `workflow`
- `gate-decisions`
- `opportunity-briefs`
- `market-sizing`
- `competitor-matrices`
- `supplier-evaluations`
- `business-cases`
- `channel-listing-plans`
- `channel-pricing`
- `gtm-plans`
- `launch-confirmations`
- `sell-in-reports`
- `weekly-feedback-logs`
- `day-30-reviews`
- `product-scorecards`
- `portfolio-updates`
- `revamp-eol-recommendations`
- `eol-execution-plans`
- `clearance-plans`
- `approvals`
- `audit-logs`
- `attachments`

## Aggregate and record strategy
Model `product` as the central aggregate and keep workflow records separate:

- `products`
  - core identity, brand, category, working name, stage, status
- `template_*` tables
  - one record per template submission or version
- `gate_decisions`
  - explicit decision records with approver, outcome, timestamp, comments
- `approval_signatures`
  - optional detailed signatures when the UI needs more than a gate decision
- `audit_logs`
  - append-only history of material state changes

Do not flatten the whole lifecycle into one `products` table with dozens of nullable columns.

## Relationship patterns
Use these defaults unless the business confirms otherwise:

- one-to-one or latest-active-per-product
  - T1, T2, T3, T4, T5, T6, T7, T8, T9, T12, T15, T16, T17
- one-to-many over time
  - T10 Sell-In Report
  - T11 Weekly Feedback Log
  - T13 90-Day Product Scorecard
- portfolio-level, not product-level
  - T14 Product Classification & Portfolio Update

If submission versioning matters, prefer:

- immutable submitted snapshots
- mutable draft records before submission
- explicit `submitted_at`, `submitted_by`, `approved_at`, `approved_by`

## Actors and approval roles
Common actors from the templates include:

- Product Manager
- Finance Manager
- Sourcing Manager
- Marketing
- Cluster Managers
- GM
- Head of Product
- COO
- CEO
- KD / service team
- SPDM

Represent role-bearing actions explicitly in the domain. Avoid storing important approvals as plain string signature fields only.

## Key business invariants
Implement these in services and protect them with tests.

### Stage and gate rules
- A product should not advance to the next stage without the required template set for the current stage.
- Gate decisions should be append-only records.
- Invalid stage transitions should be rejected in the service layer.

### Template-specific rules
- T4 Supplier Evaluation requires at least 2 qualified suppliers for Gate 2.
- T6 Channel Listing Plan requires at least 3 confirmed channels for Gate 3.
- T6 also expects Shopee and Lazada to be confirmed for e-commerce readiness.
- T13 can trigger automatic escalation when the product is C-class for 2 consecutive scorecard cycles.

### GP floors by channel
Use explicit rules rather than burying these in comments:

- MTO: 25%
- ITO Retailers: 22%
- ITO Wholesale: 20%
- MM: 28%
- Projects: 18%
- CS: 30%
- Export/KME: 20% where applicable

### Pricing guardrails
- ITO RSP must not undercut MTO RSP by more than 10%.
- E-commerce flash sale floor is 20% GP.
- B2B / Projects deals below 15% GP require COO written approval.
- Clearance pricing must not go below channel GP floor without explicit higher approval.

### Day 30 and later actions
- If GP falls below floor in any channel during Day 30 review, further purchase orders should be halted and escalated for review.
- T13 can trigger portfolio escalation when the product is C-class for 2 consecutive 90-day scorecard cycles.
- T15 should distinguish between revamp, EOL, and hold decisions.
- T16 and T17 are execution workflows with milestone tracking, not just static forms.

## ART scoring guidance
Template 1 uses nine criteria:

- A1 Affordable - Price
- A2 Affordable - Cost
- A3 Affordable - Value
- R1 Reliable - Durability
- R2 Reliable - Service
- R3 Reliable - Compliance
- T1 Trendy - Design
- T2 Trendy - Colour
- T3 Trendy - Category

Each criterion scores 0 to 2 for a maximum total of 18.

Important ambiguity:

- the PDF says `TOTAL SCORE (max 18)` but also says `Min 6/9 to proceed`
- this appears inconsistent
- do not silently hardcode a threshold without confirming the intended rule
- if forced to proceed, surface the ambiguity and use a clearly documented assumption

## Recommended API shape
Prefer resource-oriented endpoints such as:

- `POST /v1/products`
- `POST /v1/products/:productId/opportunity-brief`
- `POST /v1/products/:productId/market-sizing`
- `POST /v1/products/:productId/competitor-matrix`
- `POST /v1/products/:productId/supplier-evaluations`
- `POST /v1/products/:productId/business-case`
- `POST /v1/products/:productId/channel-listing-plan`
- `POST /v1/products/:productId/channel-pricing`
- `POST /v1/products/:productId/gtm-plan`
- `POST /v1/products/:productId/launch-confirmation`
- `POST /v1/products/:productId/sell-in-reports`
- `POST /v1/products/:productId/weekly-feedback-logs`
- `POST /v1/products/:productId/day-30-review`
- `POST /v1/products/:productId/scorecards`
- `POST /v1/portfolio-updates`
- `POST /v1/products/:productId/revamp-eol-recommendation`
- `POST /v1/products/:productId/eol-execution-plan`
- `POST /v1/products/:productId/clearance-plan`
- `POST /v1/products/:productId/gate-decisions`

Use dedicated request and response DTOs. Do not expose raw database records directly.

## Suggested implementation order
When the backend is being built from scratch, prefer this order:

1. foundation
   - NestJS app, config, PostgreSQL access layer, auth shell if needed, users, products, audit log
2. Stage 1
   - T1, T2, T3, Gate 1
3. Stage 2
   - T4, T5, Gate 2
4. Stage 3
   - T6, T7, T8, Gate 3
5. Stage 4
   - T9, T10, T11, T12
6. Stage 5
   - T13, T14, T15
7. Stage 6
   - T16, T17

This keeps the workflow usable early and avoids overbuilding late-stage modules before the foundation is stable.

## Database design notes
Prefer explicit enums for:

- stage
- template type
- approval status
- product status
- recommendation / verdict values
- channel types
- portfolio class A/B/C

Use transactions for:

- template submission plus stage transition
- gate approval plus audit log creation
- workflows that insert parent plus child rows together

Index likely hot paths:

- `product_id`
- `stage`
- `status`
- `submitted_at`
- `review_date`
- composite indexes for `product_id` plus time-based sorting on recurring reports

## Ambiguities to surface, not guess
Raise these when they matter to implementation:

- The source PDF labels T6/T7/T8 under Stage 4, but this project now treats them as Stage 3 Launch Readiness.
- Template 1 threshold wording appears inconsistent.
- Some signature fields may actually represent approval actions rather than passive metadata.
- It is unclear whether submitted forms remain editable or must become immutable snapshots.
- It is unclear whether attachments or supporting evidence are mandatory for some templates.
- It is unclear whether user roles are simple labels or need real authorization policies.

When blocked by ambiguity, document the assumption and choose the lowest-risk implementation.
