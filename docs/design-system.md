# Theobase Design System

The single source of truth for every visual decision in Theobase. Every component, layout, and token is defined here. AI agents building UI **must** start by reading this file.

---

## Brand Identity

The Theobase logo is a geometric three-tier mountain peak — foundation, elevation, stability. Three SVG variants live in `branding/`:

| File                  | Usage                                                                                           |
| --------------------- | ----------------------------------------------------------------------------------------------- |
| `logo-icon.svg`       | Favicon, app icon, PWA manifest. Mountain icon only.                                            |
| `logo-full.svg`       | Light backgrounds: login screen, light-mode header. Icon + wordmark in dark text.               |
| `logo-full-light.svg` | Dark backgrounds: dark-mode header, onboarding, email templates. Icon + wordmark in light text. |

The brand palette is drawn directly from the layered peaks of the logo:

| Token       | Hex       | Tailwind Equivalent | Peak Position         | Role                                         |
| ----------- | --------- | ------------------- | --------------------- | -------------------------------------------- |
| `brand-300` | `#93C5FD` | `blue-300`          | Top peak (lightest)   | Subtle accents, badges, selected backgrounds |
| `brand-400` | `#60A5FA` | `blue-400`          | Upper mid peak        | Hover states, secondary accents, focus rings |
| `brand-500` | `#3B82F6` | `blue-500`          | Lower mid peak        | Interactive elements, links, active borders  |
| `brand-600` | `#2563EB` | `blue-600`          | Bottom peak (darkest) | Primary actions, active nav, pressed states  |

---

## Tokens

Every visual property maps to a token. Components reference tokens, never raw values.

### Colors

#### Brand

```css
--color-brand-100: #dbeafe; /* light backgrounds, selected rows */
--color-brand-200: #bfdbfe; /* hover backgrounds on light surfaces */
--color-brand-300: #93c5fd; /* subtle accents, badges */
--color-brand-400: #60a5fa; /* hover states, secondary accents */
--color-brand-500: #3b82f6; /* interactive elements, links */
--color-brand-600: #2563eb; /* primary action, active nav, pressed */
--color-brand-700: #1d4ed8; /* hover on primary buttons */
--color-brand-800: #1e40af; /* pressed on primary buttons, dark bg accents */
```

Usage:

- **brand-600** is the primary action color. Buttons, links, active navigation indicators, focus rings.
- **brand-100** backgrounds for selected or active items in lists and side nav.
- **brand-500** for tappable/interactive elements that are not the primary action.
- **brand-700/800** for interactive state deepening (hover, press).

#### Neutral (Tailwind Slate)

```css
--color-neutral-50: #f8fafc; /* page background (light mode) */
--color-neutral-100: #f1f5f9; /* card background, hover rows */
--color-neutral-200: #e2e8f0; /* skeleton loading, dividers, disabled bg */
--color-neutral-300: #cbd5e1; /* border on inputs, subtle separators */
--color-neutral-400: #94a3b8; /* placeholder text, disabled text */
--color-neutral-500: #64748b; /* secondary text, helper text, icons */
--color-neutral-600: #475569; /* body text (light mode subdued) */
--color-neutral-700: #334155; /* body text (light mode default) */
--color-neutral-800: #1e293b; /* heading text, emphasis */
--color-neutral-900: #0f172a; /* high-emphasis headings */
--color-neutral-950: #020617; /* dark mode page background */
```

Usage:

- **Light mode:** `neutral-50` page bg, `neutral-100` card bg, `neutral-700` body text, `neutral-900` headings.
- **Dark mode (flipped):** `neutral-950` page bg, `neutral-800` card bg, `neutral-300` body text, `neutral-100` headings.
- **Borders:** `neutral-200` on light bg, `neutral-700` on dark bg.

#### Semantic

| Token     | Hex       | Light Variant   | Hex       | Usage                                                |
| --------- | --------- | --------------- | --------- | ---------------------------------------------------- |
| `success` | `#16A34A` | `success-light` | `#DCFCE7` | Success snackbar, confirmed status, synced indicator |
| `warning` | `#D97706` | `warning-light` | `#FEF3C7` | Pending status, attention badge, unsaved changes     |
| `error`   | `#DC2626` | `error-light`   | `#FEE2E2` | Error snackbar, validation error, offline indicator  |

Usage:

- **Light variants** for badge backgrounds and alert banners (text in the 700-weight variant of the same hue).
- **Solid variants** for foreground elements: success dot, warning icon, error border.
- Semantic colors do **not** change between light and dark mode.

#### High-Contrast Mode

When `prefers-contrast: more` is active, all text must achieve WCAG AAA **7:1** ratio:

