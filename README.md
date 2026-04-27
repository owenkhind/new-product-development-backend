# New Product Development Backend

NestJS backend for the KHIND stage-gate new product development workflow.

The app is a modular monolith using strict TypeScript, PostgreSQL, DTO validation, product-scoped authorization policies, explicit gate decisions, and append-only audit logs for workflow actions.

## Stack

- Node.js 22+
- NestJS 11
- PostgreSQL
- Plain SQL repositories through `pg`
- `class-validator` / `class-transformer`
- Node test runner with `tsx`

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Configure PostgreSQL in `.env`.

Preferred:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/new_product_development?schema=new_product_development
```

Fallback fields are also supported:

```env
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=new_product_development
DB_USERNAME=postgres
DB_PASSWORD=password
DB_SSLMODE=disable
DB_SCHEMA=new_product_development
```

4. Apply migrations in order from:

```text
src/database/migrations
```

5. Start the app:

```bash
npm run start:dev
```

The API is versioned under `/v1`.

## Verification

Run the full local quality gate before committing:

```bash
npm run build
npm run lint
npm test
npm run test:e2e
```

## Development Auth

In non-production environments, protected routes use development headers:

```http
x-dev-user-id: <user-id>
```

Admin support override headers:

```http
x-dev-admin-override: true
x-dev-acting-as-user-id: <business-user-id>
```

Admin override actions must include an `overrideReason` where the endpoint supports delegated/support actions.

## Module Map

- `users`: login users, roles, active state.
- `products`: product aggregate, ownership assignments, stage/status.
- `workflow`: generic reopen/block/archive and gate workflow decisions.
- `gate-decisions`: product gate decision history.
- `audit-logs`: append-only workflow and support action logs.
- Stage 1:
  - `opportunity-briefs`
  - `market-sizing`
  - `competitor-matrices`
- Stage 2:
  - `supplier-evaluations`
  - `business-cases`
  - `gate-two-reviews`
- Stage 3:
  - `channel-listing-plans`
  - `channel-pricing`
  - `gtm-plans`
  - `gate-three-reviews`
- Stage 4:
  - `launch-confirmations`
  - `sell-in-reports`
  - `weekly-feedback-logs`
  - `day-30-reviews`
- Stage 5:
  - `product-scorecards`
  - `portfolio-updates`
  - `revamp-eol-recommendations`
- Stage 6:
  - `eol-execution-plans`
  - `clearance-plans`

## Stage Flow

The backend uses the normalized stage naming below:

- `STAGE_1`: Spot & Screen / Gate 1
- `STAGE_2`: Feasibility / Gate 2
- `STAGE_3`: Launch Readiness / Gate 3
- `STAGE_4`: Launch Execution
- `STAGE_5`: Portfolio Review / Lifecycle Decisioning
- `STAGE_6`: EOL / Clearance Execution

Gate decisions are explicit business actions:

- `submit`
- `approve`
- `reject`
- `kill`

Generic workflow actions remain separate:

- `reopen`
- `block`
- `archive`

## Pagination

List endpoints that can grow over time return:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 0
  }
}
```

Supported query parameters:

```text
?page=1&limit=20
```

The current max `limit` is `100`.

## Example API Requests

### Stage 1 Opportunity Brief

```bash
curl -X POST http://localhost:3000/v1/products/{productId}/opportunity-brief \
  -H "content-type: application/json" \
  -H "x-dev-user-id: {productOwnerUserId}" \
  -d '{
    "opportunitySource": "Dealer feedback",
    "problemStatement": "Existing range lacks a compact premium option.",
    "targetCustomer": "Urban apartment owners",
    "targetMarket": "Malaysia premium desk fan",
    "uniqueSellingPoints": ["Compact footprint", "Premium finish"],
    "requiredDocumentsComplete": true,
    "trendyDesignScore": 2,
    "trendyColourScore": 2,
    "trendyCategoryScore": 1,
    "reliableDurabilityScore": 2,
    "reliableServiceScore": 1,
    "reliableComplianceScore": 1,
    "affordablePriceScore": 2,
    "affordableCostScore": 1,
    "affordableValueScore": 1
  }'
```

### Gate 1 Submit

```bash
curl -X POST http://localhost:3000/v1/products/{productId}/gates/gate-1/submit \
  -H "content-type: application/json" \
  -H "x-dev-user-id: {productOwnerUserId}" \
  -d '{
    "comment": "Ready for Gate 1 review."
  }'
```

### Stage 2 Supplier Evaluation

```bash
curl -X POST http://localhost:3000/v1/products/{productId}/supplier-evaluation \
  -H "content-type: application/json" \
  -H "x-dev-user-id: {sourcingManagerUserId}" \
  -d '{
    "summary": "Two suppliers can support launch.",
    "scoringMethodology": "Weighted commercial and technical review",
    "suppliers": [
      {
        "supplierName": "Supplier A",
        "factoryName": "Factory A",
        "originCountry": "Malaysia",
        "moq": 1000,
        "leadTimeDays": 45,
        "paymentTerms": "30% deposit, 70% on shipment",
        "toolingNotes": "Existing mould available.",
        "sparePartsSupportNotes": "Maintains spare stock.",
        "weightedScore": "88.50",
        "isQualified": true
      },
      {
        "supplierName": "Supplier B",
        "factoryName": "Factory B",
        "originCountry": "Thailand",
        "moq": 1200,
        "leadTimeDays": 55,
        "paymentTerms": "LC at sight",
        "toolingNotes": "Minor tooling refresh required.",
        "sparePartsSupportNotes": "Quarterly replenishment.",
        "weightedScore": "84.00",
        "isQualified": true
      }
    ]
  }'
```

### Stage 2 Business Case

```bash
curl -X POST http://localhost:3000/v1/products/{productId}/business-case \
  -H "content-type: application/json" \
  -H "x-dev-user-id: {productOwnerUserId}" \
  -d '{
    "marketOpportunitySummary": "Premium desk fan category is expanding.",
    "productSummary": "Compact premium desk fan with quieter motor.",
    "yearOneRevenue": "1800000.00",
    "yearTwoRevenue": "2200000.00",
    "yearThreeRevenue": "2600000.00",
    "investmentNeeded": "450000.00",
    "riskSummary": "Supplier lead time is the primary risk.",
    "recommendation": "Proceed to launch readiness",
    "channelGpSummary": [
      {
        "channelName": "MTO",
        "expectedGpPercent": "27.50",
        "notes": "Base direct-channel assumption."
      }
    ],
    "financeNotes": "Tooling recovery inside year one plan.",
    "commercialNotes": "Prioritize premium urban retail."
  }'
```

## Current Assumptions

- Approval signatures are not stored as signature artifacts; approval actions, gate decisions, checkpoint records, and audit logs are the source of truth.
- Submitted templates remain editable while the product is in the matching stage unless a specific service blocks changes after a final decision.
- Stage 5 uses review/action endpoints instead of a `gate-5` route.
- Stage 6 can only start when Stage 5 has an approved EOL recommendation.
- File uploads, notifications, dashboards, exact ART threshold, and final production SSO are still stakeholder-dependent.
