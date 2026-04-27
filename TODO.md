# New Product Development backend - backlog

This file tracks the backend work needed for the stage-gate product development system defined by [Product develpment templates.pdf](/Users/owen/Downloads/Product%20develpment%20templates.pdf) and the local backend guidance in [skills/BACKEND_PRODUCT_SKILL.md](skills/BACKEND_PRODUCT_SKILL.md).

For actionable tickets with assignees and delivery dates, prefer GitHub Issues later. Keep this file as the high-level feature map for the project.

---

## What exists today

| Area | Status |
|------|--------|
| Project planning | Skill and reference docs exist under `skills/` |
| Application code | NestJS backend scaffold and modules exist |
| API routes | Stages 1-4 and core platform routes are implemented |
| Database schema | Migrations exist for users, products, workflow, stages 1-4, approvals, and audit logs |
| Tests | Unit and e2e coverage exists for implemented slices |
| Auth / roles / approvals | Authorization policy, workflow transitions, and approval traceability are scaffolded; SSO is not implemented yet |

The backend now has foundation, users, products, stages 1-4, gate decisions, audit logs, and role-plus-assignment authorization. SSO, attachments, comments, dashboards, and late-lifecycle stages remain future work.

---

## Foundation and app setup

Decision: defer Swagger/OpenAPI until Stage 1 and Stage 2 contracts settle, so we do not churn docs while the core workflow is still being shaped.

- [x] Scaffold NestJS backend with strict TypeScript
- [x] Set up project structure under `src/modules`
- [x] Add app config and environment validation
- [x] Add PostgreSQL connection setup
- [x] Add initial health route, global validation pipe, and common error format
- [x] Add linting, formatting, and test configuration
- [x] Add `.env.example` with database and app configuration
- [x] Decide whether Swagger/OpenAPI is needed now or later

---

## Core platform modules

These should be built before template-specific features.

### Users, roles, and auth

- [x] Create `users` model
- [x] Define role model for Product Manager, Finance Manager, General Manager, COO, CEO, Marketing, Cluster Manager, KD, SPDM, Admin
- [ ] Decide auth approach: internal login, SSO, or seeded admin accounts (SSO Login using microsoft)
- [x] Add authorization rules for create, submit, review, approve, and archive actions

### Products and workflow

- [x] Create `products` module as the root aggregate
- [x] Add product fields such as working name, brand, category, current stage, and lifecycle status
- [x] Add record-level owner assignments for product, commercial, finance, marketing, and cluster ownership
- [x] Scope product listing and product access by role plus assignment
- [x] Create workflow / stage transition module
- [x] Enforce valid stage progression rules in the service layer
- [x] Support draft, submitted, approved, rejected, blocked, and archived states where relevant

### Approvals and auditability

- [x] Create `gate_decisions` module
- [x] Create append-only approval records with actor, outcome, comment, and timestamp
- [x] Create `audit_logs` module for important lifecycle actions
- [x] Treat approvals as first-class workflow actions; no separate signature artifact is required

### Supporting modules

- [ ] Add attachments / evidence support if the business needs uploaded files
- [ ] Add comments / notes support for review flows
- [ ] Add shared enums, constants, and validation helpers

---

## Stage 1 features

Stage 1 should be the first real business slice implemented end-to-end.

### Template 1 - Product Opportunity Brief

- [x] Create schema for Product Opportunity Brief
- [x] Add `POST /v1/products/:productId/opportunity-brief`
- [x] Add `GET /v1/products/:productId/opportunity-brief`
- [ ] Validate opportunity source, target product inputs, and compliance fields
- [x] Implement ART score capture for 9 criteria
- [ ] Resolve or confirm the threshold ambiguity in the source template (`/18` vs `Min 6/9`)

### Template 2 - Market Sizing

- [x] Create schema for Market Sizing
- [x] Add create and read endpoints
- [ ] Support category market size, price segments, projections, and data sources

### Template 3 - Competitor Matrix / Shootout

- [x] Create schema for Competitor Matrix
- [x] Add create and read endpoints
- [x] Support minimum 3 competitors
- [ ] Support feature comparison and scorecard summary

### Gate 1

- [x] Add Gate 1 submission flow
- [x] Add Gate 1 approval / rework / kill decision endpoint
- [x] Prevent stage progression without required Stage 1 templates
- [x] Record audit event on Gate 1 decision

