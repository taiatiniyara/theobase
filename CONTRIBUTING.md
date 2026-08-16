# Contributing to Theobase

Theobase is fully open source (AGPL-3.0). A few things before you start.

## Read first

- `CONTEXT.md` — the domain language. Use its terms.
- `docs/adr/` — the decisions that shaped the architecture and the commercial model.

## License of contributions

All contributions are licensed under AGPL-3.0. By submitting a Contribution you agree to the Contributor License Agreement in `CLA.md`. The CLA does not take your copyright; it grants Taia Tiniyara, LLC the right to relicense your contribution — for example, to allow a future arrangement with the denomination without chasing every historical contributor for permission.

## Scope: code only

This repository contains **code only**. The denomination's **policy content** (fund charts, offering calendars, remittance percentages) is not in this repository and is not open-sourced (see ADR-0013). Do not commit policy data.

## Development

pnpm-workspaces monorepo (`packages/shared`, `packages/worker`, `packages/web`); React 18 + Vite, Biome for lint/format, `tsc --noEmit` for typecheck, Vitest + Playwright for tests (ADR-0022). See `docs/specs/deployment.md` and `docs/specs/testing.md`.

## Process

1. Open an issue first for anything beyond a small fix — the roadmap is public, and we would rather point you at the right place.
2. Fork, branch, and open a pull request against `main`.
3. Sign off each commit (`git commit -s`) and reference the issue.
4. Keep changes small and focused — one concern per pull request.

## Behavior

Be kind and patient. Contributors here are often volunteers, and the people the software serves are too.
