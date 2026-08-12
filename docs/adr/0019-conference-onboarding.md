# ADR-0019: Conference Onboarding and Hierarchy Placement

## Status

Proposed (2026-08-13)

## Context

ADR-0018 defines the `orgUnit` tree and puts the operator in charge of upper-unit authoring ("Self-serve conference unit creation" is Killed; the operator creates conference/union/division units and grants their officers; churches self-register against an operator-created conference). It is silent on the *journey* a new conference walks to become a paying, placed tenant.

The honest constraint is governance: tithe and reporting flow *up* the hierarchy, so a conference's parent (Union/Division) is not cosmetic — attaching a node inside a Union is an authoritative act. Letting a self-serve actor pick a parent is a poisoning vector (a stranger could claim to be Fiji Mission). This separates two questions that the commercial posture ("self-serve, no sales call") tends to conflate:

1. **Onboarding journey** — signup, billing, first church, migration. This should be self-serve (CONTEXT: Conference Onboarding).
2. **Hierarchy placement** — where the conference sits in the tree. This must stay authoritative.

A registry of the published SDA structure (the Adventist Yearbook: ~13 divisions, ~100 unions, ~600 conferences) eventually makes placement a lookup instead of a review. Until that dataset ships, placement has to be a human (operator) gate, or the tree cannot be trusted, or it never grows.

## Decision

### 1. Self-serve journey, authoritative placement gate

The conference claim journey is self-serve up to the placement gate; the gate itself is operator-confirmed. "No sales call required" stays true: the system produces a complete, reviewable placement package and the operator confirms it — the same approve-don't-build posture as every report. The conference admin never types into the tree.

### 2. Claim-first: a placement request, not a unit

The conference admin signs in, files a **placement request** (conference name, territory, acceptable Union/Division suggestion derived from the existing tree), and the system drafts the unit record it *would* create. **No `orgUnit` row exists until the operator confirms.** No ghost units, no half-formed taxonomy, no contested parent ids. The request is a first-class row — a small `placement_request` table (id, requestedBy, name, territory, suggestedParentId, status) — so the queue is queryable and auditable. `orgAudit` records the request (`unit:requested`) and the eventual operator action (`unit:created`).

### 3. Phase 1: operator confirms a suggestion, not a form

The operator's approval queue shows each request with its canned suggestion (territory → Union/Division). One click confirms → the system creates the `org_unit` (level `conference`, kind `mission`, facets `[aggregator, subscribable]`, status `constituted`) under the chosen Union/Division and grants `conference-admin` + `conference-treasurer` via `roleGrant`. Operator can correct the suggestion instead of affirming it. `orgAudit` captures actor, before, after. This satisfies ADR-0018 §5 verbatim — the operator authors the unit — while the *request* is self-serve.

### 4. Billing is the activation gate

The placement gives a **constituted** (registered but not yet commercial) conference. Checkout (existing `/billing/stripe-checkout` + webhook) flips the unit `constituted → organized`. Only `organized` units may add churches. No billing, no live churches — protects the $3/church metering from metering unpaid tenants.

### 5. First church is provisioning, not registration

Adding a church is conference-admin-initiated but **operator-shaped**: the system provisions the child `org_unit` (parentId = conference, level `church`, facet `[tenant]`), provisions the Durable Object, and emails the church clerk a real invite backed by a durable `roleGrant` — replacing the one-off magic-link role from `handleChurchRegister` (`auth/register.ts`). The clerk's role survives the session, gets token-version invalidation, and is visible to grant-scoped queries. `/church/register` remains as the public fallback; conference-initiated onboarding is the primary path.

### 6. Phase 2 (future): registry-backed placement

When volume makes operator review a tax, import the published global structure as a **read-only reference** table (division/union/conference nodes with their canonical parentage). Placement becomes *select the node you already are* — still no free-form parenting, no operator time. The operator stays as exception handler for gaps and quirks (attached fields/missions). README of this ADR is that Phase 1's request table and suggestion logic are reused as-is; only the suggestion source changes from "operator" to "registry".

### 7. Sessions read grants

The conference journey does not work until the auth layer resolves sessions from `roleGrant` (the JWT carries the active grant's `unitId` + `role`, `tokenVersion` bumps on grant change — ADR-0018 §7). Wiring this is part of this body of work, not an afterthought.

## Killed

- Free-form self-serve placement (confirm ADR-0018's Killed entry — no self-serve unit creation, only self-serve *requests*).
- Shipped Yearbook reference data in Phase 1 (kept deliberately for Phase 2).
- Billing-before-placement ordering (placement comes first, billing activates).

## Consequences

- A conference exists as a request before it exists as a tree node; nothing half-formed ever appears in the published tree.
- The operator's queue is the entire per-conference human cost in Phase 1 — one click plus occasional correction.
- Church clerks get durable grants via invite rather than one-off links; `handleChurchRegister`'s inline role is superseded on the conference path.
- `/billing` webhook gains a side-effect (status flip), tying revenue to tenant activation for the first time.
- Phase 2 regresses nothing: the request queue and suggestion machinery carry over, the registry only changes where suggestions come from.