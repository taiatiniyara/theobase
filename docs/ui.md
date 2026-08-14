# Theobase UI — interaction model

Task-first, phone-first, radically simple: the app does the thinking; the volunteer does the action. Compliance is enforced by construction (ADR-0003); simplicity beats capability (ADR-0005).

## Navigation

- **Home is "Today"** — task-first. Lists Obligations (see `CONTEXT.md`) and events awaiting authorization.
- **Phone**: bottom tabs — Today first, then up to three pinned modules, then More (overflow). **Desktop**: the same items, as a left sidebar.
- **Modules are action-first**: opening a module shows the actions the office may perform; records sit one level down as read-only projections (ADR-0007).

## Acting

- Forms are fund-first line items with auto-sum; the remittance split is hidden (computed, never edited).
- Evidence is camera-first (one tap), with "choose from device" secondary; images and PDFs, bound immutably to the event (ADR-0009).
- Dual signature is pass-the-phone; the second signer may defer, leaving the event awaiting authorization (distinct + unrelated, ADR-0014).
- "Fix this" corrects mistakes: void if the event is incomplete, record a correcting event if it is valid (ADR-0007).

## Compliance

- Actions the office cannot perform are not rendered (office → action, ADR-0014).
- A block always points to the path forward (the missing prerequisite), never a bare refusal.
- Funds are constrained to the fund chart; no free-text categories (ADR-0003).

## Offline & sync

- Ambient sync pill (Offline / Syncing / Synced · since); auto-sync, with manual "sync now" in More.
- Unsynced events carry a "not yet synced" badge.
- Authority-lapse warning before lease expiry (policy-scoped, default 90 days; ADR-0016).

## Identity & onboarding

- No accounts; per-person PIN on a provisioned device (ADR-0015), hardware-bound (ADR-0016).
- First run sets the PIN and nothing else; no forced tutorial; calm empty state.
- PIN reset is clear-not-set by a second officer; device loss is handled by the mission office (ADR-0016).

## Office surfaces

- Office-only: **Churches** (subtree browser) and **Reports** (projections scoped to the subtree).

## Labels & language

- Friendly-label layer over domain terms — default to the term, override jargon ("Disbursement" → "Pay out"). Labels live in the i18n-ready string layer (English-first).
- Icons are always paired with labels.

## Brand

- Follow `branding/BRAND.md` for the mark, palette, type, voice, and positioning.
