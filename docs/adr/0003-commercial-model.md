# ADR-0003: Commercial Model — Conference Subscription

## Status

Accepted (2026-08-10)

## Context

Theobase is a SaaS platform. It must generate revenue to sustain development and Cloudflare infrastructure costs, but it must not create adoption friction at the local church level — the very churches that need it most (Fiji, rural areas, developing countries) have the least ability to pay.

## Decision

**The Conference/Mission is the customer. The local church never sees a bill.**

- **Unit**: per local church activated on the platform.
- **Price**: $3 USD per church per month, or $30 USD per church per year ($2.50/month equivalent, a 17% discount for annual commitment).
- **Billing**: invoiced to the Conference. Payment methods: card, bank transfer, mobile money (e.g. M-Pesa, Vodafone M-PAiSA in Fiji).
- **Scope**: the full platform. No feature gates. Every church gets membership, counting room, reporting, communication, migration, Yearbook, and analytics.
- **Add-ons** (optional): SMS credits (pass-through), extended data retention beyond 7 years, custom integrations.
- **Cancellation**: 90-day read-only access for affected churches. Full data export (CSV/JSON) always available. Churches belong to their Conference, not to the platform.
- **Grace period**: a Conference that misses payment doesn't lose access immediately. The system enters a 30-day warning period with in-app notices to Conference administrators. No church-level disruption.

## Rationale

1. **Adoption first.** A Fiji church treasurer cannot justify a software subscription. A Fiji Mission treasurer can — because they're already paying for admin overhead, data entry, and delayed reports.
2. **Simple to sell.** One decision-maker per Conference, not 200 individual churches. The value proposition is clear: replace days of manual report compilation with one-tap approval.
3. **Predictable revenue.** Per-church pricing scales linearly with adoption. Annual billing provides cash flow predictability.
4. **No lock-in.** Data export at any time, read-only access on cancellation. This is structurally different from platforms that hold data hostage.
5. **Fair pricing.** $3/church/month is negligible relative to the labour it replaces. Even a Conference with 500 churches pays $1,500/month — less than a single admin clerk's salary.

## Consequences

- Billing infrastructure (Stripe or equivalent) must handle multi-currency and mobile money.
- Per-church metering is required at the platform level — each DO activation counts against the Conference subscription.
- Grace period logic must be built into the authentication layer — a church doesn't get locked out mid-counting-room because the Conference finance department forgot to pay.
