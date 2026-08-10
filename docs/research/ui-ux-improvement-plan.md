# Theobase UI/UX Improvement Plan

> Based on: current codebase audit, SaaS dashboard standards research, and 9-competitor church management platform analysis.

---

## Executive Summary

Theobase's backend architecture is solid. The frontend is functional but suffers from 5 systemic problems:

1. **No shared component library** — 20 pages copy-paste the same button/input/card/badge/table markup
2. **Monolithic pages** — FinancePage is ~1400 lines in one file; no page is under 100 lines
3. **i18n infrastructure exists but is unused** — every string is hardcoded English
4. **Zero data visualization** — dashboards use inline CSS div bars instead of charts
5. **Missing key admin patterns** — no toast notifications, no skeletons, no keyboard shortcuts, no breadcrumbs, no proper empty states

The fix requires **replacing nothing**, only **adding structure around what already exists** and refactoring pages into modular components.

---

## Phase 1: Foundation (Weeks 1-2)

### 1.1 Shared Component Library

Extract the 8 components that appear identically in 3+ files into a `src/components/ui/` directory. Every page then imports from one source, ensuring visual consistency.

**`src/components/ui/` — files to create:**

| Component    | Extracted from                                     | Used in                                                               |
| ------------ | -------------------------------------------------- | --------------------------------------------------------------------- |
| `Button`     | Every page                                         | All pages (primary, secondary, danger, ghost, outline, icon variants) |
| `Input`      | Every form                                         | All forms (with label, error, helper text, icon support)              |
| `Card`       | Dashboards, settings, reports                      | Conference/Global/District dashboards, settings, billing              |
| `Badge`      | Members, finance, audit                            | Status badges (success, warning, danger, info, neutral)               |
| `Spinner`    | src/main.tsx, reconcilation                        | Route suspense, button loading, data fetching                         |
| `DataTable`  | Members, finance, audit, contributions, attendance | All table pages (sorting, filtering, pagination, row selection)       |
| `EmptyState` | Every list page                                    | No members, no transactions, no batches, etc.                         |
| `PageHeader` | Every page                                         | Title + description + actions slot                                    |

**Implementation approach:**

- Use existing Tailwind classes as-is — don't change the design system, just centralize it
- Each component accepts the same className props so pages can still customize
- Write as regular React components (no new dependencies needed)
- Add to each: `displayName`, `forwardRef`, and basic ARIA attributes

**Button example:**

```tsx
// src/components/ui/Button.tsx
import { type ButtonHTMLAttributes, forwardRef } from "react";

const variants = {
  primary: "bg-orange-500 text-white hover:bg-orange-600 focus-visible:ring-orange-500",
  secondary: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
  danger: "bg-red-600 text-white hover:bg-red-700",
  ghost: "text-gray-600 hover:bg-gray-100",
} as const;

const sizes = {
  sm: "px-2 py-1 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
} as const;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", loading, children, disabled, className = "", ...props },
    ref
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-md font-medium transition-colors
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        disabled:pointer-events-none disabled:opacity-50
        ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && <Spinner className="mr-2 h-4 w-4" />}
      {children}
    </button>
  )
);
Button.displayName = "Button";
```

### 1.2 Design Token Standardization

Replace all hardcoded `bg-orange-500`/`text-orange-500` with `bg-brand`/`text-brand` from the CSS custom property. Add a grep-and-replace pass.

**`src/index.css` additions:**

```css
@theme {
  --color-brand: #f97316;
  --color-brand-hover: #ea580c;
  --color-brand-gray: #6b7280;
  --color-success: #16a34a;
  --color-warning: #ca8a04;
  --color-danger: #dc2626;
  --color-info: #2563eb;
}
```

### 1.3 Toast Notification System

Replace inline `bg-red-50`/`bg-blue-50` error/info banners with a toast system.

**Implementation:**

