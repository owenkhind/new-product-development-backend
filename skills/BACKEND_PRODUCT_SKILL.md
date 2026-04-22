---
name: nest-backend-architect
description: build, review, refactor, and extend nestjs plus typescript backends for this stage-gate product development system backed by postgresql. use when generating production-grade modules, controllers, dto validation, services, repositories, listeners, api contracts, database design, workflow rules, approvals, pricing guardrails, or tests for the 17-template product lifecycle workflow. default to a modular monolith with feature folders, plain postgresql access, anti-n+1 query design, transactional integrity, clear inline comments, and unit plus integration tests.
---

# Nest Backend Architect

## Overview
Use this skill for the backend of the product lifecycle management system behind the stage-gate product development workflow. The default project context is a workflow-heavy internal platform that manages product registration, gate approvals, scorecards, supplier evaluation, channel pricing, launch readiness, post-launch reviews, and end-of-life clearance.

Default to a modular monolith built with NestJS, TypeScript, PostgreSQL, a lightweight SQL access layer, and a lightweight automated test setup unless the user explicitly overrides the stack.

## Project-specific references
Read these only when they are relevant:

- `references/plm-domain.md` for the 17-template stage-gate workflow, module boundaries, entity map, invariants, and ambiguous requirements that should be surfaced instead of guessed.
- `references/backend-review-checklist.md` before finalizing significant backend work in this project.
- `references/rbac-model.md` when the request touches users, roles, approvals, assignments, or admin override behavior.

## Default stack and project shape
Use these defaults unless the user asks otherwise:

- NestJS with strict TypeScript
- PostgreSQL with a lightweight SQL access layer
- Feature-based module folders under `src/modules`
- DTO validation with `class-validator` and `class-transformer`
- automated tests for unit and integration coverage
- Swagger decorators only when the user wants API docs or the codebase already uses them
- Redis or BullMQ only for real async or scheduled work, not by default

Prefer a modular monolith over microservices. Only split services when there is a clear operational reason.

## Working method
Follow this sequence every time:

1. Identify the feature boundary, user action, and business outcome.
2. Identify the write model, read model, permissions, invariants, and failure modes.
3. Design the database access pattern before writing controllers.
4. Keep controllers thin, DTOs strict, services focused, and repositories explicit.
5. Generate tests in the same pass as the feature and place them under the root `test/` folder, not inside feature source folders.
6. Cover the feature thoroughly before considering it done. Include all realistic success paths, validation failures, authorization failures, not-found cases, conflicts, invalid workflow states, rollback behavior, and boundary conditions that apply to the slice.
7. Run the relevant test suites after implementation. If any test fails, fix the feature or the test before moving on.
8. Only after the feature code and tests are passing should the work be committed and pushed.
9. Follow `skills/CODING_STANDARDS.md` for commit naming, branch naming when branches are used, and git hygiene.
10. Add concise inline comments for business rules, non-obvious design choices, and performance-sensitive code.
11. Critique the design before finalizing it. Remove duplication, over-coupling, and unnecessary abstractions.

If the request is underspecified but the feature is still clear enough to implement, proceed with reasonable defaults instead of stalling.
If a request touches stage transitions, approvals, pricing floors, or template interpretation, check `references/plm-domain.md` first and call out any conflicting rules before locking in the implementation.

## Architecture rules
Organize code by feature, then by responsibility inside the feature.

Use a folder structure like this unless the existing codebase uses a better pattern:

```text
src/
  common/
  config/
  database/
  enums/
  guards/
  interceptors/
  middleware/
  modules/
    <feature>/
      controllers/
      dto/
      services/
      repositories/
      listeners/
      mappers/
      types/
      constants/
      __tests__/
      <feature>.module.ts
  types/
```

Apply these rules:

- Put HTTP request and response mapping in controllers only.
- Put validation and transport-facing schemas in DTOs only.
- Put use-case orchestration and business rules in services.
- Put database access in repositories or narrowly scoped SQL access classes.
- Put shared enums in `src/enums`.
- Put cross-cutting guards, interceptors, and middleware in their root folders unless they are tightly coupled to one feature.
- Put global request and Express augmentation types in `src/types`.
- Put event reactions in listeners. Do not hide core business logic inside listeners.
- Put mapping logic in mappers when the transformation is reused or non-trivial.
- Keep modules cohesive. A feature module should expose a clear public surface.
- Prefer composition over inheritance.
- Use interfaces or abstract tokens only when they reduce coupling in a real way.
- Avoid creating `features/` alongside `modules/`; use one feature root consistently.

## Coding principles to enforce
Enforce these principles in generated code:

### SOLID
- **Single responsibility:** each class should have one reason to change.
- **Open-closed:** extend behavior through composition and focused collaborators instead of editing god classes.
- **Liskov substitution:** derived abstractions must remain behaviorally compatible.
- **Interface segregation:** keep contracts small and specific.
- **Dependency inversion:** depend on stable abstractions at module boundaries when it provides clear testability or decoupling value.

### Other design rules
- Keep code DRY, but do not create premature abstractions.
- Prefer explicitness over cleverness.
- Prefer pure helper functions for deterministic transformations.
- Keep side effects visible.
- Fail fast on invalid input.
- Return predictable, typed results.
- Use domain names that match the business language.

## Database and performance rules
Design for a remote PostgreSQL database. Minimize round trips and make query intent explicit.

