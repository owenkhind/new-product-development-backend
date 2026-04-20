# Backend Review Checklist

Use this checklist before finalizing meaningful backend work for the product development system.

## Domain fit
- Does the feature map cleanly to an existing stage, template, or gate?
- Are names aligned with the business language from the product workflow?
- Did we avoid inventing a new concept when an existing template or stage already covers it?

## Architecture
- Is the controller thin and transport-only?
- Is validation handled in DTOs?
- Is orchestration and policy logic in services?
- Is persistence isolated in repositories or bounded SQL access classes?
- Are workflow changes explicit instead of hidden inside listeners or helpers?

## Data model
- Is `product` treated as the root aggregate instead of a dumping ground for every field?
- Are repeated reports modeled as one-to-many records?
- Are approvals and audit events append-only?
- Are important enums modeled explicitly?
- Are hot queries indexed appropriately?

## Workflow safety
- Are stage transitions validated?
- Are required templates enforced before gate approval or progression?
- Are ambiguous rules called out instead of silently guessed?
- Are approvals recorded with actor, outcome, and timestamp?

## Policy enforcement
- Are GP floors enforced where relevant?
- Are channel and pricing guardrails enforced in code, not only comments?
- Are auto-escalation conditions tested?
- Are destructive or irreversible workflow actions protected?

## API contract
- Are request DTOs and response DTOs separated from persistence models?
- Are status codes and error payloads predictable?
- Are list endpoints paginated?
- Are dangerous partial-update semantics avoided for workflow-heavy resources?

## Performance
- Any obvious N+1 or looped query pattern?
- Any sequential `await` inside loops for database work?
- Is the query shape selective rather than loading large nested graphs?
- Are transactional boundaries clear on multi-step writes?

## Testing
- Do tests cover happy path, validation failure, not found, conflict, and workflow rejection?
- Are formula-driven rules and thresholds tested where relevant?
- Is there at least one integration-style test for the main API path?
- Are call counts or batching behavior checked when N+1 regressions are plausible?
- Does it have all the possible scenarios tests here where it can be all scenarios that the user does not even thought of?

## Final sanity check
- Would another engineer understand the feature boundary quickly?
- Would an auditor be able to reconstruct who approved what and when?
- Would a future UI team have stable, explicit API contracts to build against?