- Create `src/components/ui/Toast.tsx` + `src/lib/useToast.ts`
- Use React Context — zero dependencies
- Toast types: success (green), error (red), warning (yellow), info (blue)
- Auto-dismiss after 5 seconds, or persistent with close button
- Stack from top-right, max 4 visible

### 1.4 Skeleton Loaders

Replace all `"Loading..."` text strings with skeleton components.

**Components:**

- `TableSkeleton` — 5-row gray pulse table
- `CardSkeleton` — KPI card placeholder
- `FormSkeleton` — 4-field placeholder for detail views
- `PageSkeleton` — combines header + card/table skeleton based on context

---

## Phase 2: Core UX Patterns (Weeks 3-4)

### 2.1 Data Table Upgrade

Theobase has `@tanstack/react-table` as a dependency but uses plain HTML tables. Wire it up.

**`src/components/ui/DataTable.tsx` features:**

- Column sorting (click header → asc → desc → none)
- Column filtering (text input per column)
- Pagination (client-side: 10/25/50/100 per page)
- Row selection (checkbox + select all)
- Column visibility toggle (dropdown)
- Bulk action bar when rows selected
- Mobile: stack to cards on <768px
- Empty state slot
- Loading skeleton slot
- Export CSV slot

**Pages to retrofit:** Members (List), Finance (Batches, Transactions), Audit, Contributions, Attendance (History), Users, Reconciliation

### 2.2 Breadcrumbs

Add breadcrumbs to `DashboardLayout` header. Show current page path.

```tsx
// In header:
<Breadcrumb>
  <BreadcrumbItem href="/app">Dashboard</BreadcrumbItem>
  <BreadcrumbSeparator />
  <BreadcrumbItem href="/app/members">Members</BreadcrumbItem>
  <BreadcrumbSeparator />
  <BreadcrumbItem>Member Directory</BreadcrumbItem>
</Breadcrumb>
```

### 2.3 Command Palette (`Cmd+K` / `Ctrl+K`)

Quick navigation/search for power users.

```tsx
// Cmd+K opens modal with:
// - Search all pages by name
// - Quick actions: "Add member", "Record attendance", "Create batch"
// - Recent items
```

Implementation: lightweight — `useEffect` for keydown listener, filtered list with keyboard nav. No new dependencies needed.

### 2.4 Sidebar Improvements

- Icons: Add Lucide React for consistent, MIT-licensed icons (replaces inline SVGs)
- Collapse: Add sidebar collapse to icon-only mode (saves horizontal space)
- Active badge: Show unread notification count on relevant nav items
- Nested: Expandable sections (already have groups — make them collapsible)

---

## Phase 3: Forms & Data Entry (Weeks 5-6)

### 3.1 Form Validation

Add client-side validation beyond HTML5 attributes. No new library — use native Constraint Validation API.

**`src/lib/useForm.ts` hook:**

```tsx
function useForm<T extends Record<string, string>>(schema: Record<keyof T, ValidationRule[]>) {
  // Returns: register, errors, handleSubmit, isSubmitting, reset
  // Validates on blur, clears errors on change
  // Shows field-level error messages below each input
}
```

### 3.2 Input Component Upgrades

- Password visibility toggle (eye icon)
- Character count for textareas
- Currency input with formatting
- Date picker (native `<input type="date">` with fallback)
- Select with search (for member dropdowns, church dropdowns)
- File upload with drag-and-drop (for CSV imports)

### 3.3 Multi-Step Forms

For long forms (Add Member, Create Batch):

- Break into logical steps (Personal Info → Church Info → Household → Save)
- Progress indicator (numbered steps with checkmarks)
- Back/Next navigation
- Draft auto-save to localStorage

### 3.4 i18n Activation

The locale files exist. Wire `useTranslation()` into every page.

**Priority:**

1. Start with navigation + common actions (`t("common.save")`, `t("common.cancel")`)
2. Then form labels
3. Then status messages and empty states

---

