# ADR-0005: Member Proxy Entry

**Status:** Accepted
**Date:** 2026-07-21

## Context

Many church members do not have smartphones or are not comfortable using apps. However, the platform benefits from member participation — self-reporting contact changes, giving declarations, attendance, and service hours reduces clerk burden and enriches data quality. A member who enters data only for themselves is insufficient; they must be able to help others.

## Decision

Every Member role has the ability to **proxy-enter data on behalf of any other member in the same local Church**. Every proxy entry is tagged with `createdBy` (the entering user) and optionally `proxyFor` (the beneficiary member). The audit trail is preserved. All verification steps (treasurer approval for financial entries, clerk approval for transfer/baptism requests) still apply regardless of who entered the data.

## Alternatives Considered

1. **No proxy entry** — Only members can enter their own data. Rejected. Excludes a significant portion of the congregation and reduces data quality.
2. **Explicit proxy permission** — A member must be granted proxy rights by an officer. Rejected as unnecessary ceremony; the trust boundary is already the local church, and the verification layer catches errors.
3. **Officers only as proxies** — Rejected. Defeats the purpose of member participation; shifts the burden back to officers.

## Consequences

- **Inclusive**: non-tech-savvy members can participate through a family member, friend, or Sabbath School teacher.
- **Audit trail maintained**: every entry is attributable to a specific user. Abuse (intentional or accidental) is traceable and reversible.
- **Verification layer is critical**: since anyone in the church can enter data, the treasurer and clerk verification steps are not optional — they are the integrity gate. A financial entry that is not yet verified is clearly marked as pending.
- **No cross-church proxy**: proxies are scoped to the same Church. A member of Church A cannot enter data for a member of Church B.