- Neutral text upgrades one level darker/lighter versus its background.
- Brand-600 on white drops to **brand-700** to hit 7:1.
- Focus rings widen to 3px and use `brand-700`.
- Semantic colors remain the same — green/amber/red on white already hit 7:1.

### Typography

#### Font Stack

```css
font-family:
  -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans',
  'Noto Sans Arabic', 'Noto Sans Devanagari', 'Noto Sans SC', sans-serif;
```

Zero custom font downloads. System fonts load instantly and are familiar to every platform. The `Noto Sans` family covers Arabic, Devanagari, Chinese, and Pacific Island scripts as fallbacks when the system font lacks glyphs.

#### Scale

| Token       | Size | Line Height | Usage                                                      |
| ----------- | ---- | ----------- | ---------------------------------------------------------- |
| `text-xs`   | 12px | 1rem        | Badges, captions, helper text, sync indicator label        |
| `text-sm`   | 14px | 1.25rem     | Secondary text, list meta, form labels, input text         |
| `text-base` | 16px | 1.5rem      | Body text, list items, card content                        |
| `text-lg`   | 18px | 1.75rem     | Card headings, dialog titles, section headers              |
| `text-xl`   | 20px | 1.75rem     | Screen titles, modal headings                              |
| `text-2xl`  | 24px | 2rem        | Dashboard KPIs, amount previews (non-keypad)               |
| `text-3xl`  | 30px | 2.25rem     | Keypad amount display, hero numbers, signoff confirmations |

#### Weights

| Weight | Token           | Usage                                                  |
| ------ | --------------- | ------------------------------------------------------ |
| 400    | `font-normal`   | Body text, form helpers, list meta                     |
| 500    | `font-medium`   | Labels, badges, secondary buttons                      |
| 600    | `font-semibold` | Headings, card titles, primary buttons, amount display |
| 700    | `font-bold`     | KPI numbers, batch summary totals                      |

#### Rules

- **All financial data** (amounts, counts, dates in tabular context) must use `font-variant-numeric: tabular-nums`. This prevents layout shift as numbers change.
- **RTL support:** Use CSS logical properties (`margin-inline-start`, `padding-inline-end`, `text-align: start`). Do not use `left`/`right` or `text-align: left`/`right`. The system font stack includes RTL-capable fonts.
- **Line height:** Never set below 1.25 for readability. Financial numbers can use 1.1 for compact tables.
- **No custom fonts.** Period.

### Spacing

Tailwind default scale. Key patterns:

| Pattern                   | Token       | Pixels      | Context                               |
| ------------------------- | ----------- | ----------- | ------------------------------------- |
| Screen horizontal padding | `px-4`      | 16px        | Mobile screens, form containers       |
| Screen horizontal padding | `px-6`      | 24px        | Tablet/desktop screens                |
| Card internal padding     | `p-4`       | 16px        | All cards                             |
| Section vertical gap      | `space-y-6` | 24px        | Between form sections, content blocks |
| Form field gap            | `space-y-4` | 16px        | Between stacked inputs                |
| List item padding         | `px-4 py-3` | 16px × 12px | Member list rows, record rows         |
| Bottom nav padding        | `px-2 py-2` | 8px × 8px   | Tab bar internal                      |
| Top bar height            | `h-14`      | 56px        | Header bar                            |
| Bottom nav height         | `h-16`      | 64px        | Mobile tab bar                        |

#### Minimum Touch Target

Every interactive element must have a **minimum 48×48px** touch area. If the visual element is smaller, enlarge its hit area with transparent padding. This applies to:

- Buttons, links, tab items
- Swipe targets on list items
- Keypad buttons (these should be 56×56px)
- Form toggles, checkboxes, radio buttons

### Border Radius

| Token          | Value  | Usage                                  |
| -------------- | ------ | -------------------------------------- |
| `rounded-md`   | 6px    | Inputs, buttons, selects, date pickers |
| `rounded-lg`   | 8px    | Cards, modals, sheets, form sections   |
| `rounded-full` | 9999px | Badges, avatars, sync indicator pill   |

**NEVER** use `rounded-none` (0px) or `rounded-sm` (2px) — they feel unfinished. **NEVER** use `rounded-xl` or larger for UI containers — they look inflated.

### Shadows

Theobase is a flat design. Shadows are minimal and purposeful.

| Token         | Usage                          | Light Mode                                                       | Dark Mode                   |
| ------------- | ------------------------------ | ---------------------------------------------------------------- | --------------------------- |
| `shadow-none` | Default state for all surfaces | —                                                                | —                           |
| `shadow-sm`   | Cards (resting)                | `0 1px 2px rgba(0,0,0,0.05)`                                     | `0 1px 2px rgba(0,0,0,0.3)` |
| `shadow-md`   | Modals, dialogs, bottom sheets | `0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)` | Same, with 0.4 alpha        |

