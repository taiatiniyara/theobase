# Theobase

An offline-first, phone-first information system for the grassroots of the Seventh-day Adventist Church: membership, finance, and ministry recorded at the local church and aggregated up through the denominational hierarchy, with church policy enforced by the software itself (compliance by construction).

**Open source, operated as a service.** The full source — the core and every module — is published under the GNU AGPL-3.0. Taia Tiniyara, LLC builds Theobase and sells the *operated* service, not the software. We are the **operator, not the licensor**: read it, run it yourself, fork it — all allowed. What a subscription buys is a system that runs itself.

- **Subscription** — a Conference or Mission (the Subscriber) pays a flat USD 3 per organized Church per month, covering every module and hosting (ADR-0010).
- **Self-hosting** — free and permitted, unsupported (ADR-0012).
- **Policy content** — the denomination's fund charts, offering calendars, and remittance percentages ship as a separate data feed and are not open-sourced (ADR-0013).

`CONTEXT.md` holds the domain language; `docs/adr/` holds the architectural and commercial decisions.

## Stack

The operated service runs entirely on Cloudflare — Workers, Durable Objects, D1, R2, Queues, Email Routing + Sending, Pages (ADR-0018). The application stack is React 18 + Vite + Tailwind + Zustand + XState + Dexie + i18next in a pnpm-workspaces monorepo, linted and formatted with Biome (ADR-0022). Stripe is the only third-party SaaS, used for subscription billing (ADR-0021).

## License

AGPL-3.0. See `LICENSE`.

## Contributing

See `CONTRIBUTING.md` — contributions are licensed under AGPL-3.0 and require agreement to `CLA.md`.
