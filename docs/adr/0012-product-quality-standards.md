# ADR 0012: Product Quality Standards

## Status

Accepted

## Context

Theobase must be a product churches recommend to other churches. The quality bar is set by the grassroots user experience, not by feature count. Every quality decision flows from one question: "Would a church clerk tell another church clerk to switch?"

## Decision

### Performance Standards

- PWA initial load under 500KB (code-split by route)
- Page transitions under 100ms (feel instant)
- API responses under 10KB, works on 2G/3G
- Works offline for core tasks (add member, record giving, check reports)
- Photo compression client-side before upload
- No GPU-heavy animations; respect `prefers-reduced-motion`

### Reliability Standards

- Auto-save always — no "Save" button, just a "Saved" indicator
- Offline queue with auto-sync when reconnected
- Undo instead of confirm for non-destructive changes
- Automatic backup via infrastructure (D1, R2) — no user action needed
- Immutable audit log for every change
- Feature-level isolation — one failure doesn't cascade

### Accessibility Standards (WCAG 2.1 AA)

- Full screen reader support (VoiceOver, TalkBack)
- Color never the only signal (icons + text)
- Font scaling respected — layouts reflow, never overflow
- Touch targets >= 44x44px at all font sizes
- High contrast mode supported

### Consistency Standards

- Every list, form, detail page follows the same pattern
- Never mix terms (Member vs Person, Submit vs Save)
- Domain glossary governs all UI labels
- Same component behavior everywhere

### Discoverability Standards

- Empty states teach the next action ("Add your first member")
- Success states guide to the next logical step
- Search finds everything (members, reports, actions)
- Fuzzy matching for typos
- No tooltips, no help icons, no onboarding carousels

### Referral Triggers (Built-in)

- "The quarterly report was already complete" — auto-generated reports
- "I trained the new clerk in 5 minutes" — zero-training design
- "My Conference admin saw the data before I sent it" — live data
- Shareable reports — one-tap PDF or view-only link
- "Invite your Conference" — administrative adoption path

## Consequences

### Positive

- Product quality visible to users, not just developers
- Adoption spreads organically through referrals
- Grassroots users feel confident, not frustrated
- Works for users with any device, any connection, any ability

### Negative

- Higher quality bar increases development time per feature
- Offline queue adds architectural complexity
- Accessibility testing requires additional tooling and process