**NEVER** use `shadow-lg` or `shadow-xl` — flat design principle. Elevation is communicated through layout and borders, not heavy drop shadows.

### Motion

| Type       | Duration | Easing        | Usage                                                        |
| ---------- | -------- | ------------- | ------------------------------------------------------------ |
| Micro      | 150ms    | `ease-out`    | Button press, toggle, badge appear, focus ring transition    |
| Transition | 300ms    | `ease-in-out` | Panel expand/collapse, snackbar enter/exit, modal open/close |
| Page       | 500ms    | `ease-in-out` | Route transitions, sheets sliding in                         |

Spring physics for gestures:

```css
--spring-gentle: spring(0.5, 100, 15); /* swipe-to-dismiss, pull-to-refresh */
--spring-snappy: spring(0.3, 200, 20); /* keypad press feedback */
```

All motion must be gated:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**NEVER** animate `width` or `height` — use `transform` and `opacity` only (compositor-only properties).

---

## The Three Layouts

Every screen in Theobase is exactly one of these three patterns. AI agents must choose the correct layout before building any screen.

### 1. Dashboard

```
┌──────────────────────────────────┐
│  Header (Logo + Profile Avatar)  │  h-14, bg-neutral-50, shadow-sm
├──────────────────────────────────┤
│                                  │
│  ┌─ Insight Bar ──┐ ┌─────────┐ │  2-3 horizontal cards
│  │ This Week's     │ │ Pending │ │  h-auto, rounded-lg, shadow-sm
│  │ Giving  $2,450  │ │ Sync  3  │ │  brand-100 bg with brand-700 text
│  └─────────────────┘ └─────────┘ │
│                                  │
│  ┌─ Quick Actions ────────────┐  │
│  │ [New Batch] [Add Member]   │  │  Horizontal button row
│  └────────────────────────────┘  │
│                                  │
│  ┌─ Recent Activity ────────────┐│
│  │ Member A     $50.00  Tithe   ││  Table or list with column headers
│  │ Member B     $20.00  Offering││
│  │ Member C     $100.00 Tithe   ││
│  │ Member D     $35.00  Building││
│  └──────────────────────────────┘│
│                                  │
├──────────────────────────────────┤
│  [Home]  [Giving]  [Members] [.]│  Bottom Nav (mobile only), h-16
└──────────────────────────────────┘
```

Structure:

```html
<div class="flex flex-col min-h-screen bg-neutral-50 dark:bg-neutral-950">
  <header
    class="h-14 flex items-center justify-between px-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950"
  >
    <!-- Logo + SyncIndicator -->
  </header>
  <main class="flex-1 overflow-y-auto px-4 py-6 space-y-6">
    <section><!-- Insight Bar: 2-3 cards --></section>
    <section><!-- Quick Actions --></section>
    <section><!-- Table / List --></section>
  </main>
  <nav class="md:hidden h-16"><!-- Bottom Nav --></nav>
</div>
```

Rules:

- Mobile: bottom nav. Desktop: side nav.
- Insight Bar cards are tappable — tapping opens the relevant detail view.
- Quick Actions are primary call-to-action buttons.
- The table/list fills remaining vertical space and scrolls independently if needed.

### 2. Detail

```
┌──────────────────────────────────┐
│  ← Members    [Edit]             │  Top Bar: back + title + action
├──────────────────────────────────┤
│                                  │
│  ┌─ Detail Card ───────────────┐ │
│  │ Avatar + Name + Role Badge   │ │  Card with avatar, metadata, badges
│  │ Email  •  Phone  •  Since    │ │
│  └──────────────────────────────┘ │
│                                  │
│  ┌─ Giving Summary ────────────┐ │
│  │ This Year     $1,200.00     │ │  Stats card with tabular-nums
│  │ Last 30 Days    $300.00     │ │
│  └──────────────────────────────┘ │
│                                  │
│  ┌─ Recent Activity ────────────┐│
│  │ Aug 10  Tithe        $50.00  ││  Timeline or record list
│  │ Aug 03  Offering     $20.00  ││
│  │ Jul 27  Tithe        $50.00  ││
│  └──────────────────────────────┘│
│                                  │
├──────────────────────────────────┤
│  [Home]  [Giving]  [Members] [.]│
└──────────────────────────────────┘
```

Structure:

