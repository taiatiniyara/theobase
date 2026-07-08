# ADR 0013: Email Strategy and Giving Receipts

## Status

Accepted

## Context

Grassroots users may not check the app frequently, but most have email. Email serves as a persistent, offline-friendly communication channel for confirmations, receipts, and re-engagement. It also reinforces trust — members receive proof that their offerings were received and recorded.

## Decision

### Email Types

**Weekly Church Digest (auto-generated every Monday):**

- Attendance, upcoming events, prayer requests, new members
- Sent to all church members with email
- Zero clerk involvement

**Monthly Giving Statement (auto-generated first week of month):**

- Table: Date | Tithe | Offerings | Total per week
- Year-to-date total
- Downloadable PDF for tax purposes
- COP distribution breakdown

**Annual Tax Statement (January):**

- Full year summary with monthly breakdown
- Downloadable PDF with church letterhead and treasurer signature
- Designed for tax filing acceptance

**Giving Receipt (per transaction):**

- Triggered when treasurer verifies a MemberGiving record
- Confirms: "Your offering for July 5 has been recorded: $100 tithe, $50 offering"
- Links to giving history

**Census Campaign (multi-email sequence):**

- Day 1, 7, 14, 21 — escalating urgency
- Clerk steps in only after Day 21

**Onboarding (new member welcome):**

- Day 1, 3, 7 — guided introduction to Theobase features

**Re-engagement (dormant members, 90+ days inactive):**

- Auto-generated summary of church activity since last login

### Email Standards

- One clear call-to-action per email
- Links open in PWA, not external browser
- Plain text fallback for basic email clients
- Unsubscribe link in every email
- No marketing, no fundraising, no third-party content
- Quiet hours respected (no sends between 9 PM and 7 AM local time)

## Consequences

### Positive

- Members receive tangible proof of giving (trust builder)
- Tax-ready statements generated automatically
- Church stays connected even when members don't open the app
- Census campaign reduces clerk follow-up burden
- New members are guided into the product via email sequence

### Negative

- Email delivery infrastructure required
- Bounce management and unsubscribe handling adds complexity
- Email content generation requires template engine
- Localization needed for multi-language churches
