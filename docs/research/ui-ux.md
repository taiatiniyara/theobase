# Theobase UI/UX — primary-source research note

What would make Theobase's surfaces genuinely excellent, traced to the organizations that own the guidance. Every recommendation is cited to a primary source (W3C/WCAG, GOV.UK Design System, Google/web.dev, Apple, Nielsen Norman Group, passkeys.dev/FIDO). No secondary write-ups.

Scope: the six Theobase surfaces — Today/home, counting room + numeric entry, evidence capture, reports, onboarding/PIN, offline/sync — plus one cross-cutting foundations section, because accessibility (WCAG 2.2 AA + a screen-reader counter), low-literacy users, and low-end/offline devices apply to every surface at once.

## Cross-cutting foundations (apply to every surface)

These are the constraints that shape everything else, in Theobase's own terms: a phone-first, offline-first PWA for volunteer clerks/treasurers/counters in rural, low-connectivity regions; often low-literacy, on low-end Android, in multiple languages (Fijian Hindi).

- **Write at a 6th-grade reading level on the primary surfaces, 8th-grade elsewhere.** NN/g's lower-literacy study found lower-literacy users "plow" text word-for-word, can't scan, and skip dense content; rewriting a site to these levels raised lower-literacy users' task success from 46% to 82% and cut time from 22.3 to 9.5 minutes — without hurting higher-literacy users. This is the empirical case for Theobase's friendly-label layer ("Disbursement" → "Pay out") as a first-class requirement, not a nicety. [Nielsen Norman Group, "Lower-Literacy Users"](https://www.nngroup.com/articles/writing-for-lower-literacy-users/)

- **Single main column; put the main point first; avoid scrolling; avoid moving text.** Lower-literacy users have a narrow field of view and miss page elements outside the main flow, and scrolling breaks their concentration. Keep each action in one linear column with the primary action at the top. This also helps low-vision users and small phone screens. [NN/g, "Lower-Literacy Users"](https://www.nngroup.com/articles/writing-for-lower-literacy-users/)

- **Simplify navigation to a linear list.** Lower-literacy users can't scan a 2-D layout of options; they read each option word-for-word. Theobase's "bottom tabs, then More" and "opening a module shows the actions the office may perform" already follow this; resist adding a second tier of parallel navigation. [NN/g, "Lower-Literacy Users"](https://www.nngroup.com/articles/writing-for-lower-literacy-users/)

- **Labels always above fields; never use placeholder text as a label or hint.** Placeholder text vanishes on typing, breaks checking/error-fixing, is misread as a pre-filled value, and has poor default contrast that fails WCAG 1.4.3; not all screen readers read it. Place the label and any hint outside the field, always visible. [NN/g, "Placeholders in Form Fields Are Harmful"](https://www.nngroup.com/articles/form-design-placeholders/) · [GOV.UK, Text input component](https://design-system.service.gov.uk/components/text-input/) (links placeholder-contrast failure to [WCAG 1.4.3](https://www.w3.org/TR/WCAG22/#contrast-minimum))

- **Meet WCAG 2.2 AA, with Theobase's own stricter floors on top.** The relevant criteria and their floors:
  - Text contrast 4.5:1 (3:1 for large text) — SC 1.4.3; non-text UI components and graphics 3:1 — SC 1.4.11.
  - Pointer target size ≥ 24×24 CSS px (AA) — SC 2.5.8. Theobase's 48px mandate exceeds this and is the right call for low-end, low-precision touchscreens.
  - Keyboard-operable — SC 2.1.1; visible focus not obscured by sticky UI — SC 2.4.11 (new in 2.2).
  - Programmatic labels — SC 1.3.1, 3.3.2, 2.4.6.
  - Don't require re-entering information the user already gave — SC 3.3.7 (new in 2.2).
  - Authentication must not force a memory/transcription "cognitive function test" unless an alternative (e.g. biometric/passkey) is offered — SC 3.3.8 (new in 2.2).
  - Error prevention with at least one of reversible/checked/confirmed for legal or financial data — SC 3.3.4.
  [W3C, WCAG 2.2](https://www.w3.org/TR/WCAG22/) · [W3C, "What's New in WCAG 2.2"](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/)

- **Verify the brand palette against those floors.** `tokens.css` is the source of truth; action blue `#3B82F6` and the status greens/ambers must hit 4.5:1 against their text, and 3:1 for any color-only state indicator. State must never be conveyed by color alone (see offline section). [W3C, WCAG 2.2](https://www.w3.org/TR/WCAG22/) · [web.dev, "Offline UX design guidelines"](https://web.dev/articles/offline-ux-design-guidelines)

- **Icons are always paired with text labels.** Icons alone are ambiguous and inaccessible. [web.dev, "Offline UX design guidelines"](https://web.dev/articles/offline-ux-design-guidelines) (reinforces the rule already in `docs/ui.md`)

- **Design for low-end devices and expensive data.** Google's guidance for the next billion users: low-end devices are the norm (limited memory, storage, processing, small low-quality touchscreens); data is expensive; be transparent and frugal, simplify to speed tasks, and ask before downloading anything heavy. This underpins Theobase's no-runtime-font-fetch, bundled Lexend, and offline-first stance. [web.dev, "Offline UX design guidelines" — "Design for the next billion"](https://web.dev/articles/offline-ux-design-guidelines)

## Today / home (task-first)

The Today view lists Obligations and events awaiting authorization. It is the front door for the volunteer treasurer.

- **One action per screen, main point first, no scrolling where avoidable.** A task list works because each obligation is a single clear next step. Present the list in one column, newest/most-urgent first, each item a short plain-language verb ("Count today's offering") rather than a domain term. [NN/g, "Lower-Literacy Users"](https://www.nngroup.com/articles/writing-for-lower-literacy-users/) · [GOV.UK, "Question pages"](https://design-system.service.gov.uk/patterns/question-pages/)

- **Ask only what is needed; never re-ask.** WCAG 3.3.7 "Redundant Entry" (new in 2.2) requires previously entered information to be auto-populated or selectable rather than re-typed within the same process. For Today this means a tap on an obligation should carry forward everything Theobase already knows (unit, date, office) so the volunteer only does the genuinely new act. [W3C, "Understanding Redundant Entry"](https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry)

- **A block always points to the path forward.** `docs/ui.md` already says "never a bare refusal." NN/g's form guidance is the same principle: don't set users up for failure with secret rules; explain the requirement up front. When an obligation is blocked (missing prerequisite, authority lapse), state exactly what is missing and link to it. [NN/g, "Website Forms Usability"](https://www.nngroup.com/articles/web-form-design/)

- **Calm empty state = one clear next action.** "First run sets the PIN and nothing else; no forced tutorial; calm empty state" (`docs/ui.md`) is correct, but the empty state still needs a single visible next step for a user who plows rather than scans. Point to the one thing to do next in plain words, not a feature tour. [NN/g, "Lower-Literacy Users"](https://www.nngroup.com/articles/writing-for-lower-literacy-users/)

## Counting room + numeric entry

The killer demo (`docs/strategy.md`): dual-signature cash counting with a custom numeric keypad, fund-first line items, auto-sum, pass-the-phone.

- **For numeric amounts, use a text input with a numeric keypad, not a spinbox or free-form keypad that misbehaves.** GOV.UK implements numeric fields (sort code, account number) as `type="text"` with `inputmode="numeric"` and `spellcheck="false"`, so users get a numeric keypad without the accessibility and formatting problems of `type="number"`. Theobase's custom keypad is a legitimate equivalent, but it must (a) be announced correctly to screen readers and (b) never swallow or reformat input in a way the counter can't see — keep the full entered value visible at all times. [GOV.UK, "Bank details" pattern](https://design-system.service.gov.uk/patterns/bank-details/) · [GOV.UK, "Text input" component](https://design-system.service.gov.uk/components/text-input/)

- **A blind counter must be able to count via the screen reader.** This is an explicit Theobase requirement. Concretely: every keypad key and every line item is a labeled control (SC 1.3.1/3.3.2), the running total is announced as it changes (a live region), and the whole flow is reachable by keyboard (SC 2.1.1). The "one thing per page" pattern helps here — screen-reader users hear the heading once rather than duplicated across a label. [W3C, WCAG 2.2](https://www.w3.org/TR/WCAG22/) · [GOV.UK, "Text input" — set the label as the page heading](https://design-system.service.gov.uk/components/text-input/)

- **Show the auto-sum prominently and persistently.** The sum is computed, never edited (`docs/ui.md`). Keep it visible during entry so the counter can self-check against the physical count — matching NN/g's rule that users must be able to see their full entry and check work before submitting. [NN/g, "Website Forms Usability" — "match fields to the type and size of the input"](https://www.nngroup.com/articles/web-form-design/)

- **Large, well-spaced targets.** Every keypad key and action button ≥ Theobase's 48px (already above the WCAG 2.5.8 floor of 24×24px). Keep adequate spacing between keys so a hand-tremor user or a low-quality touchscreen doesn't hit the wrong digit. [W3C, "Understanding Target Size (Minimum)"](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)

- **Confirmation before committing money is a WCAG AA requirement, not just prudence.** SC 3.3.4 (Error Prevention — Legal, Financial, Data) requires at least one of reversible / checked / confirmed for financial submissions. Theobase's "committed when both counters confirm" already satisfies this; the mismatch→disputed→reconcile branch is the "checked" path. Keep the commit step a distinct, explicit confirm with the total stated in words and numbers. [W3C, WCAG 2.2 SC 3.3.4](https://www.w3.org/TR/WCAG22/#error-prevention-legal-financial-data)

- **Pass-the-phone: state whose turn it is, unambiguously.** The dual-signature handoff between two counters on a shared device needs an explicit, plain-language "now [name] signs" moment (name + step, not an icon or color). This is the offline "inform users of state" rule applied to a handoff. [web.dev, "Offline UX design guidelines"](https://web.dev/articles/offline-ux-design-guidelines)

- **Reconcile on mismatch without re-entering everything.** Where a second counter's tally differs, let them correct the one diverging line item; don't clear the whole sheet. "Don't clear fields on error; keep passing and failing answers so users can edit rather than re-enter" is GOV.UK's stated rule. [GOV.UK, "Error message" component](https://design-system.service.gov.uk/components/error-message/)

- **Avoid drag/slider controls for amounts.** GOV.UK explicitly advises against range sliders, which are hard for some users to operate; every slider needs a non-drag alternative (WCAG 2.5.1). A keypad is the correct alternative for Theobase. [GOV.UK, "Question pages" — "Using range sliders"](https://design-system.service.gov.uk/patterns/question-pages/)

## Evidence capture (camera-first)

Evidence is one-tap camera with "choose from device" as secondary; images/PDFs bound immutably to the event (ADR-0009).

- **Near-zero-effort capture is a compliance requirement, and it has UX requirements of its own.** The camera must be reachable via keyboard/switch as well as tap (SC 2.1.1), and "choose from device" must be a real, labeled alternative so a user who can't photograph (or can't hold the phone) can attach evidence. [W3C, WCAG 2.2 SC 2.1.1](https://www.w3.org/TR/WCAG22/)

- **Show capture state immediately and in multiple ways.** After a photo is taken, tell the user it was saved and that it will sync later ("Photo saved · will send when you next sync"), using text plus a visual cue — not a lone icon or color. This reassures the volunteer the evidence is safely stored offline, which is the moment trust in the anti-fraud story is made or lost. [web.dev, "Offline UX design guidelines" — "Show the state of an action by giving feedback"](https://web.dev/articles/offline-ux-design-guidelines)

- **Reassure, don't block.** An offline photo must not trigger a blocking modal that waits for upload. Queue it and let the volunteer continue. "Avoid network requests that block content… queue tasks that will be performed and synced when the connection has improved." [web.dev, "Offline UX design guidelines"](https://web.dev/articles/offline-ux-design-guidelines)

## Reports (auto-populate, one-tap approval)

The Tithe & Offerings and statistical reports are projections requiring only human approval (ADR-0007).

- **Show the computed report as a check-and-confirm, not a form.** Because the report auto-populates, the interaction is review, not entry: present values read-only and clear, then a single "Approve" action. This maps directly to the "checked/confirmed" clause of SC 3.3.4 for financial data. [W3C, WCAG 2.2 SC 3.3.4](https://www.w3.org/TR/WCAG22/#error-prevention-legal-financial-data)

- **Make approval deliberate and error-proof.** One-tap approval is a feature, but the tap target must be large (48px) and the confirm must be unambiguous. If approval can't be undone (it appends an event, never edits — ADR-0007), say so before the tap, not after. [W3C, WCAG 2.2 SC 3.3.4](https://www.w3.org/TR/WCAG22/#error-prevention-legal-financial-data) · [W3C, "Understanding Target Size (Minimum)"](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)

- **Numbers plain and precise; nothing else on the approval screen.** The brand voice ("numbers plain and precise," "no cheerleading") is the right content direction for a sacred-money report. Keep totals in both words and digits for low-literacy confidence, and avoid any gamification-look (streaks, badges) — already prohibited in `branding/BRAND.md`. [NN/g, "Lower-Literacy Users"](https://www.nngroup.com/articles/writing-for-lower-literacy-users/)

## Onboarding / PIN (device-local, no accounts)

Per-person PIN on a provisioned device, signed by a Passkey; PIN doubles as offline signature; PIN reset is clear-not-set by a second officer (ADR-0015/0016).

- **Offer biometrics wherever the device has them; never make remembering the PIN the only way in.** WCAG 2.2 SC 3.3.8 (Accessible Authentication, AA) prohibits requiring a memory/transcription "cognitive function test" as the only authentication step; a passkey/biometric is the accepted alternative. Theobase already makes the PIN "or biometric" and binds identity to a Passkey — surface the biometric option prominently during PIN set-up and at unlock. [W3C, "Understanding Accessible Authentication (Minimum)"](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum) · [passkeys.dev, "What are passkeys?"](https://passkeys.dev/docs/intro/what-are-passkeys/)

- **PIN entry uses the numeric keypad and is announced correctly.** Same rule as the counting room: numeric `inputmode`, no silent reformatting, the value's presence (not the digits) indicated accessibly. Avoid hidden "caps/scroll" surprises. [GOV.UK, "Bank details" pattern (numeric `inputmode`)](https://design-system.service.gov.uk/patterns/bank-details/)

- **Provision at a moment the user is already acting, with informed consent, and skip the passkey step if the device can't do it.** passkeys.dev's bootstrapping guidance: check `isUserVerifyingPlatformAuthenticatorAvailable()` first, abort gracefully if unsupported, and give fully informed consent about who can unlock the device. This maps to Theobase's provisioning via code/QR and the "first run sets the PIN and nothing else" minimalism. [passkeys.dev, "Bootstrapping"](https://passkeys.dev/docs/use-cases/bootstrapping/)

- **Don't force a tutorial; but DO say in one line what the PIN unlocks.** "No forced tutorial" (`docs/ui.md`) is right for a plow-don't-scan user. A single plain sentence at first run — "This PIN signs your counts on this phone" — is onboarding without a tour. [NN/g, "Lower-Literacy Users"](https://www.nngroup.com/articles/writing-for-lower-literacy-users/)

- **PIN reset (clear-not-set) must be written as a path forward, not a refusal.** When a second officer clears the PIN, the message is about what happens next (the owner sets a new one), never "access denied." Matches `docs/ui.md` ("a block always points to the path forward") and GOV.UK's rule that ineligibility/permission problems belong on a dedicated "what to do next" page, not an error message. [GOV.UK, "Error message" — "When not to use this component"](https://design-system.service.gov.uk/components/error-message/)

## Offline / sync (sync-status pill)

Ambient pill (Offline/Syncing/Synced · since); unsynced badge; authority-lapse warning before lease expiry (90 days).

- **State the connection status in the user's own words, not the word "offline".** Non-technical audiences misunderstand "offline"; use action-based language about what they can and can't do. Distinguish "You are disconnected" (their end) from "The network is down" (Theobase's end). The sync pill is exactly the right widget; the labels are the thing to get right. [web.dev, "Offline UX design guidelines"](https://web.dev/articles/offline-ux-design-guidelines)

- **Never signal state by color alone.** The sync pill's green/amber/red must be accompanied by text ("Synced", "Syncing", "Offline") and/or an icon. "Using only color to show state can be… completely inaccessible." This is both a WCAG 1.4.11 concern and a direct web.dev offline rule. [web.dev, "Offline UX design guidelines"](https://web.dev/articles/offline-ux-design-guidelines) · [W3C, WCAG 2.2 SC 1.4.11](https://www.w3.org/TR/WCAG22/#non-text-contrast)

- **Show "when" and reassure "will send."** The pill's "· since" timestamp is the right pattern (web.dev's currency-converter example: always show the last time content was updated). For unsynced events, the "not yet synced" badge should say what will happen ("Sends next sync"), not just flag a deficit. [web.dev, "Offline UX design guidelines"](https://web.dev/articles/offline-ux-design-guidelines)

- **Don't block actions offline; queue and sync.** Volunteers must keep counting/capturing with no connection. Any action that would need the network must queue, not modal-block. [web.dev, "Offline UX design guidelines" — "Don't block content"](https://web.dev/articles/offline-ux-design-guidelines)

- **The authority-lapse warning is an "educate + path forward" message.** The 90-day lease (warning → block) must be explained in plain language *before* it blocks, with the concrete fix (sync now, or ask the mission office). Say what is happening, what it means, and exactly how to fix it — the same discipline as a good error message. [web.dev, "Offline UX design guidelines" — "Educate the user"](https://web.dev/articles/offline-ux-design-guidelines) · [GOV.UK, "Error message" — "Be clear and concise"](https://design-system.service.gov.uk/components/error-message/)

- **Skeleton/loading feedback for sync and first load.** While content loads (or a sync completes), show that something is happening so it doesn't look broken; a labelled loading state beats a blank screen. [web.dev, "Offline UX design guidelines" — "Use skeleton layouts and other feedback mechanisms"](https://web.dev/articles/offline-ux-design-guidelines)

## Sources

Every URL relied on above:

- W3C — WCAG 2.2 (Recommendation): https://www.w3.org/TR/WCAG22/
- W3C — What's New in WCAG 2.2: https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/
- W3C — Understanding Target Size (Minimum) (2.5.8): https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- W3C — Understanding Accessible Authentication (Minimum) (3.3.8): https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum
- W3C — Understanding Redundant Entry (3.3.7): https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry
- GOV.UK Design System — Text input: https://design-system.service.gov.uk/components/text-input/
- GOV.UK Design System — Bank details pattern: https://design-system.service.gov.uk/patterns/bank-details/
- GOV.UK Design System — Question pages: https://design-system.service.gov.uk/patterns/question-pages/
- GOV.UK Design System — Error message: https://design-system.service.gov.uk/components/error-message/
- GOV.UK Design System — Error summary (referenced): https://design-system.service.gov.uk/components/error-summary/
- GOV.UK Design System — Validation pattern (referenced): https://design-system.service.gov.uk/patterns/validation/
- web.dev — Offline UX design guidelines: https://web.dev/articles/offline-ux-design-guidelines
- web.dev — Learn PWA / Offline data: https://web.dev/learn/pwa/offline-data
- Nielsen Norman Group — Lower-Literacy Users: https://www.nngroup.com/articles/writing-for-lower-literacy-users/
- Nielsen Norman Group — Placeholders in Form Fields Are Harmful: https://www.nngroup.com/articles/form-design-placeholders/
- Nielsen Norman Group — Website Forms Usability: Top 10 Recommendations: https://www.nngroup.com/articles/web-form-design/
- passkeys.dev (FIDO Alliance / W3C WICACG) — What are passkeys?: https://passkeys.dev/docs/intro/what-are-passkeys/
- passkeys.dev (FIDO Alliance / W3C WICACG) — Bootstrapping: https://passkeys.dev/docs/use-cases/bootstrapping/

### Notes on sources not fully fetched

- **Apple Human Interface Guidelines** (https://developer.apple.com/design/human-interface-guidelines/layout) and **Material Design accessibility** (https://m2.material.io/design/usability/accessibility.html) are JavaScript-rendered and returned no content to a text fetcher. Their canonical touch-target figures (Apple 44×44pt, Material 48×48dp) were therefore **not** relied on in this note; touch-target recommendations are anchored on WCAG 2.5.8 (24×24 CSS px, AA) plus Theobase's own 48px mandate.
- **Baymard Institute** was omitted: its detailed form/input guidelines are gated behind paid research, and the open GOV.UK and NN/g primary sources already cover mobile form and numeric-input guidance authoritatively.
- **Google "Build for Billions"** (`developer.android.com/build-for-billions`) was unreachable from this environment; the equivalent Google guidance ("Design for the next billion" — low-end devices, expensive data, low literacy) is sourced from web.dev's Offline UX design guidelines instead.