```html
<div class="flex flex-col min-h-screen bg-neutral-50 dark:bg-neutral-950">
  <header
    class="h-14 flex items-center gap-3 px-4 border-b border-neutral-200 dark:border-neutral-800"
  >
    <button><!-- Back arrow (brand-600) --></button>
    <h1 class="text-lg font-semibold flex-1"><!-- Title --></h1>
    <button><!-- Primary action (Edit/Save) --></button>
  </header>
  <main class="flex-1 overflow-y-auto px-4 py-6 space-y-6">
    <section><!-- Detail cards --></section>
    <section><!-- Timeline / Activity --></section>
  </main>
</div>
```

Rules:

- Back button always `brand-600`, always leftmost. Title is centered when no right action, left-aligned when there is one.
- The right action button is the primary action for this entity (Edit, Save, Share).
- Detail cards group related information. One card per logical group.
- The timeline/activity section shows time-ordered events with relative timestamps.

### 3. Form

```
┌──────────────────────────────────┐
│  ← Cancel     New Batch    Save  │  Top Bar: back + title + save
├──────────────────────────────────┤
│                                  │
│  ┌─ Batch Info ────────────────┐ │
│  │ Date     [2026-08-10     ▼] │ │
│  │ Category [Tithe          ▼] │ │  Form Section with grouped inputs
│  │ Notes    [_______________]  │ │
│  └──────────────────────────────┘ │
│                                  │
│  ┌─ Giving Records ────────────┐ │
│  │ Member     [Select...    ▼] │ │
│  │ Amount     [  0.00      ◀▶] │ │  Form Section
│  │                              │ │
│  │ [+ Add Record]               │ │  Secondary action
│  └──────────────────────────────┘ │
│                                  │
│  ┌─ Added Records ──────────────┐│
│  │ Member A     $50.00  [✕]     ││  Batch cards
│  │ Member B     $20.00  [✕]     ││  Swipe to remove
│  └──────────────────────────────┘│
│                                  │
│              [Submit Batch]       │  Primary action, full-width
│                                  │
└──────────────────────────────────┘
```

Structure:

```html
<div class="flex flex-col min-h-screen bg-neutral-50 dark:bg-neutral-950">
  <header
    class="h-14 flex items-center gap-3 px-4 border-b border-neutral-200 dark:border-neutral-800"
  >
    <button class="text-brand-600 font-medium"><!-- Cancel --></button>
    <h1 class="text-lg font-semibold flex-1 text-center"><!-- Title --></h1>
    <button class="text-brand-600 font-semibold"><!-- Save --></button>
  </header>
  <main class="flex-1 overflow-y-auto px-4 py-6 space-y-6">
    <section class="space-y-6"><!-- Form Section 1 --></section>
    <section class="space-y-6"><!-- Form Section 2 --></section>
    <!-- ... -->
  </main>
  <footer class="px-4 py-4 border-t border-neutral-200 dark:border-neutral-800">
    <button class="w-full"><!-- Primary Submit --></button>
  </footer>
</div>
```

Rules:

- Cancel is always left, styled as `text-brand-600 font-medium` (link-style, not button).
- Save/Submit is always right, styled as `text-brand-600 font-semibold`.
- Form sections are grouped by topic, separated by `space-y-6`, with section titles in `text-lg font-semibold`.
- The primary action button is pinned to the bottom footer, full-width.
- On the counting-room keypad screen, the footer is replaced by the numeric keypad.

---

## Component Catalog

Every component is a shadcn/ui primitive, styled with Theobase tokens. Features assemble from these components. Do not create new base components.

### Core

#### Button

```css
/* Base */
btn: h-12 px-6 rounded-md font-semibold text-base inline-flex items-center justify-center gap-2
  transition-colors duration-150;
```

| Variant       | Classes                                                                                                | Usage                        |
| ------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------- |
| `primary`     | `bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800`                                       | Main action on screen        |
| `secondary`   | `bg-neutral-100 text-neutral-700 hover:bg-neutral-200 active:bg-neutral-300 border border-neutral-200` | Secondary action             |
| `ghost`       | `text-neutral-600 hover:bg-neutral-100 active:bg-neutral-200`                                          | Tertiary action, nav items   |
| `destructive` | `bg-error text-white hover:bg-red-700 active:bg-red-800`                                               | Delete, remove, irreversible |

| Size      | Classes               | Usage                                        |
| --------- | --------------------- | -------------------------------------------- |
| `sm`      | `h-8 px-3 text-sm`    | Table actions, inline buttons                |
| `default` | `h-12 px-6 text-base` | Standard buttons                             |
| `lg`      | `h-14 px-8 text-lg`   | Primary CTA on empty states, signoff confirm |