## Phase 4: Data Visualization (Weeks 7-8)

### 4.1 Add Recharts

Install Recharts (the standard for React dashboards, composable, MIT-licensed).

### 4.2 Dashboard Charts

| Page                 | Current               | Replace with                                   |
| -------------------- | --------------------- | ---------------------------------------------- |
| GlobalDashboard      | CSS div bar chart     | `<BarChart>` with tooltips and axis labels     |
| ConferenceDashboard  | KPI cards only        | KPI cards + `<LineChart>` for tithe trends     |
| DistrictDashboard    | KPI cards only        | KPI cards + `<BarChart>` for church comparison |
| AttendancePage Stats | Inline SVG sparklines | `<AreaChart>` sparklines in cards              |
| FinancePage Overview | Text stats            | KPI cards + `<PieChart>` for fund distribution |

### 4.3 KPI Card Component

Standardize the 4-5 metrics cards that appear on all dashboards:

```tsx
<KPICard
  title="Total Tithe"
  value="$12,450"
  change={{ value: 8.2, type: "increase" }}
  icon={<DollarSign />}
  chart={<Sparkline data={trendData} />}
/>
```

---

## Phase 5: Polish & Accessibility (Weeks 9-10)

### 5.1 WCAG 2.2 AA Compliance

| Check                | Action                                                           |
| -------------------- | ---------------------------------------------------------------- |
| Focus visible        | Ensure `focus-visible:ring-2` on all interactive elements        |
| Touch targets 24x24  | Increase minimum button/icon sizes                               |
| Color contrast 4.5:1 | Audit all text/background pairs                                  |
| Keyboard navigation  | Tab through dropdowns, close with Escape, arrow keys in tables   |
| Screen reader labels | `aria-label` on icon buttons, `aria-live` on toast/notifications |
| Focus not obscured   | Modals must trap focus, no sticky footers overlapping inputs     |
| Consistent help      | Add "Help" link in sidebar footer that's always visible          |

### 5.2 Dark Mode

Add dark mode toggle to sidebar footer:

- Use Tailwind's `dark:` variant with CSS custom properties
- Persist preference in localStorage
- Respect `prefers-color-scheme` as default

### 5.3 Micro-Interactions

- Button press feedback (scale on click)
- Page transitions (opacity fade between routes)
- Hover states on all clickable elements
- Number counters animate on dashboard load
- Row highlight on table hover

### 5.4 Mobile Polish

- Swipeable sidebar on mobile
- Pull-to-refresh on list pages
- Bottom sheet for filters on mobile instead of inline
- Sticky CTA bar at bottom for form pages

---

## Phase 6: SDA-Specific UX (Weeks 11-12)

Based on competitor gap analysis — these features have zero competition in the SDA space.

### 6.1 Sabbath School Attendance UI

Unique to SDA — no generic ChMS handles this:

- Division-based attendance grid (Cradle Roll → Adult)
- Weekly recording with previous-week pre-fill
- Visual color-coded summary per division
- Quarterly report generation in Conference format

### 6.2 Membership Transfer Wizard

Multi-step guided workflow:

1. Sending clerk initiates → auto-generates formal letter
2. Conference secretary reviews → one-click approve/reject
3. Receiving clerk accepts → records church business meeting vote
4. Visual timeline showing current stage with color-coded status

### 6.3 Tithe Reconciliation Dashboard

Conference treasurer view:

- Table of churches with forwarded tithe vs. bank deposits
- Discrepancy highlighting (auto-flag mismatches)
- One-click "Mark as Received" with audit trail
- Export to Conference financial reporting format

### 6.4 Envelope Number System

Privacy-preserving giving:

- Auto-assign envelope numbers to members
- Giving declarations reference envelope number, not name
- Treasurer sees envelope → member mapping (authorized only)
- Reports show envelope numbers for audit

---

## Priority Matrix

