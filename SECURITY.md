# Security Policy

## Reporting a vulnerability

If you discover a security vulnerability in Theobase, please **do not** open a public GitHub issue. Instead, report it privately:

- **Email**: [security@theobase.app](mailto:security@theobase.app)

Include as much detail as possible:

- Description of the vulnerability
- Steps to reproduce
- Affected versions / components
- Any potential impact

You will receive a response within 48 hours. We will keep you updated on the remediation timeline and credit you in the release notes (unless you prefer to remain anonymous).

## Supported versions

| Version | Supported          |
| ------- | ------------------ |
| main    | :white_check_mark: |

Only the latest commit on `main` is supported. We recommend deploying from the latest release tag once a release cycle is established.

## What to expect

1. **Acknowledgment** (within 48 hours): We confirm receipt and begin triage.
2. **Triage** (within 5 business days): We assess severity, scope, and impact.
3. **Fix**: We develop and test a patch.
4. **Disclosure**: We release the fix and publish an advisory. We coordinate disclosure timing with the reporter.

## Scope

Theobase's security model covers:

- Authentication and authorization (JWT, role-based access, Durable Object enforcement)
- Data isolation between churches (one DO per church)
- PII protection (member data stays within the local church DO)
- Offline sync integrity
- API endpoints exposed by the Worker

## Out of scope

- Social engineering attacks against church officers
- Physical access to a church officer's unlocked device
- Vulnerabilities in third-party dependencies that have no available patch
- Theoretical attacks without a demonstrated proof of concept

## Architecture security notes

Theobase is designed with defense in depth:

- **Append-only event log** with SHA-256 hash chain per DO — tampering is detectable by construction.
- **Dual-signoff** for financial batches — two independent counters must confirm before commit.
- **Role-based access** enforced at the DO level on every mutation request.
- **PII isolation** — Conference and above see aggregates only; individual member data stays in the church DO.
- **Token version invalidation** — role changes and forced logout instantly revoke all existing JWTs.
- **Rate limiting** on auth endpoints.

For the full security architecture, see [docs/adr/0009-security.md](docs/adr/0009-security.md).