| State          | Behavior                                                                      |
| -------------- | ----------------------------------------------------------------------------- |
| Default        | Standard variant colors                                                       |
| Hover          | Darken by one step (e.g. brand-600 → brand-700)                               |
| Active/Pressed | Darken by two steps, slight scale(0.98)                                       |
| Focus-visible  | 2px offset ring in `brand-400`, radius matches button                         |
| Disabled       | `opacity-50 cursor-not-allowed`, no hover/press effects                       |
| Loading        | Replace content with a small spinner (not a skeleton), button stays same size |

**NEVER:**

- Never use more than one primary button per screen.
- Never make a button look like a link or vice versa.
- Never use an icon-only button without an accessible label (`aria-label`).
- Never set a button's `type` to `"button"` inside a form unless it is not the submit button — `<button>` defaults to `type="submit"`.

#### Input

```css
input: h-12 w-full px-4 rounded-md border border-neutral-300 bg-white text-neutral-900 text-base
       placeholder:text-neutral-400
       focus:border-brand-500 focus:ring-2 focus:ring-brand-400 focus:ring-offset-0 focus:outline-none
       disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed
       dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-100 dark:placeholder:text-neutral-500
```

| State    | Visual                                                                              |
| -------- | ----------------------------------------------------------------------------------- |
| Default  | `border-neutral-300`                                                                |
| Focus    | `border-brand-500` + `ring-2 ring-brand-400`                                        |
| Error    | `border-error` + `ring-2 ring-red-300` — error message in `text-error text-sm mt-1` |
| Disabled | `bg-neutral-100 text-neutral-400`                                                   |

Every input must have:

1. A visible `<label>` above it (`text-sm font-medium text-neutral-700`).
2. Optional `<p>` helper text below (`text-xs text-neutral-500`).
3. Error message below when invalid (`text-sm text-error`).

**NEVER:**

- Never use `placeholder` as the only label. Placeholders disappear on focus.
- Never use a bare input without a label.
- Never set input height below 48px.
- Never hide the error state — always show the message.

#### Select

Same visual spec as Input (48px height, same border/focus/error states).

Mobile behavior: when options exceed 10, render as a **bottom sheet** with a search field at the top and scrollable option list. This replaces the native `<select>` dropdown which is unusable on mobile at scale.

**NEVER** use the native `<select>` element. Always use the Select component (Radix-based via shadcn/ui).

#### Card

```css
card: bg-white rounded-lg p-4 shadow-sm border border-neutral-200
      dark:bg-neutral-800 dark:border-neutral-700
```

| Variant     | Usage                                                                                                      |
| ----------- | ---------------------------------------------------------------------------------------------------------- |
| Default     | Standard content card                                                                                      |
| Interactive | Add `hover:shadow-md hover:border-brand-300 cursor-pointer transition-all duration-150` for tappable cards |
| Insight     | `bg-brand-100 dark:bg-brand-900 border-brand-200 dark:border-brand-800` for dashboard stat cards           |

Optional header: `px-4 pt-4 pb-0` with `text-lg font-semibold` title and optional action button on the right.

**NEVER** nest cards inside cards. One level only. Use dividers or spacing within a card to group content.

#### Badge

```css
badge: inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
```

| Variant   | Classes                           | Usage                           |
| --------- | --------------------------------- | ------------------------------- |
| `default` | `bg-brand-100 text-brand-700`     | Generic tags, roles, categories |
| `success` | `bg-success-light text-green-700` | Confirmed, synced, active       |
| `warning` | `bg-warning-light text-amber-700` | Pending, draft, attention       |
| `error`   | `bg-error-light text-red-700`     | Failed, overdue, disputed       |

Every badge must contain text. **NEVER** use a color-only dot as a badge — always pair color with a label.

#### Avatar

```css
avatar: rounded-full overflow-hidden bg-brand-100 text-brand-700 font-medium flex items-center
  justify-center;
```

| Size      | Classes             | Usage                         |
| --------- | ------------------- | ----------------------------- |
| `sm`      | `w-8 h-8 text-xs`   | List items, table rows        |
| `default` | `w-10 h-10 text-sm` | Detail cards, profile headers |
| `lg`      | `w-16 h-16 text-xl` | Profile screen                |

When no image is available, show the member's initials (up to 2 characters) on `bg-brand-100 text-brand-700`. The background cycles through brand-100/200/300 by first-letter hash to vary color across a list.

### Navigation

#### Bottom Nav (mobile only)

```css
bottom-nav: h-16 w-full bg-white border-t border-neutral-200 flex items-center justify-around px-2 pb-safe
           dark:bg-neutral-900 dark:border-neutral-800
           fixed bottom-0 left-0 right-0 md:hidden
```

