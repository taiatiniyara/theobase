# Data Model

The concrete entity/relation contract behind the glossary (`CONTEXT.md`) and ADR-0019. The Drizzle schema is the source of truth.

## Core entities

- **Person** — system UUID (canonical key) + a non-enforced dedup hint (name + DOB + family) used only for CSV import matching. Fields: names, DOB, gender, contact (phone/email), address. No national-ID dependency.
- **Family** — a household; optional single head-of-household reference. A Person may be unassigned to a family.
- **Unit** — the org-tree node; kind ∈ {GC, Division, Union, Conference, District, Church, Company, Group, Branch}. The legal-parent matrix (which kind may parent which) is policy data, seeded from `CONTEXT.md`. States: constituted / organized (tenant lifecycle).
- **Office** — level-scoped to a unit kind. See `offices-actions.md`.
- **Appointment** — office + person + unit + authorizing act + open-ended effective period. Co-holders allowed; every act is attributed to the acting officer, not the office.
- **Action** — enum. See `offices-actions.md`.
- **Fund** — name + type ∈ {tithe, offering} + remittance split (tithe 100% upward; offerings a COP `{local%, upward%}` split). The fund chart is the set of funds.
- **Policy** — versioned, tree-scoped. See `policy-schema.md`.
- **Event** — the append-only log record (ADR-0007): `id`, `unit`, `type`, `occurredAt`, `recordedAt`, `author` (acting officer), `attestation` (the officer's Passkey assertion over the event hash), `evidence` refs, and a payload; a correcting event adds `voids`. See `event-catalog.md`.

## Derived (not tables)

- **Member** — a Person whose membership is a derived status from events: baptism puts them on the roll, transfer-out removes them. There is no separate Member table.
- **Roll / balances** — stored projections rebuilt from the log (ADR-0019), never hand-edited (ADR-0007).

## Operator-side tables

- `placement_request` — id, requestedBy, name, territory, suggestedParentId, status.
- `org_unit` — the operator's unit record (level, kind, facets `[aggregator, subscribable, tenant]`, status constituted/organized, parentId).
- `orgAudit` — audit entries for operator actions (`unit:requested`, `unit:created`, …).

## Finance entities

- **Envelope** — persistent and reusable; links a giver (Person or Family). Anonymous (envelope-less) giving is allowed.
- **Cash count** — the counting session. See `finance-module.md`.
- **Tithe & Offering** — the line items within a cash count (each a tithe or an offering against a fund).
- **Deposit** — links one or more cash counts (1:N); amount, date, bank reference, slip photo.
- **Disbursement** — amount, payee, fund/budget line, invoice/receipt photo, approval, dual signature.
- **Remittance** — computed amount, recorded as an event when actually sent.
