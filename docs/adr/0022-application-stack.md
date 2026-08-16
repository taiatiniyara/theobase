# The application stack

Theobase's application stack is React 18 + TypeScript built with Vite for both shells (the phone PWA and the Tauri office shell, ADR-0006), Tailwind over `tokens.css` for styling, Zustand for app and sync state with XState for the counting-room state machine, Dexie over IndexedDB for the offline write-ahead log, i18next for the friendly-label string layer, and Biome plus `tsc --noEmit` for lint/format/typecheck. We chose React because it is the best-supported target for both Tauri and RTL and the ecosystem contributors and agents already know; every other choice is the smallest dependency that does the job (Zustand, Dexie, XState, Biome) over a heavier alternative (Redux, a bespoke IDB layer, a hand-rolled state machine, ESLint + Prettier).

## Consequences

- Vite is the unified build tool across `packages/web`, `packages/shared`, and the Worker dev loop (via `@cloudflare/vite-plugin`).
- Turborepo is deferred until builds slow; plain pnpm workspaces suffice for three packages.
- Stripe is the sole third-party SaaS and is wired from the start (ADR-0021); billing is metered per organized Church on the operator surface.
- WebAuthn uses SimpleWebAuthn for attestation verification and assertions server-side, the raw API in the PWA; events are signed by the officer's Passkey assertion over the event hash (the `Attestation` in `CONTEXT.md`).