- 3 to 5 tabs. Each tab: icon centered above label.
- **Active tab:** `text-brand-600` (`brand-600` fill for icon, `font-medium` label).
- **Inactive tab:** `text-neutral-400` (`neutral-400` fill for icon, `font-normal` label).
- **NEVER** show on desktop (hidden with `md:hidden`).
- **NEVER** use more than 5 tabs.
- Must include `pb-safe` (env-safe-area-inset-bottom) for notched devices.

#### Side Nav (desktop only)

```css
side-nav: w-[240px] h-screen bg-white border-r border-neutral-200 flex flex-col
         dark:bg-neutral-900 dark:border-neutral-800
         hidden md:flex fixed left-0 top-0
```

Structure:

- **Top:** Logo (logo-full.svg or logo-full-light.svg), 40px padding, linked to Dashboard.
- **Middle:** Navigation items, vertical list, each item 48px height with `px-4`.
  - Active item: `bg-brand-100 dark:bg-brand-800` background, `text-brand-700 dark:text-brand-300` text, 3px `brand-600` left border.
  - Inactive item: `text-neutral-600 dark:text-neutral-400` text, transparent left border, hover `bg-neutral-100`.
- **Bottom:** User section — avatar + name + role, `mt-auto`, `p-4`, `border-t border-neutral-200`.

**NEVER** show on mobile (hidden with `hidden md:flex`).

#### Top Bar (Detail / Form screens)

```css
top-bar: h-14 w-full bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800
         flex items-center gap-3 px-4
```

Structure:

- Left: Back button (`text-brand-600 font-medium`, ← icon + "Back" text).
- Center: Screen title (`text-lg font-semibold text-neutral-900 dark:text-neutral-100`, `flex-1 text-center`).
- Right: Primary action (Save, Edit) or empty.

**NEVER** place Top Bar and Bottom Nav on the same screen — Top Bar is for Detail and Form layouts, Bottom Nav is for Dashboard.

### Lists & Data

#### Member List Item

```css
member-item: h-16 flex items-center gap-3 px-4 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700
             border-b border-neutral-100 dark:border-neutral-800
```

Structure:

1. **Avatar** (40px, rounded-full, initials fallback)
2. **Info column** (`flex-1 min-w-0`): Name (`text-base font-medium`), subtitle with role badge (`text-sm text-neutral-500` + badge)
3. **Status badge** (right-aligned)
4. **Swipe actions** (revealed on swipe):
   - Swipe right: Edit
   - Swipe left: Quick actions (Transfer, View History)
5. **Long-press** opens context menu with all available actions.

**NEVER** use a kebab menu icon — long press is the discoverable pattern.

#### Giving Record Row

```css
record-row: h-12 flex items-center gap-3 px-4 bg-white dark:bg-neutral-800
           border-b border-neutral-100 dark:border-neutral-800
```

Structure:

1. Date (`text-sm text-neutral-500 tabular-nums`, fixed width)
2. Member name (`text-sm font-medium`, `flex-1`)
3. Amount (`text-sm font-semibold tabular-nums text-neutral-900 dark:text-neutral-100`, right-aligned)
4. Type badge (Tithe/Offering/Building, right of amount)
5. **Swipe-left to remove** (in batch edit mode) with red background + trash icon.

**NEVER** show amounts without `tabular-nums`.
**NEVER** use variable-width fonts for any column that should align vertically.

#### Empty State

```css
empty-state: flex flex-col items-center justify-center text-center px-4 py-12 min-h-[300px];
```

Structure:

1. Icon (64×64px, `text-neutral-300`, brand-themed for the context — e.g., a giving icon for "No giving records")
2. Heading (`text-lg font-semibold text-neutral-700 mt-6`)
3. Description (`text-sm text-neutral-500 mt-2 max-w-xs`)
4. Primary action button (`mt-6`)

Examples:

- "No members yet" → "Add your first member to get started" → [Add Member]
- "No giving records" → "Start a new batch to record this week's giving" → [New Batch]
- "No results found" → "Try adjusting your search or filters" → [Clear Filters]

**NEVER** show just "No results" — always explain why and provide a path forward.

#### Skeleton

```css
skeleton: bg-neutral-200 dark:bg-neutral-700 rounded-md animate-pulse
```

Match the shape of the component being loaded:

- List item skeleton: avatar circle (40px) + two text bars (one 60% width, one 40% width)
- Card skeleton: full card shape in neutral-200
- Table skeleton: 3-5 rows of matching column widths

**NEVER** use a spinner for content loading. Always use skeletons. The only acceptable spinner is a 20px inline spinner inside a button during a save/submit operation.

### Status & Feedback

#### Snackbar

