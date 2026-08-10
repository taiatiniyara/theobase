# ADR-0017: Legal — Terms & Privacy Policy

## Status

Accepted (2026-08-10)

## Context

Theobase collects PII and financial data. Legal documents must exist before production use.

## Decision

**Placeholder in v1, lawyer-reviewed before production launch.**

- Terms of Service hosted at `theobase.app/terms`.
- Privacy Policy hosted at `theobase.app/privacy`.
- Both carry a "DRAFT — Not yet legally reviewed" watermark in v1 development.
- Lawyer review engaged before the first real Conference activates.

### Privacy Policy — Content Outline

What the policy will cover (all already enforced by architecture):

| Section | Content |
|---------|---------|
| Data collected | Member PII (name, address, phone, email, DOB, photo), financial records, device info for observability |
| Data usage | Church operations, reporting, aggregate analytics for Conferences |
| Data sharing | No third parties. Data stays on Cloudflare. Conference sees aggregates only. |
| Retention | Giving records 7 years, membership + 3 years after removal, access logs 1 year, login logs 90 days |
| User rights | Export (full data), correction (clerk can edit PII), deletion (right-to-erasure with anonymization) |
| Security | TLS 1.3, AES-256 at rest, MFA for financial roles, append-only event log |
| Contact | Privacy requests: privacy@theobase.app |

### Terms of Service — Content Outline

| Section | Content |
|---------|---------|
| Service description | Church management platform for SDA churches |
| Customer | Conference/Mission (not individual churches) |
| Pricing | $3/church/month or $30/church/year |
| Cancellation | 90-day read-only access, full data export |
| Liability | Standard limitation |
| Governing law | Determined by Theobase's jurisdiction of incorporation |

## Consequences

- Placeholder docs carry risk if a real Conference activates before lawyer review. Mitigated by the "DRAFT" watermark and the fact that v1 launches with Fiji Mission (a single known customer, not an open signup).
- Privacy policy must be updated if observability data (device info, breadcrumbs) expands beyond what's described.