| Priority | Item                                                  | Effort | Impact       | Depends on             |
| -------- | ----------------------------------------------------- | ------ | ------------ | ---------------------- |
| **P0**   | Shared component library (Button, Input, Card, Badge) | Medium | Critical     | Nothing                |
| **P0**   | Toast notification system                             | Low    | Critical     | Nothing                |
| **P0**   | Skeleton loaders                                      | Low    | High         | Nothing                |
| **P1**   | DataTable with sorting/filtering/pagination           | High   | Critical     | Button, Input, Badge   |
| **P1**   | Design token standardization                          | Low    | High         | Nothing                |
| **P1**   | Breadcrumbs                                           | Low    | Medium       | Nothing                |
| **P1**   | Form validation (useForm hook)                        | Medium | High         | Input                  |
| **P2**   | Charts (Recharts) on all dashboards                   | Medium | High         | Card, KPICard          |
| **P2**   | Sidebar collapse + icons (Lucide)                     | Medium | Medium       | Nothing                |
| **P2**   | Command palette (Cmd+K)                               | Low    | Medium       | Nothing                |
| **P2**   | Dark mode                                             | Medium | Medium       | Design tokens          |
| **P2**   | i18n activation                                       | High   | Medium       | All Phase 1 components |
| **P3**   | Multi-step forms                                      | Medium | Medium       | Form validation, Input |
| **P3**   | WCAG 2.2 AA audit + remediation                       | High   | High         | All components         |
| **P3**   | Micro-interactions + mobile polish                    | Medium | Medium       | All existing pages     |
| **P4**   | Sabbath School UI                                     | High   | High (SDA)   | DataTable, Charts      |
| **P4**   | Transfer wizard                                       | Medium | High (SDA)   | Multi-step forms       |
| **P4**   | Tithe reconciliation dashboard                        | Medium | High (SDA)   | Charts, DataTable      |
| **P4**   | Envelope number system                                | Medium | Medium (SDA) | Form validation        |

---

## Implementation Order (Recommended)

```
Week 1-2:  Shared components + toast + skeletons + design tokens
Week 3-4:  DataTable retrofit all pages + breadcrumbs
Week 5-6:  Form validation + input upgrades + i18n start
Week 7-8:  Recharts dashboards + KPI cards
Week 9-10: Accessibility + dark mode + mobile polish
Week 11-12: SDA-specific features (Sabbath School, transfers, tithe reconciliation)
```

---

## What NOT to Change

The following should be preserved as-is because they work well:

1. **Auth flow** — Login/signup/forgot-password pages are clean and functional
2. **Offline sync** — SyncIndicator, ConflictResolver, IndexedDB queue are well-designed
3. **Notification system** — Bell badge + dropdown with polling is solid
4. **Role-based navigation** — `modules.ts` RBAC driving sidebar is correctly architected
5. **Print styles** — Contributions statement and reports print CSS works
6. **Route-level code splitting** — `React.lazy()` for every page is correct
7. **Tailwind v4 + Vite** — Build tooling and CSS approach is modern and correct
8. **Tab pattern** — In-page tab navigation within pages (not URL routes) is fine for these use cases

---

## Success Metrics

| Metric                         | Baseline                           | Target                                   |
| ------------------------------ | ---------------------------------- | ---------------------------------------- |
| Components reused across pages | 0 (all copy-paste)                 | 8 shared components used by all pages    |
| Time to add a new page         | ~2 hours (rebuild everything)      | ~30 min (compose from shared components) |
| Lighthouse accessibility score | Unknown                            | 95+                                      |
| WCAG 2.2 AA violations         | Unknown                            | 0                                        |
| Pages with skeleton loading    | 0                                  | 100%                                     |
| Pages with proper empty states | 0 (text only)                      | 100% (icon + CTA)                        |
| i18n coverage                  | 0% of UI (only locale files exist) | 100% of navigation + forms               |
| Dashboard charts               | 0 (CSS div bars)                   | Recharts on all 5 dashboards             |