```css
snackbar: fixed bottom-20 left-4 right-4 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900
          rounded-lg px-4 py-3 flex items-center gap-3 shadow-md
          animate-in slide-in-from-bottom-4 duration-300
```

| Variant   | Left Icon                        | Usage                                        |
| --------- | -------------------------------- | -------------------------------------------- |
| `success` | Check circle, `text-success`     | Batch confirmed, member saved, sync complete |
| `error`   | Alert circle, `text-error`       | Save failed, sync error, validation failure  |
| `warning` | Warning triangle, `text-warning` | Offline changes queued, stale data           |

- Auto-dismisses after **5 seconds**.
- Optional action button (e.g., "Undo") right-aligned.
- Only one snackbar visible at a time. New snackbars replace existing ones.
- On mobile, position above the bottom nav (`bottom-20`).

**NEVER** use a snackbar for critical confirmations — those need a Dialog.
**NEVER** let a snackbar overlap the primary action button or keypad.

#### Dialog

```css
dialog-overlay: fixed inset-0 bg-black/50 animate-in fade-in duration-200
dialog-content: fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-neutral-800
                rounded-lg shadow-md p-6 max-w-sm w-[calc(100%-2rem)] max-h-[85vh] overflow-y-auto
                animate-in zoom-in-95 duration-200
```

Structure:

1. Title (`text-lg font-semibold`)
2. Description (`text-sm text-neutral-500 mt-2`)
3. Action buttons (`mt-6 flex gap-3 justify-end`): primary action rightmost, secondary (cancel) left.
   - One action: full-width primary button.
   - Two actions: Cancel (secondary) + Confirm (primary or destructive).

- Escape key dismisses.
- Clicking outside dismisses (unless destructive — then clicking outside does nothing).
- Focus is trapped inside the dialog while open.

#### Sync Indicator

```css
sync-indicator: inline-flex items-center gap-1.5 px-2 py-1 rounded-full;
```

| State   | Dot                               | Label       | Action                   |
| ------- | --------------------------------- | ----------- | ------------------------ |
| Synced  | `bg-success w-2 h-2 rounded-full` | "Synced"    | None                     |
| Pending | `bg-warning w-2 h-2 rounded-full` | "3 pending" | Tap → queue detail sheet |
| Offline | `bg-error w-2 h-2 rounded-full`   | "Offline"   | Tap → network status     |

Positioned in the top bar (Dashboard header), right of the logo. The dot is a 3px × 16px pill (horizontal orientation) that animates between states with a 150ms color transition.

### Counting Room (specialised)

#### Numeric Keypad

```css
keypad: grid grid-cols-3 gap-2 p-4 bg-neutral-100 dark:bg-neutral-800 rounded-t-lg
key: h-14 rounded-md bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100
     font-semibold text-2xl flex items-center justify-center active:bg-neutral-200
     dark:active:bg-neutral-600 transition-colors duration-100
```

Layout (calculator style):

```
┌───────┬───────┬───────┐
│   1   │   2   │   3   │
├───────┼───────┼───────┤
│   4   │   5   │   6   │
├───────┼───────┼───────┤
│   7   │   8   │   9   │
├───────┼───────┼───────┤
│   .   │   0   │   ⌫   │  (⌫ = backspace)
└───────┴───────┴───────┘
              [ Enter ]     (full-width, brand-600, h-14)
```

- Every key is **56×56px** minimum.
- `active:scale-95` with spring-snappy on press.
- Backspace removes last digit.
- Enter commits the amount and advances to the next field.
- Long-press backspace clears the entire amount.
- **NEVER** use the system keyboard for financial entry.
- **NEVER** add a comma separator key — format display-only.

#### Amount Display

```css
amount-display: text-3xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100
                py-6 px-4 text-right min-h-[80px] flex items-center justify-end
```

- Shows the current entry amount with currency prefix (e.g., `$123.45`).
- Decimal point inserted automatically: typing `12345` displays as `$123.45`.
- Pressing `.` manually positions the decimal — subsequent digits go to decimal places.
- Zero state shows `$0.00` in `text-neutral-300`.
- Background: `bg-neutral-50 dark:bg-neutral-950`.

#### Batch Card

```css
batch-card: flex items-center gap-3 px-4 py-3 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700
```

Structure:

1. Member name (`text-sm font-medium`, `flex-1`)
2. Amount (`text-sm font-semibold tabular-nums`)
3. Category badge
4. **Swipe-left to remove** — reveals red background with "Remove" label.

**NEVER** add an inline remove button (✕) without swipe. Swipe is the primary remove gesture; the ✕ is a secondary affordance.

#### Batch Summary

