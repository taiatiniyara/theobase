# Security Audit

This document tracks Theobase's security posture, covering automated scanning, manual verification, and remediation of findings.

## Automated Scans

### npm audit

Run: `npm audit --production`

| Date       | High | Critical | Status |
| ---------- | ---- | -------- | ------ |
| 2026-07-26 | 0    | 0        | Clean  |

**Process**: Run `npm audit --production` monthly. For any high or critical findings:

1. Review the advisory URL.
2. If a fix is available, upgrade the dependency and re-run tests.
3. If no fix is available, document the finding below and assess risk.
4. Run `npm audit fix` for auto-fixable issues.

### Snyk

**Setup**:

1. Create a free Snyk account at https://snyk.io.
2. Connect the GitHub repository (`taiatiniyara/theobase`).
3. Enable "Monitor" for automatic scanning on pull requests and the main branch.
4. Alerts will appear under the Snyk dashboard for new vulnerabilities.

**What to look for**:

- **Critical/High severity** in production dependencies (`stripe`, `jose`, `hono`, `drizzle-orm`, `@tanstack/*`, `react`, `dexie`).
- **Known-exploit (Mature/Proof-of-Concept)** tags — prioritize these.
- **Malicious packages** — any flagged package needs immediate removal.

### OWASP ZAP

**Scan steps**:

1. Deploy to staging: `wrangler deploy --env staging`.
2. Download and launch [OWASP ZAP](https://www.zaproxy.org/).
3. Set target URL to the staging deployment (e.g., `https://staging.theobase.app`).
4. Run "Automated Scan" from the Quick Start tab.
5. After completion, review the Alerts tab for findings by severity.
6. Export the report (Report → Generate HTML Report) and archive it.

**Key areas to examine**:

- Authentication endpoints (`/api/auth/login`, `/api/auth/signup`, `/api/auth/refresh`)
- Authorization bypass attempts on protected routes
- Injection vectors in query parameters and request bodies
- CORS misconfigurations
- JWK header injection against JWT endpoints
- Rate limit bypass attempts

## Manual Checks

> **Note**: All manual checks require a staging deployment to verify. These are listed with their expected behavior based on code review but have not yet been confirmed against a live deployment.

| #   | Check                                  | Expected Behavior                                                                                                                                                                                                                                                                  | Verified |
| --- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 1   | **CSP header present**                 | `Content-Security-Policy-Report-Only` header is set on all responses by default (`CSP_REPORT_ONLY` not set to `"false"`). Policy: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://theobase.app;`        | [x] Code |
| 2   | **Rate limiting returns 429**          | After 5 requests/minute to auth endpoints, 300/min for GET, 100/min for writes, the API returns `429` with `{"error": {"code": "RATE_LIMITED", "message": "Too many requests. Please wait before retrying."}}` and a `Retry-After` header.                                         | [x] Code |
| 3   | **JWT expires after 15 minutes**       | Access tokens have a 15-minute expiry (`ACCESS_EXPIRY = "15m"` in `worker/lib/auth.ts`). After expiry, API returns `401` with `{"error": "Invalid or expired token"}`. Refresh tokens last 7 days.                                                                                 | [x] Code |
| 4   | **Passwords hashed with PBKDF2**       | Password hashing uses `PBKDF2` with 100,000 iterations and SHA-256 (Web Crypto API via `crypto.subtle.deriveBits`). Stored format: `salt_hex:hash_hex`. Plaintext passwords are never written to the database.                                                                     | [x] Code |
| 5   | **CORS restricted to ALLOWED_ORIGINS** | The `hono/cors` middleware only allows origins listed in `ALLOWED_ORIGINS` env var. If an origin is not in the list, the response uses the first allowed origin. Methods allowed: `GET`, `POST`, `PATCH`, `DELETE`. Headers: `Content-Type`, `Authorization`. Credentials: `true`. | [x] Code |
| 6   | **Per-Conference D1 tenancy**          | Each Conference's data resides in its own D1 database (`theobase-<code>`). Cross-Conference access is blocked at the middleware level: `requireConference()` checks `auth.conferenceId` and returns 403 if the user's conference does not match.                                   | [x] Code |
| 7   | **Audit trail append-only**            | The `audit_log` table is written to via `INSERT` only. No `UPDATE` or `DELETE` operations exist against audit records. All data changes call `logAudit()` before committing.                                                                                                       | [x] Code |
| 8   | **Dual-custody for financial batches** | Offering batches require two confirmations: first by the Treasurer (`POST /api/finance/batches`), then by the Assistant Treasurer or another authorized user (`POST /api/finance/batches/:id/confirm`). Batches are locked (immutable) after dual confirmation.                    | [x] Test |
| 9   | **Email verification required**        | New accounts must verify their email before gaining full access. Verification tokens expire after 24 hours. Unverified accounts cannot access protected routes.                                                                                                                    | [x] Test |
| 10  | **Billing guard enforces payment**     | After the 6-month trial and 7-day grace period, accounts enter `read_only` mode: GET requests succeed but POST/PATCH/DELETE return `402` with `{"error": "Subscription payment required. Please update your billing details."}`.                                                   | [x] Code |
| 11  | **Stripe webhook signature verified**  | Stripe webhook endpoints (`POST /api/billing/webhook`) verify the `stripe-signature` header using `STRIPE_WEBHOOK_SECRET` before processing the event.                                                                                                                             | [x] Code |
| 12  | **Reset token one-time use**           | Password reset tokens are single-use and time-limited. After use, the token is consumed and cannot be reused.                                                                                                                                                                      | [x] Code |

> **Code** = verified by code review / test coverage. **Test** = verified by automated integration tests. All items require a live staging deployment to confirm end-to-end behaviour under real Cloudflare infrastructure.

## Findings and Remediation

| ID  | Date | Severity | Description                                 | Status | Remediation |
| --- | ---- | -------- | ------------------------------------------- | ------ | ----------- |
| —   | —    | —        | No findings yet — populate after first scan | —      | —           |

### Remediation workflow

1. **Triage**: Assign a severity (Critical / High / Medium / Low).
2. **Investigate**: Determine if the finding is a true positive, false positive, or accepted risk.
3. **Fix**: Implement the remediation, test, and deploy.
4. **Verify**: Re-run the scan or manual check to confirm the finding is resolved.
5. **Close**: Record the resolution date and any notes.

## Scheduled Audits

| Frequency       | Activity                                      |
| --------------- | --------------------------------------------- |
| Monthly         | `npm audit --production`                      |
| Monthly         | Review Snyk alerts                            |
| Quarterly       | Full OWASP ZAP scan of staging                |
| Quarterly       | Review and rotate `JWT_SECRET`                |
| Annually        | Penetration test (third-party)                |
| On push to main | CI runs all tests, type checking, and linting |

## Responsible Disclosure

If you discover a security vulnerability in Theobase, please report it to **support@theobase.app**. We aim to acknowledge reports within 48 hours and provide an initial assessment within 5 business days. Please do not publicly disclose the vulnerability until we have had a reasonable opportunity to address it.
