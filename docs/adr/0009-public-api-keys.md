# Public REST API with API-key management

Theobase exposes a public API for unions, missions, and third-party systems to integrate with. API keys are issued per consumer with configurable rate limits and usage quotas. Webhook subscriptions enable event-driven integration (e.g., notify an external system when a quarterly report is submitted). The public API shares the same Hono router as the internal API but uses API-key auth instead of JWT. This is additive to the existing internal REST API (ADR-0005) — it does not replace or bifurcate it.