---

## Stage 2 features

### Template 4 - Supplier Evaluation Matrix

- [x] Create schema for Supplier Evaluation Matrix
- [x] Add create and read endpoints
- [ ] Support multiple suppliers and weighted scoring
- [x] Enforce minimum 2 qualified suppliers before Gate 2 approval

### Template 5 - Business Case

- [x] Create schema for Business Case
- [x] Add create and read endpoints
- [ ] Support market opportunity, product summary, GP by channel, revenue projections, risks, and recommendation
- [x] Support sign-off behavior through explicit checkpoint actions for Finance, GM, and COO gate approval

### Gate 2

- [x] Add Gate 2 submission and approval flow
- [x] Block progression if supplier or business case requirements are incomplete
- [x] Record approval history and audit logs

---

## Stage 3 features

Decision: Stage 3 is Launch Readiness. The source PDF previously labelled these templates under Stage 4, but this backend uses `STAGE_3` and `gate-3` consistently.

### Template 6 - Channel Listing Plan

- [x] Create schema for Channel Listing Plan
- [x] Add create and read endpoints
- [x] Support channel/account rows, launch readiness fields, and summary counts
- [x] Enforce minimum 3 channels for Gate 3
- [x] Enforce Shopee and Lazada readiness requirement

### Template 7 - RSP by Channel

- [x] Create schema for channel pricing
- [x] Add create and read endpoints
- [x] Calculate GP by channel
- [x] Enforce minimum GP floors:
  - MTO 25%
  - ITO Retailers 22%
  - ITO Wholesale 20%
  - MM 28%
  - Projects 18%
  - CS 30%
  - Export/KME 20%
- [x] Enforce ITO pricing guardrail
- [ ] Add exception approval flows for below-floor pricing

### Template 8 - GTM Plan

- [x] Create schema for GTM Plan
- [x] Add create and read endpoints
- [x] Support launch objectives, activation plan, communications, budget, and checklist

### Gate 3

- [x] Add Gate 3 submission and approval flow
- [x] Prevent progression if pricing, listing, GTM, or checkpoint requirements fail
- [x] Record approval history and audit logs

---

## Stage 4 features

Decision: Stage 4 is Launch Execution / Post-Launch Monitoring after Gate 3 approval.

### Template 9 - Launch Confirmation & Live Listing

- [x] Create schema and endpoints
- [x] Support Day 1 listing status by channel and issue logging

### Template 10 - Sell-In Report

- [x] Create schema and endpoints
- [x] Support repeated weekly or period reports per product
- [x] Support top accounts and decline reasons

### Template 11 - Weekly Feedback Log

- [x] Create schema and endpoints
- [x] Support recurring feedback entries
- [x] Support review summaries, KD complaints, dealer feedback, and escalation flags

### Template 12 - Day 30 Review

- [x] Create schema and endpoints
- [x] Support KPI vs plan, GP by channel, verdict, and action plan
- [x] Enforce GP below floor escalation rule
- [x] Model halt-further-PO decision path if GP fails in any channel

---

## Stage 5 features

Decision: Stage 5 is Portfolio Review / Lifecycle Decisioning after Day 30 monitoring. It contains the 90-day scorecard, portfolio classification, and the revamp/EOL recommendation decision. Stage 5 should decide what happens next; Stage 6 should execute EOL/clearance only after that decision exists.

### Template 13 - 90-Day Product Scorecard

- [x] Create schema and endpoints
- [x] Support repeated 90-day review cycles per product
- [x] Capture sell-through, GP, revenue, margin, complaints, and market feedback
- [x] Implement A / B / C classification logic
- [x] Trigger escalation when product is C-class for 2 consecutive scorecard cycles
- [x] Record classification reason and escalation flag metadata

### Template 14 - Product Classification & Portfolio Update

- [x] Create portfolio-level schema and endpoints
- [x] Support quarterly multi-product reporting
- [x] Support portfolio summary and C-class review list
- [x] Link portfolio update rows back to product scorecards where available
- [x] Support COO quarterly review state

### Template 15 - Revamp Brief or EOL Recommendation

- [x] Create schema and endpoints
- [x] Support trigger reasons, root cause analysis, revamp option, EOL option, hold option, and recommendation
- [x] Require recommendation outcome: revamp, EOL, or hold
- [x] Require GM commercial input before COO decision
- [x] Record COO decision and audit log

