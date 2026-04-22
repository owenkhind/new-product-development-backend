# New Product Development backend - backlog

This file tracks the backend work needed for the stage-gate product development system defined by [Product develpment templates.pdf](/Users/owen/Downloads/Product%20develpment%20templates.pdf) and the local backend guidance in [skills/BACKEND_PRODUCT_SKILL.md](skills/BACKEND_PRODUCT_SKILL.md).

For actionable tickets with assignees and delivery dates, prefer GitHub Issues later. Keep this file as the high-level feature map for the project.

---

## What exists today

| Area | Status |
|------|--------|
| Project planning | Skill and reference docs exist under `skills/` |
| Application code | Not scaffolded yet |
| API routes | Not implemented yet |
| Database schema | Not implemented yet |
| Tests | Not implemented yet |
| Auth / roles / approvals | Authorization policy, workflow transitions, and approval traceability are scaffolded; SSO is not implemented yet |

This means the project is still at the foundation and backend design stage.

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
- [ ] Add Gate 1 approval / rework / kill decision endpoint
- [x] Prevent stage progression without required Stage 1 templates
- [x] Record audit event on Gate 1 decision

---

## Stage 2 features

### Template 4 - Supplier Evaluation Matrix

- [ ] Create schema for Supplier Evaluation Matrix
- [ ] Add create and read endpoints
- [ ] Support multiple suppliers and weighted scoring
- [ ] Enforce minimum 2 qualified suppliers before Gate 2 approval

### Template 5 - Business Case

- [ ] Create schema for Business Case
- [ ] Add create and read endpoints
- [ ] Support market opportunity, product summary, GP by channel, revenue projections, risks, and recommendation
- [ ] Support sign-off fields for Product Manager, Finance Manager, GM, and COO

### Gate 2

- [ ] Add Gate 2 submission and approval flow
- [ ] Block progression if supplier or business case requirements are incomplete
- [ ] Record approval history and audit logs

---

## Stage 3 clarification

- [ ] Confirm what Stage 3 represents in the business process
- [ ] Confirm whether Stage 3 needs its own template, approval, or backend module
- [ ] Avoid implementing a fake Stage 3 template before requirements are confirmed

---

## Stage 4 features

### Template 6 - Channel Listing Plan

- [ ] Create schema for Channel Listing Plan
- [ ] Add create and read endpoints
- [ ] Support channel/account rows, launch readiness fields, and summary counts
- [ ] Enforce minimum 3 channels for Gate 4
- [ ] Enforce Shopee and Lazada readiness requirement if confirmed by business

### Template 7 - RSP by Channel

- [ ] Create schema for channel pricing
- [ ] Add create and read endpoints
- [ ] Calculate GP by channel
- [ ] Enforce minimum GP floors:
  - MTO 25%
  - ITO Retailers 22%
  - ITO Wholesale 20%
  - MM 28%
  - Projects 18%
  - CS 30%
  - Export/KME 20%
- [ ] Enforce pricing guardrails and exception flows

### Template 8 - GTM Plan

- [ ] Create schema for GTM Plan
- [ ] Add create and read endpoints
- [ ] Support launch objectives, activation plan, communications, budget, and checklist

### Gate 4

- [ ] Add Gate 4 submission and approval flow
- [ ] Prevent progression if pricing or listing requirements fail
- [ ] Record approval history and audit logs

---

## Stage 5 features

### Template 9 - Launch Confirmation & Live Listing

- [ ] Create schema and endpoints
- [ ] Support Day 1 listing status by channel and issue logging

### Template 10 - Sell-In Report

- [ ] Create schema and endpoints
- [ ] Support repeated weekly or period reports per product
- [ ] Support top accounts and decline reasons

### Template 11 - Weekly Feedback Log

- [ ] Create schema and endpoints
- [ ] Support recurring feedback entries
- [ ] Support review summaries, KD complaints, dealer feedback, and escalation flags

### Template 12 - Day 30 Review

- [ ] Create schema and endpoints
- [ ] Support KPI vs plan, GP by channel, verdict, and action plan
- [ ] Enforce GP below floor escalation rule
- [ ] Model halt-further-PO decision path if GP fails in any channel

---

## Stage 6 features

### Template 13 - 90-Day Product Scorecard

- [ ] Create schema and endpoints
- [ ] Support repeated review cycles
- [ ] Implement A / B / C classification logic
- [ ] Trigger escalation when product is C-class for 2 consecutive cycles

### Template 14 - Product Classification & Portfolio Update

- [ ] Create portfolio-level schema and endpoints
- [ ] Support quarterly multi-product reporting
- [ ] Support portfolio summary and C-class review list

### Template 15 - Revamp Brief or EOL Recommendation

- [ ] Create schema and endpoints
- [ ] Support trigger reasons, root cause analysis, revamp option, EOL option, and recommendation

### Template 16 - EOL Execution Plan

- [ ] Create schema and endpoints
- [ ] Support stock position, milestone plan, and KD handoff
- [ ] Track milestone status rather than storing only a static blob

### Template 17 - Clearance Plan

- [ ] Create schema and endpoints
- [ ] Support clearance pricing by channel, stock allocation, execution instructions, and weekly tracker
- [ ] Enforce price floor and markdown approval rules

---

## Shared business-rule engines

These rules should not be buried in controllers.

- [ ] ART scoring service for Template 1
- [ ] GP calculation service for pricing and review templates
- [ ] Pricing guardrail validation service
- [ ] Stage transition policy service
- [ ] Product classification policy for A / B / C logic
- [ ] EOL / clearance policy service

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
- [ ] Create tables for all 17 templates
- [ ] Model recurring reports as one-to-many records
- [ ] Add enums for stage, status, channel, approval outcome, and portfolio class
- [ ] Add foreign keys and indexes for hot paths
- [ ] Add migration strategy for future template evolution and versioning

---

## Testing and reliability

- [ ] Add unit tests for services and policy logic
- [ ] Add integration-style tests for main API paths
- [ ] Test invalid workflow transitions
- [ ] Test GP floor enforcement
- [ ] Test ART scoring logic
- [ ] Test approval and audit log creation
- [ ] Test repeated report creation for Stage 5 and Stage 6 templates
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

- [ ] What exactly is Stage 3 in this workflow?
- [ ] What is the correct passing threshold for Template 1 ART score?
- [ ] Are submitted templates editable, versioned, or locked?
- [ ] Are digital signatures required, or are approval actions enough?
- [ ] Are file uploads required for evidence, certifications, or attachments?
- [ ] What are the exact permission rules for each role?
- [ ] Should the system support notifications, reminders, or dashboards in the first release?

---

## Suggested implementation order

- [ ] 1. Scaffold app, PostgreSQL connection, config, health route
- [ ] 2. Build users, roles, products, workflow, approvals, and audit logs
- [ ] 3. Implement Stage 1 end-to-end
- [ ] 4. Implement Stage 2 end-to-end
- [ ] 5. Clarify Stage 3
- [ ] 6. Implement Stage 4 end-to-end
- [ ] 7. Implement Stage 5 end-to-end
- [ ] 8. Implement Stage 6 end-to-end
- [ ] 9. Tighten tests, docs, and production readiness
