# Non-functional requirements

- **Performance** — TTI <2s on 3G, FCP <1.5s.
- **Accessibility** — WCAG 2.2 AA (`docs/ui.md`, `docs/research/ui-ux.md`): 48px touch targets (≥ WCAG 2.5.8's 24px), 4.5:1 text / 3:1 non-text contrast (SC 1.4.3, 1.4.11), financial commits reversible/checked/confirmed (SC 3.3.4), authentication offers a non-memory option (SC 3.3.8), no redundant re-entry (SC 3.3.7).
- **Retention** — giving 7 years; membership +3 years.
- **Availability** — RTO <1 hour, RPO <5 minutes.
- **Security** — SOC2-ready architecture, certification deferred. Append-only hash-chained event log (ADR-0019); officer attestation — a Passkey assertion over each event hash (ADR-0016, ADR-0022); dual signature distinct + unrelated (ADR-0014); a single third-party SaaS (Stripe) with everything else Cloudflare-native (ADR-0021).
- **Privacy** — right to erasure (officer-performed; member self-service is deferred by ADR-0017).
