# THEOBASE — Revenue Model

**Version:** 1.0  
**Status:** Draft from grilling session

---

## Model Overview

Theobase is a SaaS platform priced as denominational infrastructure — not commercial software. A local church or company pays $3 USD/month for unlimited access to all features.

| Dimension | Decision |
|---|---|
| **Type** | SaaS, recurring monthly subscription |
| **Subscribers** | Local churches and companies (organized groups not yet full churches) |
| **Pricing** | Flat rate: $3/church/month |
| **Features** | One price — everything included. No tiers, no add-ons, no premium modules. |
| **Scope** | Churches and companies only at launch. Entity model designed to accommodate schools, hospitals, and other institutions later without rearchitecture. |

---

## How Churches Subscribe

There are two paths:

### Path 1: Conference-Covered (primary)

1. A local church signs up and gets a **6-month free pilot** with full access — no credit card required.
2. The conference sees a dashboard: "12 of your churches are in pilot. 87 days remaining."
3. Before the pilot expires, the conference commits to covering those churches at $3/month each.
4. The conference receives a monthly invoice: "47 churches × $3 = $141. Bank transfer details below."
5. The conference pays via bank transfer. No Stripe, no per-church payment logistics.
6. If the conference does not commit before the pilot expires, the churches are prompted to switch to direct payment (Path 2) or their access becomes read-only.

### Path 2: Direct Subscription (fallback)

1. A church in a non-subscribing conference signs up and enters a Stripe card payment.
2. They get the same 6-month pilot. At the end, the card is charged $3/month until cancelled.
3. If their conference later opts into bulk coverage, the direct subscription is migrated under the conference account and the card charge stops.

### Path 3: Conference-Provisioned (onboarding shortcut)

1. A conference can pre-provision or invite its churches onto the platform.
2. Churches still activate their own accounts. A church that ignores the invite is not counted or billed.
3. A church that was not invited can still sign up independently — shows as "pending conference coverage."

---

## Pricing Justification

**$3/month is deliberately low.** It is not a promotional price, a loss leader, or a "we'll raise it later" trap.

| Argument | Detail |
|---|---|
| **Cost structure** | Theobase runs on Cloudflare's free tier (Workers, D1, R2, Pages). Marginal cost per church is near zero. A solo entrepreneur keeps payroll at zero. $3 × 1,000 churches = $3,000/month covers a full-time living with no burn rate. |
| **Denominational pricing** | This is church infrastructure — like the hymnal, the Church Manual, or the Sabbath School quarterly. It is priced for adoption, not profit. The institutional systems (ACMS, SunPlus) cost millions and serve the top. Theobase serves the bottom at a price the bottom can afford. |
| **Anchored against the status quo** | Theobase does not compete with Tithely ($119/month) or Planning Center. It competes with paper, spreadsheets, and WhatsApp. The $36/year price is less than what the average church already spends on photocopying, printer ink, and postage for the forms Theobase replaces. |
| **No hidden fees** | There are no setup fees, per-user charges, transaction fees, training fees, or support tiers. One price, everything included. The price does not change as the church grows. |

---

## Cancellation Policy

- A church may cancel at any time. No minimum term, no penalty.
- On cancellation, the church's data becomes **read-only** — viewable and exportable, but no new records can be created.
- **Full data export is always available** in open, portable formats (CSV, JSON, PDF). Theobase never holds data hostage. This is non-negotiable: conferences will not adopt a platform that could lock in their churches' membership records and financial history.
- 12 months after cancellation, data is archived. The church may request a final export at any point during the archive period.

---

## What Is Not Monetized

- AdventistGiving (member online giving) remains a separate, complementary platform. Theobase does not charge for or compete with it.
- Training content from Adsafe, ALC, or other SDA institutions is linked, not re-hosted.
- The platform is not ad-supported. No member data is sold, shared, or mined.
- There is no enterprise tier, no API metering, and no transaction fee on remittances or reports.

---

## Future Considerations

The following are explicitly deferred, not ruled out:

| Item | Status |
|---|---|
| Institutional subscribers (schools, hospitals, publishing houses) | Not in scope for launch. The data model supports adding entity types later, with domain-specific modules, at a different price point if appropriate. |
| Union-level negotiation | If a union wants to fund adoption across all its conferences, the same $3/church rate applies. The invoice goes to the union instead of the conferences. |
| Grants and donor funding | Acceptable for one-time costs (e.g., a translation sprint for a new language, an accessibility audit). Not for operating costs — the $3 should cover those on its own. |
| Price changes | Any price change applies to new subscribers only. Existing subscribers are grandfathered at their signup rate. This is stated at signup. |

---

*Derived from a grilling session. All decisions are provisional and may evolve with market feedback.*
