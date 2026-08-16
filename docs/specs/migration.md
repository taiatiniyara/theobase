# Migration

## v1 scope

Self-serve CSV import only. Paid ACMS/ACAS/eAdventist migration is a service, not v1 software (ADR-0010).

## CSV columns

name (required), DOB, gender, baptism date, membership status, family/head, address, phone, email (all else optional).

## Handling

Unresolvable rows go to a review queue — never silently dropped (T6). Import is scoped to the target unit; the imported roll is queryable under that unit.

## Transfer bridge vs one-time migration

CSV import is one-time onboarding. Adoption also needs an **ongoing transfer bridge**: members move between churches constantly and churches migrate at different times, so a two-sided transfer must cross the Theobase↔ACMS boundary via the Letter of Transfer (see `event-catalog.md`). Plan both — the import to get on, the bridge to keep moving.

## Per-platform out-paths (what each incumbent actually lets you take)

Traced to first-party docs in `../research/sda-platforms-migration.md`. The pattern: the denomination exposes data as **reports (printed/PDF/Excel), not APIs**, and the full roll is gated at the conference.

- **eAdventist (NAD membership)** — its full-roll CSV export was **deprecated Mar 2023**; the surviving API returns names/counts only (4 req/hr). A church's out-path is **printed FURs / family lists via the conference clerk**; transfers already route on paper/email through the conference clerk.
- **ACMS (GC, membership + finance)** — web-based; **no CSV/Excel export or public API documented**. Reports are in-system; its transfer docs already carry an "Off System Transfers" paper seam.
- **ACAS (SPD finance)** — reports are **PDF by default**; the **Excel Journal Export** exists but is documented for conferences/unions/divisions, not the local church.
- **Adventist Giving** — not a migration target; emits a twice-monthly **Deposit Report (PDF/CSV)** the treasurer posts to the books.

Implication: self-serve CSV import works only where a conference still produces that (deprecated) CSV or a PDF member list; everywhere else it is the **paid migration service**, and the **Letter-of-Transfer bridge is the only always-available interop artifact**.
