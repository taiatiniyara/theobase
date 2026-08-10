# ADR-0002: Design System & UX Standards

## Status

Accepted (2026-08-10)

## Context

Theobase serves non-technical church officers across 215+ countries, many on low-end mobile devices with intermittent connectivity. The UX must be world-class — on par with consumer apps these officers use daily (WhatsApp, banking apps) — not "enterprise software." A Fiji church treasurer in a counting room after Sabbath service must complete their task with zero training, zero frustration, zero errors.

## Decision

### Brand Identity

The Theobase logo (`branding/logo-icon.svg`, `branding/logo-full.svg`, `branding/logo-full-light.svg`) is a geometric three-tier mountain peak in layered blue — symbolising foundation, elevation, and stability. The full mark pairs the mountain icon with the "Theobase" wordmark. Three variants:

- `logo-icon.svg` — mountain icon only. Used for favicons, app icons, and PWA manifests.
- `logo-full.svg` — icon + wordmark in dark text. Used on light backgrounds (login screen, light-mode header).
- `logo-full-light.svg` — icon + wordmark in light text. Used on dark backgrounds (dark-mode header, onboarding, email templates).

The brand palette, extracted directly from the logo:

| Token               | Hex       | Tailwind   | Role                                                   |
| ------------------- | --------- | ---------- | ------------------------------------------------------ |
| `--color-brand-300` | `#93C5FD` | `blue-300` | Top peak — lightest, subtle accents                    |
| `--color-brand-400` | `#60A5FA` | `blue-400` | Upper mid peak — hover states, secondary accents       |
| `--color-brand-500` | `#3B82F6` | `blue-500` | Lower mid peak — interactive elements                  |
| `--color-brand-600` | `#2563EB` | `blue-600` | Bottom peak — primary action color, links, focus rings |

Neutral palette: Tailwind Slate (`slate-50` through `slate-950`) for text, backgrounds, and borders.
Semantic colors: green for success/confirmed, amber for pending/attention, red for errors/disputes. All pass 4.5:1 contrast against their backgrounds.

### Design System

A unified design system with token-based theming. Every visual property maps to a design token — colors, spacing, typography, radii, shadows, motion curves. This enables:

- **Dark and light modes** as first-class themes, not afterthoughts.
- **High-contrast mode** for accessibility and outdoor use (counting rooms are often sunlit).
- **Per-language typography** — font stacks that render correctly across Latin, Cyrillic, Arabic, Devanagari, Chinese, and Pacific Island scripts.

Generated from a single token file (e.g., Style Dictionary or Tokens Studio) and compiled into CSS custom properties + Tailwind config. Every component references tokens, never raw values.

### Accessibility (WCAG 2.2 AA)

- All interactive elements keyboard-navigable with visible focus rings (2px offset, high-contrast color).
- Minimum 4.5:1 contrast ratio for text, 3:1 for large text and UI components.
- Touch targets minimum 48x48px (WCAG AAA for mobile).
- Screen reader support via semantic HTML and ARIA labels on all custom widgets.
- Form errors announced via `aria-live` regions, not just color.
- No motion preference respected via `prefers-reduced-motion`.
- Autocomplete attributes on form fields to reduce typing on mobile.
- Input type attributes (`type="number"`, `type="email"`, `type="tel"`) for correct mobile keyboards.

### Visual Design Principles

1. **Clarity over cleverness.** The interface should be obvious, not clever. A button looks like a button. A link looks like a link. No hidden gestures, no mystery-meat navigation.

2. **One primary action per screen.** The user's next move should be the most visually prominent thing on screen. Secondary actions are visible but subdued.

3. **Content is chrome.** Minimize persistent UI. Navigation, headers, and toolbars exist to frame the content, not compete with it. Bottom sheet navigation on mobile, side nav on desktop.

4. **Confidence through confirmation.** Every destructive or irreversible action requires explicit confirmation. Financial commits (batch confirmations) require a deliberate two-step gesture. The UI telegraphs finality.

5. **Whitespace as a design element.** Generous spacing around numbers and financial data. A cramped balance sheet causes errors. A breathing one inspires trust.

### Interactions

- **Haptic feedback** on mobile for confirmations (batch commit, report submit). The phone physically acknowledges the action.
- **Pull-to-refresh** for syncing when online. Tells the user "your data is current."
- **Swipe actions** on list items — swipe right to edit member, swipe left for quick actions.
- **Long-press for context** — long-press a member for the full menu (transfer, edit, view history).
- **Skeleton screens** during loading, never spinners (they feel slow; skeletons feel fast).
- **Optimistic updates** — the UI updates immediately on user action, rolls back if the sync fails. Never make the user wait for the server.

### Form Design

Financial data entry is the core interaction. Get this wrong and the platform fails.

- **Large, tappable number inputs** — custom numeric keypad (calculator-style) for amounts, not the tiny system keyboard.
- **Auto-advance fields** — after entering an amount, focus moves to the next field. No tapping between fields.
- **Smart defaults** — pre-populated member name, category from previous week's pattern.
- **Live validation** — feedback as you type, not after submit. "Amount entered: $50.00" as a live readout below the input.
- **Undo** — every entry can be undone. No delete confirmation dialogs. Swipe to undo, or a snackbar with "Undo" button.
- **Batch mode** — add multiple giving records rapidly. Each entry appears as a card below. Swipe to remove. When done, tap "Confirm Batch."

### Offline UX

- **Clear sync status** — a small indicator in the header: green dot (synced), amber dot (pending sync), red dot (offline). Tap for details.
- **Offline indicator** — when offline, a thin banner at the top: "You're offline. Changes will sync when connected." Not an intrusive modal.
- **Queue count** — badge on the sync icon showing number of pending changes.
- **Stale data warning** — when showing data not synced in >24 hours, a subtle banner.

### Motion

- Purposeful, not decorative. Motion communicates state change: navigating forward, confirming an action, surfacing an error.
- Duration: 150-300ms for micro-interactions, 300-500ms for page transitions.
- Easing: ease-out for appearing elements, ease-in for disappearing. Custom cubic-bezier for brand feel.
- Spring physics for gestures (swipe-to-dismiss, pull-to-refresh).

### Performance

- **Time to Interactive < 2s** on 3G in Fiji.
- **First Contentful Paint < 1.5s**.
- All assets served from Cloudflare's edge, as close to the user's country as possible.
- Image optimization: WebP/AVIF, responsive `srcset`, lazy loading, blur-up placeholders.
- Code splitting by route. A counter doesn't download the clerk's membership transfer forms.
- Service worker with stale-while-revalidate caching for all static assets.

## Consequences

- A design system is an upfront investment that pays back in consistency and velocity. Every component built to these standards is reusable forever.
- WCAG AA compliance is non-negotiable — it's table stakes for a global platform.
- The custom numeric keypad and offline-first interactions are the hardest parts to get right but the highest-ROI for user experience.