### Stage 5 workflow rules

- [x] Keep scorecards editable only while product is in `STAGE_5`
- [x] Allow repeated scorecard records but one active revamp/EOL recommendation per product
- [x] Auto-flag repeated C-class products
- [x] Block EOL execution until a Stage 5 EOL recommendation is approved. Decision: enforced in Stage 6 creation rules.
- [x] Decide whether Stage 5 needs explicit `gate-5` endpoints or review/action endpoints only. Decision: review/action endpoints only.

---

## Stage 6 features

Decision: Stage 6 is EOL / Clearance Execution. It should not decide whether to revamp or EOL; it should execute the approved Stage 5 recommendation.

### Template 16 - EOL Execution Plan

- [x] Create schema and endpoints
- [x] Support stock position, milestone plan, and KD handoff
- [x] Track milestone status rather than storing only a static blob

### Template 17 - Clearance Plan

- [x] Create schema and endpoints
- [x] Support clearance pricing by channel, stock allocation, execution instructions, and weekly tracker
- [x] Enforce price floor and markdown approval rules
- [x] Require approved EOL recommendation before creation

---

## Shared business-rule engines

These rules should not be buried in controllers.

- [ ] ART scoring service for Template 1
- [ ] GP calculation service for pricing and review templates
- [ ] Pricing guardrail validation service
- [ ] Stage transition policy service
- [x] Product classification policy for A / B / C logic
- [x] EOL / clearance policy service
- [x] Stage 5 recommendation policy for revamp / EOL / hold outcomes

---

## API contract design

- [ ] Standardize route naming under `/v1`
- [ ] Separate request DTOs from response DTOs
- [ ] Add structured error responses with `code`, `message`, `details`, and `requestId`
- [ ] Decide create vs draft-save vs submit endpoints for templates
- [ ] Decide whether templates are editable after submission or must become immutable snapshots
- [ ] Add pagination for recurring reports and portfolio views

---

## Database schema and migrations

- [ ] Create base schema for users, products, workflow states, approvals, and audit logs
- [x] Create tables for all 17 templates
- [x] Model recurring reports as one-to-many records
- [x] Add enums for stage, status, channel, approval outcome, and portfolio class
- [x] Add foreign keys and indexes for hot paths
- [ ] Add migration strategy for future template evolution and versioning

---

## Testing and reliability

- [ ] Add unit tests for services and policy logic
- [ ] Add integration-style tests for main API paths
- [ ] Test invalid workflow transitions
- [ ] Test GP floor enforcement
- [ ] Test ART scoring logic
- [x] Test approval and audit log creation
- [x] Test repeated report creation for Stage 5 scorecards and Stage 6 clearance trackers
- [ ] Add seed data or fixtures for local development

---

## Documentation and developer experience

- [ ] Write README with setup, architecture, and module map
- [ ] Document the stage-gate flow and template coverage
- [ ] Document environment variables and database setup
- [ ] Document assumptions and unresolved business rules
- [ ] Add example API requests for Stage 1 and Stage 2

---

## Open questions to confirm with stakeholders

- [x] What exactly is Stage 3 in this workflow? Decision: Launch Readiness.
- [ ] What is the correct passing threshold for Template 1 ART score?
- [ ] Are submitted templates editable, versioned, or locked?
- [ ] Are digital signatures required, or are approval actions enough? Decision: Approval actions are enough.
- [ ] Are file uploads required for evidence, certifications, or attachments?
- [ ] What are the exact permission rules for each role?
- [ ] Should the system support notifications, reminders, or dashboards in the first release?

---

## Suggested implementation order

- [x] 1. Scaffold app, PostgreSQL connection, config, health route
- [x] 2. Build users, roles, products, workflow, approvals, and audit logs
- [x] 3. Implement Stage 1 end-to-end
- [x] 4. Implement Stage 2 end-to-end
- [x] 5. Implement Stage 3 Launch Readiness end-to-end
- [x] 6. Implement Stage 4 Launch Execution end-to-end
- [x] 7. Implement Stage 5 Portfolio Review / Lifecycle Decisioning end-to-end
- [x] 8. Implement Stage 6 EOL / Clearance Execution end-to-end
- [ ] 9. Tighten tests, docs, and production readiness