### Mandatory rules
- Prevent N+1 queries. Never iterate over records and issue one query per item when a batched query, join, `include`, `select`, `groupBy`, or `in` filter can solve it.
- Avoid sequential `await` calls inside loops for database or network work.
- Select only the fields that are needed.
- Do not fetch large nested graphs by default.
- Require pagination for list endpoints.
- Prefer cursor pagination for high-volume or append-heavy tables.
- Use transactions for multi-step writes that must succeed or fail together.
- Add indexes for hot filters, foreign keys, unique lookups, and common sort paths.
- Make query count and expected access pattern obvious in the code or nearby comments when the path is performance-sensitive.
- Prefer bulk operations when creating or updating many records.
- Use database constraints to protect invariants instead of trusting application logic alone.

### SQL access guidance
- Encapsulate SQL access in repositories or clearly bounded data access classes.
- Select only the fields that are needed.
- Join related tables only when the related data is truly needed.
- Use transactions for atomic multi-table operations.
- When a feature needs complex read performance, consider dedicated read methods instead of reusing a generic repository method.
- When returning collections plus counts, structure the access pattern to avoid redundant queries.

### Slow-path review
When generating a feature, check for these risks and fix them before finalizing:

- per-row lookups
- accidental full-table scans
- missing index support for filtering and ordering
- large object graphs returned to the API layer
- duplicate queries across service and repository layers
- unnecessary serialization or mapping work

## API and validation rules
- Validate every external input with DTOs.
- Reject unknown or malformed data early.
- Use meaningful HTTP status codes.
- Separate external DTOs from internal persistence models.
- Keep controllers thin and deterministic.
- Keep error messages useful but not leaky.
- Model enums and statuses explicitly for workflow-heavy features.
- Prefer idempotent writes where the business action can be retried safely.

## Workflow-heavy backend guidance for this project
This project is a product lifecycle management backend. Use that domain by default when naming modules, DTOs, tables, states, and events.

Core bounded contexts usually include:

- product registration and stage progression
- gate reviews and approval chains
- art scorecards and screening decisions
- supplier evaluation and business case approval
- pricing rules and gp floor validation by channel
- launch readiness, listing confirmation, and go-live checks
- sell-in, weekly feedback, day-30 review, and scorecards
- abc classification, revamp, eol, and clearance execution
- audit logs, comments, attachments, and notifications
- users, roles, assignments, and policy checks

Prefer append-only logs for approvals and stage actions. Avoid silently overwriting decision history.
Treat `product` as the root aggregate and keep stage templates, approvals, and review logs as explicit related records rather than one giant table.

Use explicit workflow states such as:

- draft
- in_review
- approved
- rejected
- blocked
- archived

When a feature changes workflow state, validate the transition in the service layer and record an audit event.
When the user asks for a template-backed feature, map it to the stage and template definitions in `references/plm-domain.md` instead of inventing new business terminology.
When the user asks for user or approval logic, use the role and assignment model in `references/rbac-model.md` instead of collapsing everything into a flat admin/editor split.

## Testing contract
Always generate tests for the created or modified feature.

Feature completion rule for this project:

- a feature is not complete until its test coverage is added under `test/`
- the tests cover all meaningful scenarios for that feature
- the relevant test commands pass locally
- the change is then committed and pushed following `skills/CODING_STANDARDS.md`

### Minimum test bar
Generate both of these unless the user explicitly asks for less:

- **Unit tests** for service or policy logic
- **Integration-style tests** for controller, repository, or module behavior

### What to test
Cover the most important paths:

- happy path
- validation failure
- not found
- conflict or duplicate action
- permission or role failure when relevant
- transactional rollback when multi-step writes are involved
- workflow transition rejection when state changes are invalid
- formula and policy enforcement for ART scoring, GP floors, channel counts, or auto-escalation rules when relevant
- performance-sensitive batching behavior when the logic could accidentally regress into N+1
- empty or partial inputs where DTO rules or defaults matter
- role plus assignment combinations where access depends on both
- admin override behavior when the feature supports delegated or support actions

### Test style
- Use arrange, act, assert structure.
- Keep one main behavior per test.
- Prefer descriptive test names.
- Mock at the boundary, not everywhere.
- Avoid brittle tests that assert implementation noise.
- When testing service loops, assert repository call counts if that helps catch hidden per-item queries.
- Keep test files centralized under `test/unit`, `test/e2e`, or `test/helpers` as appropriate.

## Inline comment rules
Add inline comments, but do it with discipline.

Use comments for:

- business rules that are easy to misread
- workflow invariants
- query-shaping decisions made for performance
- non-obvious transaction boundaries
- security-sensitive behavior

Do not comment obvious syntax or restate the code line by line.

## Output contract for code generation
When using this skill to generate or refactor code:

1. Start from the domain and access pattern, not from scaffolding alone.
2. Produce complete, runnable code for the requested slice.
3. Include any needed file tree, schema changes, indexes, and migration notes.
4. Generate tests in the same response.
5. Preserve consistency with the existing codebase when the project already has conventions.
6. Call out real tradeoffs or unresolved risks briefly instead of pretending the design is perfect.
7. Prefer a clean first version over speculative extensibility.
8. If the user wants the work finalized in git, run the tests first, then commit and push only after they pass.

## Backend design checklist
Before finalizing an answer, verify all of these:

- controller is thin
- dto validates external input
- service owns business rules
- repository owns persistence access
- listener is not hiding core write logic
- no obvious N+1 or looped query pattern exists
- query shape is selective, paginated, and index-friendly
- transaction boundaries are clear
- tests exist and cover the critical paths
- inline comments exist where they add value
- names reflect the product lifecycle domain

## Reference files
Use these files when needed:

- `references/plm-domain.md` for the project domain and default module ideas
- `references/backend-review-checklist.md` for a final design and quality checklist
- `references/rbac-model.md` for role definitions, approval authorities, and admin override rules
