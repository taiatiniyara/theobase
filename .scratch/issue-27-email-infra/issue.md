# Issue 27: Email Infrastructure

## What to build

Email delivery system for weekly digest, giving receipts, monthly statements, annual tax statements, census campaigns, onboarding sequences, and re-engagement emails.

## Input/Output

**Input:** Email triggers (giving verified, month start, year start, census started, member added, 90 days inactive), member email preferences, church timezone
**Output:** Delivered emails: weekly digest, giving receipts, monthly statements, annual tax statements, census campaign sequence, onboarding sequence, re-engagement emails

## Validation Requirements

- Weekly digest: every Monday, auto-generated from church data, zero clerk involvement
- Giving receipt: sent within 5 minutes of treasurer verification
- Monthly statement: first week of month, includes full breakdown with YTD total
- Annual tax statement: January, downloadable PDF with treasurer signature
- Census campaign: Day 1, 7, 14, 21 escalating sequence; stops on confirmation
- Onboarding: Day 1, 3, 7 sequence; stops on engagement
- Re-engagement: triggered at 90+ days inactivity, single email (not a sequence)
- Every email: one CTA, PWA deep-link, plain text fallback, unsubscribe link
- No sends between 9 PM and 7 AM local time (member timezone)
- Batched sends: 100 emails per batch max, not individual
- No third-party content, no marketing, no fundraising
- Unsubscribe handled within 1 business day

## Acceptance Criteria

- [ ] Weekly Church Digest: auto-generated every Monday for all members
- [ ] Giving receipts: triggered on treasurer verification
- [ ] Monthly giving statements: auto-generated first week of month with tax-ready PDF
- [ ] Annual tax statements: auto-generated January with treasurer signature
- [ ] Census campaign: Day 1/7/14/21 escalating sequence
- [ ] New member onboarding: Day 1/3/7 sequence
- [ ] Re-engagement: 90-day inactive trigger
- [ ] One clear CTA per email
- [ ] Links open in PWA, not external browser
- [ ] Plain text fallback for basic email clients
- [ ] Unsubscribe link in every email
- [ ] Batched sends (not individual), respects quiet hours (9 PM - 7 AM)

## Blocked by

- Issue 1, 17, 18, 20

## Docs

- `docs/adr/0013-email-strategy-giving-receipts.md`
- `CHANGELOG.md`