```css
batch-summary: flex items-center justify-between px-4 py-4 bg-neutral-100 dark:bg-neutral-800
               rounded-lg border border-neutral-200 dark:border-neutral-700
```

Structure:

1. Left: "X records" + total amount in `text-lg font-semibold tabular-nums`
2. Right: Dual-signoff progress indicator

Dual-signoff indicator:

```css
signoff: flex items-center gap-2
signoff-counter: w-10 h-10 rounded-full border-2 border-neutral-300 dark:border-neutral-600
                 flex items-center justify-center text-sm font-medium
                 data-[signed=true]:border-success data-[signed=true]:bg-success-light data-[signed=true]:text-green-700
```

- Two counters, side by side, labeled "Counter 1" / "Counter 2".
- Unsigned: hollow circle with border.
- Signed: filled circle with checkmark, green.
- **NEVER** allow submission until both counters have signed off.

### Forms (specialised)

#### Form Section

```css
form-section: space-y-4
form-section-title: text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-0
form-section-divider: border-t border-neutral-200 dark:border-neutral-800 my-6
```

Structure:

- Section title at top.
- Inputs stacked with `space-y-4`.
- Optional description below title (`text-sm text-neutral-500`).
- Light divider between sections.

#### Date Picker

Uses native `<input type="date">` styled with the Input component tokens. The native date picker is reliable across platforms and respects the user's locale.

**NEVER** build a custom calendar widget. Native date pickers are battle-tested, accessible, and familiar.

#### Currency Input

Triggers the custom numeric keypad (replaces the system keyboard). Amount preview displayed below the input:

```css
currency-preview: text-sm text-neutral-500 tabular-nums text-right;
```

Shows the parsed monetary value (e.g., "Amount: $50.00") as the user types on the keypad.

---

## File Structure

```
src/
├── components/
│   └── ui/           ← shadcn/ui primitives (button, input, select, card, badge, avatar, dialog, etc.)
│   └── features/     ← feature-specific components assembled from ui/ primitives
├── routes/            ← TanStack Router file-based routes (one file per screen)
├── lib/               ← Shared logic: Query hooks, Zod schemas, DO client, utilities
│   ├── queries/       ← TanStack Query hooks
│   ├── schemas/       ← Zod validation schemas
│   ├── client/        ← Durable Object RPC client
│   └── utils/         ← formatters, date helpers, currency
├── styles/
│   └── globals.css    ← Tailwind directives + design tokens as CSS custom properties
└── hooks/             ← Shared React hooks
```

All components in `src/components/ui/` map 1:1 to shadcn/ui primitives. Feature components in `src/components/features/` assemble primitives into domain components (MemberListItem, GivingRecordRow, BatchCard, NumericKeypad, etc.).

---

## AI Agent Rules

1. **Start every UI task by reading this file.** Design tokens, layouts, and components are defined here. Do not guess.

2. **Use only the components defined in this catalog.** Do not create new base components. If a component does not exist here, assemble it from existing primitives.

3. **Choose the correct layout from the three patterns** (Dashboard, Detail, Form) before writing any markup. Every screen is exactly one of these.

4. **All text must pass 4.5:1 contrast ratio.** Brand-600 on white: 4.8:1 (passes). Brand-600 on neutral-100: 4.0:1 (fails — use brand-700 instead). Neutral-500 on white: 3.5:1 (fails — use neutral-600 or higher for body text).

5. **Test every interactive element:** keyboard Tab order, Enter to submit, Escape to dismiss. Every control must be reachable and operable by keyboard alone.

6. **All financial numbers use `tabular-nums`.** Amounts, counts, dates in tables — always fixed-width numerals. No exceptions.

7. **Empty states direct action.** Never show "No results" alone. Always include: what happened, what it means, and what to do next (a button).

8. **Error states explain and offer a path forward.** "Something went wrong" is not acceptable. Say what failed, why it might have failed, and what the user can do (retry, go back, contact support).

9. **Never use a toast/notification for anything the user needs to read and act on.** Use a Snackbar for transient feedback, a Dialog for confirmations and decisions.

10. **Every form input must have a visible label.** Placeholders are supplementary hints, not labels.

11. **Respect `prefers-reduced-motion`.** Gate all animations. Some users disable motion for vestibular reasons.

12. **RTL support is not optional.** Use CSS logical properties. Test every layout flipped to Arabic/Hebrew.

13. **Dark mode is not a separate theme file.** It uses the same token names with different values, toggled via a `dark` class on `<html>`. Every component works in both modes.

14. **When in doubt, default to the Dashboard layout.** If a screen doesn't clearly fit Detail or Form, it's a Dashboard with filtered content.
