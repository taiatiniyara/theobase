# Theobase — brand & identity

A steady, plainspoken, humble helper: calm enough to trust with money and membership, never cold, never preachy.

## Essence

Theobase speaks to the rural volunteer treasurer, the mission-office professional, and the policy-minded hierarchy at once, about the two things people guard most — their church's money and its membership.

- Dependable and calm, but the calm of a helper, not a bank.
- Plainspoken, because radical simplicity (ADR-0005) is a brand principle, not just a UI rule.
- Humble, because it serves the grassroots and never talks down to them.
- Reverent but not preachy — it lives in a church, but it is a tool, not a sermon.

Anti-brand: corporate fintech, trendy startup, ecclesiastical solemnity.

## Mark

A three-peak blue mountain. The base is the grassroots we serve; the three peaks point to the God we serve. "Theobase" reads as *the base of God's work*.

Keep the mark our own: no remixing of denominational iconography.

## Palette

- **Action blue** `#3B82F6` — buttons, active tabs, links.
- **Mark blues** `#60A5FA`, `#93C5FD` — mark and illustration only, never UI chrome.
- **Warm neutrals** for surfaces and text — never blue-gray, which reads as institutional.
- **Status colors, semantic only**: green = synced/complete, amber = pending/lapsing, red = blocked. State only, never decorative.

## Type

- **Wordmark**: Lexend.
- **Display / headings**: Lexend (bundled, open license).
- **Body / UI**: system font stack (SF / Segoe / Roboto / Noto) — locale and script coverage for free, no runtime fetch.

## In-app

The mark appears only at the edges: the app icon, the splash/loading screen, and empty states. The persistent header stays functional (unit context + sync pill), never a logo. The everyday brand is carried by color and voice; the mountain gets out of the way.

## Voice

- You, active, short.
- Never blame — missing prerequisites, not user failure.
- No cheerleading — no exclamation marks, no "great job."
- No gamification — no points, streaks, or badges; this is sacred work, not a game.
- Numbers plain and precise.

The test for any string: *would a rural treasurer read this and feel helped, not managed?*

## Positioning

Arms-length partner: name the church, never borrow its authority.

- "Built for the Seventh-day Adventist Church" is fine; "the official system of" is not, absent written denominational endorsement.
- Never use the denomination's logos, crest, or trade dress.
- Trust comes from competence — being policy-correct and evidence-backed — not from borrowed affiliation.

## Assets

- `tokens.css` — canonical CSS custom properties; source of truth for the hex values above.
- `icon.png` — app icon (500×500).
- `logo-full.svg`, `logo-full-light.svg` — wordmark lockups.
- `logo-icon.svg` — mark only.
- `cover.png` — banner (2000×741).
- `theobase.af` — source (Affinity Designer).
