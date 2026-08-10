# UI/UX Standards for Theobase — SDA Church Administration Platform

> Research compiled August 2026 from primary sources (official docs, specs, first-party design systems).

---

## 1. Dashboard UX Patterns

### 1.1 Layout Architecture (Next.js App Router + shadcn/ui)

Modern admin dashboards use a **persistent sidebar + scrollable content area** pattern with nested layouts for module grouping:

```tsx
// Root layout (applies sidebar + header to all pages)
<SidebarProvider>
  <AppSidebar />
  <main className="w-full">
    <header>
      <SidebarTrigger /> <Breadcrumb />
    </header>
    {children}
  </main>
</SidebarProvider>
```

**Source:** Next.js Layouts — <https://nextjs.org/docs/app/building-your-application/routing/layouts-and-templates>

### 1.2 Data Density & Hierarchy

Vercel's Geist design system establishes these visual hierarchy principles:

- **Colors:** High contrast, accessible color system with semantic tokens
- **Typography:** Geist Sans for UI, Geist Mono for data/tables
- **Grid:** Core part of Vercel's aesthetic — consistent spacing rhythms
- **Materials:** Presets for radii, fills, strokes, and shadows define elevation

**Source:** Vercel Geist Design System — <https://vercel.com/geist/introduction>

### 1.3 Sidebar Navigation Pattern

The shadcn/ui sidebar pattern (used by Vercel, Linear-style apps) provides:

| Feature                | Implementation                                                     |
| ---------------------- | ------------------------------------------------------------------ |
| **Collapsible states** | `offcanvas` (slides out), `icon` (collapses to icons only), `none` |
| **Variants**           | `sidebar` (default), `floating`, `inset`                           |
| **Grouping**           | `SidebarGroup` → `SidebarGroupLabel` + `SidebarMenu`               |
| **Nested navigation**  | `SidebarMenuSub` + `SidebarMenuSubItem` for drill-downs            |
| **Active states**      | `isActive` prop on `SidebarMenuButton`                             |
| **Badges**             | `SidebarMenuBadge` for counts (e.g., pending approvals)            |
| **Keyboard shortcut**  | `Cmd+B` / `Ctrl+B` to toggle                                       |
| **Width**              | Desktop: `16rem` (256px), Mobile: `18rem` (288px)                  |
| **Footer**             | `SidebarFooter` for user menu, settings, logout                    |
| **Header**             | `SidebarHeader` for branding or workspace switcher                 |

**Source:** shadcn/ui Sidebar — <https://ui.shadcn.com/docs/components/sidebar>

### 1.4 State Persistence

Navigation state must persist — Next.js layouts **preserve state, remain interactive, and do not rerender on navigation** between pages sharing a layout. Use this for sidebar collapsed state, active module selection, etc.

**Source:** Next.js Layouts — <https://nextjs.org/docs/app/building-your-application/routing/layouts-and-templates>

### 1.5 Concrete Dashboard Pattern for Theobase

```
┌──────────────────────────────────────────────────┐
│ Sidebar (16rem)            │ Main Content Area   │
│                             │                      │
│ [Logo/Theobase]            │ [Breadcrumb] [Search] │
│                             │                      │
│ ── MAIN ──                 │ ┌──────────────────┐ │
│ 📊 Dashboard               │ │ KPI Cards Row    │ │
│                             │ │ [Members][Tithe] │ │
│ ── MODULES ──              │ │ [Attendance]...   │ │
│ 👥 Membership              │ └──────────────────┘ │
│   ├ Member Directory       │                      │
│   ├ Add Member             │ ┌──────────────────┐ │
│   └ Transfers              │ │ Charts Grid       │ │
│ 💰 Finance                 │ │ [Line][Bar]      │ │
│   ├ Tithes & Offerings     │ │ [Pie][Donut]     │ │
│   ├ Batches                │ └──────────────────┘ │
│   └ Reports                │                      │
│ 📋 Attendance              │ ┌──────────────────┐ │
│ ⛪ Organization            │ │ Recent Activity   │ │
│                             │ │ Table            │ │
│ ── TOOLS ──                │ └──────────────────┘ │
│ ⚙️ Settings                │                      │
│                             │                      │
│ [User Menu]                │                      │
└──────────────────────────────────────────────────┘
```

---

## 2. Form Design

### 2.1 React Aria Patterns (Adobe)

React Aria Components provide production-grade form patterns used by Adobe Spectrum:

#### Labels and Help Text

- **Every field must have a visible `<Label>`** — automatically associated with the input via DOM nesting
- **Secondary description** via `slot="description"` — announced by screen readers on focus
- For rare unlabeled fields, `aria-label` or `aria-labelledby` is required

```tsx
<TextField type="password">
  <Label>Password</Label>
  <Input placeholder="Choose a password" />
  <Text slot="description">Password must be at least 8 characters.</Text>
</TextField>
```

#### Validation Architecture

| Strategy                       | When to Use                                                                |
| ------------------------------ | -------------------------------------------------------------------------- |
| **HTML constraint validation** | `isRequired`, `minLength`, `maxLength`, `pattern`, `type="email"`          |
| **Custom validation**          | `validate` function returning error string(s)                              |
| **Realtime validation**        | Controlled `value` + `isInvalid`/`errorMessage` for password strength etc. |
| **Server validation**          | `validationErrors` prop on `Form` with `{ fieldName: errorMessage[] }`     |
| **Schema validation**          | Zod `safeParse` → `flatten().fieldErrors`                                  |

**Key rule:** Validation errors display **after value is committed (on blur)** by default, NOT on every keystroke. This avoids confusing users with premature errors. Exception: password requirements, which benefit from realtime feedback.

#### Error Display

```tsx
<FieldError>
  {({ validationDetails }) => (validationDetails.valueMissing ? "Please enter a name." : "")}
</FieldError>
```

**Source:** React Aria Forms — <https://react-spectrum.adobe.com/react-aria/forms.html>

### 2.2 Complex Data Entry (Multiple Sections)

For forms like Member Records or Financial Batches:

- **Section with headings** — use `<fieldset>` + `<legend>` or grouped cards
- **Multi-step** when > ~8 fields — break into steps with progress indicator
- **Save progress** — auto-save drafts for long forms (critical for offline PWA)
- **Server validation errors** — return `validationErrors` mapping, display inline per field

### 2.3 Form Submission Patterns

```tsx
// React 19 action (preferred)
<Form action={async (formData) => {
  const result = schema.safeParse(Object.fromEntries(formData));
  if (!result.success) return { errors: result.error.flatten().fieldErrors };
  await saveToDb(result.data);
}}>
```

### 2.4 PWA Offline Forms

For church environments with unreliable internet:

- **Service Worker cache-first** strategy for form pages
- **Background Sync API** — queue form submissions when offline, send when connectivity returns
- **IndexedDB** for draft persistence

```js
// Register background sync for form submission
swRegistration.sync.register("submit-attendance");
```

**Source:** MDN Offline and Background Operation — <https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation>

---

## 3. Table / Data Grid UX

### 3.1 TanStack Table v9 Architecture (shadcn/ui Data Table)

TanStack Table v9 uses a **feature-based** design — you opt into sorting, filtering, pagination, etc. Anything unlisted is tree-shaken:

```tsx
export const features = tableFeatures({
  columnFilteringFeature,
  columnVisibilityFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
  filterFns: { includesString: filterFn_includesString },
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text },
});
```

### 3.2 Required Table Features for Admin

| Feature               | Purpose                              | Theobase Use                                  |
| --------------------- | ------------------------------------ | --------------------------------------------- |
| **Sorting**           | Click column header to sort asc/desc | Sort members by name, date, amount            |
| **Filtering**         | Per-column search inputs             | Filter members by status, district            |
| **Pagination**        | Client or server-side page controls  | 25/50/100 rows per page, first/last/prev/next |
| **Column visibility** | Toggle columns on/off via dropdown   | Show/hide optional member fields              |
| **Row selection**     | Checkbox per row + select-all header | Bulk delete, export, transfer members         |
| **Row actions**       | Kebab menu per row (DropdownMenu)    | Edit, view details, delete, transfer          |

### 3.3 Pagination Component Pattern

```tsx
// Page controls with full navigation
<div className="flex items-center justify-between px-2">
  <div className="text-sm text-muted-foreground">
    {selectedCount} of {totalCount} row(s) selected.
  </div>
  <div className="flex items-center gap-2">
    <Select value={pageSize}> {/* 10, 20, 25, 30, 40, 50 */}
    <span>Page {pageIndex + 1} of {pageCount}</span>
    <Button onClick={firstPage}><ChevronsLeft /></Button>
    <Button onClick={prevPage}><ChevronLeft /></Button>
    <Button onClick={nextPage}><ChevronRight /></Button>
    <Button onClick={lastPage}><ChevronsRight /></Button>
  </div>
</div>
```

### 3.4 Column Header Pattern (Sortable + Hideable)

Each column header should support:

- **Click to sort** (asc → desc → none)
- **Dropdown** for: Sort Asc, Sort Desc, Hide column
- **Visual indicator** — `ArrowUp` when asc, `ArrowDown` when desc, `ChevronsUpDown` when unsorted

### 3.5 Empty State

```tsx
<TableRow>
  <TableCell colSpan={columns.length} className="h-24 text-center">
    No results.
  </TableCell>
</TableRow>
```

### 3.6 Bulk Actions Pattern

When rows are selected, show a floating toolbar:

```tsx
{
  selectedRows.length > 0 && (
    <div className="bg-primary text-primary-foreground px-4 py-2 rounded-md">
      {selectedRows.length} selected —<Button variant="link">Delete</Button>
      <Button variant="link">Export</Button>
      <Button variant="link">Transfer</Button>
    </div>
  );
}
```

**Source:** shadcn/ui Data Table — <https://ui.shadcn.com/docs/components/data-table>

---

## 4. Information Architecture

### 4.1 Multi-Module Admin Structure

Theobase has 4 core modules. Use **Next.js route groups** to organize:

```
app/
├── (dashboard)/
│   ├── layout.tsx          ← Sidebar + header wrapper
│   └── page.tsx            ← Dashboard home
├── (dashboard)/membership/
│   ├── layout.tsx          ← Module-specific header (breadcrumb, context)
│   ├── page.tsx            ← Member directory (table)
│   ├── [memberId]/page.tsx ← Member detail
│   └── add/page.tsx        ← Add member form
├── (dashboard)/finance/
│   ├── layout.tsx
│   ├── page.tsx            ← Finance dashboard
│   ├── tithes/page.tsx     ← Tithes table
│   ├── batches/
│   │   ├── page.tsx        ← Batch list
│   │   └── [batchId]/page.tsx ← Batch detail
│   └── reports/page.tsx
├── (dashboard)/attendance/
│   ├── layout.tsx
│   ├── page.tsx
│   └── record/page.tsx     ← Attendance recording form
└── (dashboard)/organization/
    ├── layout.tsx
    ├── page.tsx
    ├── churches/page.tsx
    └── districts/page.tsx
```

### 4.2 Module Grouping Principles

- **Route groups** `(dashboard)` share the sidebar layout without affecting URL
- Each module can have its own nested `layout.tsx` for module-level context (e.g., breadcrumbs, filters that persist)
- **Deep linking** — every list item and detail view has its own URL for shareability

### 4.3 Shopify Polaris Admin Pattern

Shopify's admin uses **App Home (iframe)** + **Admin UI extensions** for modular multi-surface admin experiences. Key takeaway: keep sidebar navigation consistent across all modules; each surface gets its own set of context-aware actions.

**Source:** Shopify Polaris — <https://shopify.dev/docs/api/polaris>

---

## 5. Accessibility (WCAG 2.2 AA)

### 5.1 WCAG 2.2 New Success Criteria

WCAG 2.2 became a W3C Recommendation on **12 December 2024**. New AA criteria relevant to admin tools:

| Criterion                                     | Level | Requirement                                                                                                                                             |
| --------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **2.4.11 Focus Not Obscured (Minimum)**       | AA    | When a UI component receives keyboard focus, it must not be entirely hidden by other content                                                            |
| **2.5.7 Dragging Movements**                  | AA    | For any action that uses dragging, a single-pointer alternative must be available (e.g., click to select, not just drag)                                |
| **2.5.8 Target Size (Minimum)**               | AA    | Pointer target size must be at least **24×24 CSS pixels** (with exceptions for inline links)                                                            |
| **3.2.6 Consistent Help**                     | A     | Help mechanisms (contact, FAQ, chatbot) must appear in the same relative order across pages                                                             |
| **3.3.7 Redundant Entry**                     | A     | Information previously entered by or provided to the user in the same process must be auto-populated or available to select (no re-typing)              |
| **3.3.8 Accessible Authentication (Minimum)** | AA    | Cognitive function tests (memorizing passwords, solving puzzles) must not be required unless alternatives exist (password managers, copy-paste allowed) |

**Source:** W3C WCAG 2.2 — <https://www.w3.org/TR/WCAG22/>

### 5.2 Existing WCAG 2.1 AA Requirements to Maintain

| Criterion                                           | Requirement                                                                                | Implementation                                                            |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| **1.3.1 Info & Relationships**                      | Structure must be programmatically determinable                                            | Use semantic HTML (`<table>`, `<thead>`, `<th scope>`, `<nav>`, `<main>`) |
| **1.3.4 Orientation**                               | Content must work in both portrait and landscape                                           | CSS media queries, not `orientation` lock                                 |
| **1.4.3 Contrast (Minimum)**                        | Text 4.5:1, Large text 3:1                                                                 | Use Tailwind's built-in contrast-safe color pairs                         |
| **1.4.10 Reflow**                                   | Content at 320px width without 2D scroll                                                   | Mobile-first responsive tables (stack cards on mobile)                    |
| **1.4.11 Non-text Contrast**                        | UI components 3:1 against adjacent colors                                                  | Button borders, input borders, focus rings                                |
| **1.4.12 Text Spacing**                             | Must handle user overrides of line-height, letter-spacing, word-spacing, paragraph-spacing |
| **2.1.1 Keyboard**                                  | All functionality via keyboard                                                             | Radix UI primitives guarantee this                                        |
| **2.4.3 Focus Order**                               | Meaningful tab sequence                                                                    | Tab index follows visual layout                                           |
| **2.4.6 Headings & Labels**                         | Headings describe topic, labels describe purpose                                           | Every input has `<Label>`, every section has `<h2>`/`<h3>`                |
| **2.4.7 Focus Visible**                             | Keyboard focus indicator is visible                                                        | Use Tailwind `focus-visible:ring-2`                                       |
| **3.3.1 Error Identification**                      | Describe errors in text                                                                    | `FieldError` component with specific message                              |
| **3.3.2 Labels or Instructions**                    | Labels for all inputs                                                                      | React Aria `<Label>`                                                      |
| **3.3.4 Error Prevention (Legal, Financial, Data)** | Reversible, checked, confirmed                                                             | Confirmation dialogs for destructive financial actions                    |
| **4.1.2 Name, Role, Value**                         | All UI components expose this to assistive tech                                            | Radix primitives + React Aria handle this                                 |

### 5.3 Component Library Accessibility

Use **Radix UI primitives** — they adhere to WAI-ARIA design patterns:

- **Select:** [ListBox WAI-ARIA pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox)
- **Dialog:** Modal dialog pattern
- **Dropdown Menu:** Menu pattern

**Keyboard:** Space/Enter to open, Arrow keys to navigate, Esc to close, typeahead for quick selection.

**Source:** Radix UI Select — <https://www.radix-ui.com/primitives/docs/components/select>

---

## 6. Mobile Responsiveness (PWA + Offline)

### 6.1 PWA Architecture

Theobase must work offline in churches with unreliable internet. Architecture from MDN:

```
Main App (HTML/CSS/JS)          Service Worker
├── UI rendering                ├── Cache API (offline resources)
├── User interaction            ├── Fetch interception (cache-first)
├── Form handling               ├── Background Sync (queue submissions)
└── IndexedDB (local data)      └── Periodic Sync (refresh data)
```

### 6.2 Offline Strategy (Cache-First)

```js
// service-worker.js
const cacheFirst = async ({ request, fallbackUrl }) => {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open("v1");
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch {
    const fallback = await caches.match(fallbackUrl);
    return fallback || new Response("Offline — please reconnect", { status: 408 });
  }
};

self.addEventListener("fetch", (event) => {
  event.respondWith(cacheFirst({ request: event.request, fallbackUrl: "/offline.html" }));
});
```

### 6.3 Background Sync for Queued Actions

When a church secretary submits attendance or financial data while offline:

```js
// main.js — register sync
const sw = await navigator.serviceWorker.ready;
sw.sync.register("submit-attendance");

// service-worker.js — handle when online
self.addEventListener("sync", (event) => {
  if (event.tag === "submit-attendance") {
    event.waitUntil(sendQueuedAttendance());
  }
});
```

### 6.4 Mobile Table Pattern

On screens < 768px, admin tables should:

- **Stack as cards** — each row becomes a card with label:value pairs
- **Or use horizontal scroll** — for very wide tables, allow horizontal scroll with sticky first column
- **Show only critical columns** — use `columnVisibility` to hide less important columns on mobile
- **Simplify pagination** — show only prev/next on mobile, full controls on desktop

```tsx
// Hide amount and status columns on mobile
const mobileHiddenColumns = { amount: false, status: false }; // controlled by useMediaQuery
```

### 6.5 Sidebar on Mobile

shadcn/ui sidebar handles mobile natively:

- **Offcanvas variant** — slides over content on mobile
- **Trigger** — hamburger button in header
- **Backdrop** — closes on tap outside
- **Width:** `18rem` on mobile

### 6.6 PWA Installability

- **Web App Manifest** with `"display": "standalone"`, icons, theme color
- **Service Worker** with offline fallback page
- The app should feel native — no browser chrome when installed

**Source:** MDN PWA Offline Guide — <https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation>

---

## 7. Color and Typography

### 7.1 Semantic Color System (Tailwind CSS v4 / shadcn/ui)

Modern SaaS uses **semantic CSS variables** mapped to Tailwind — NOT fixed hex values:

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 240 5.9% 10%;
  }

  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --card: 240 10% 3.9%;
    --card-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 240 5.9% 10%;
    /* ... etc */
  }
}
```

**Source:** shadcn/ui Theming — <https://ui.shadcn.com/docs/theming>

### 7.2 Typography

- **UI text:** Inter (system sans-serif) — the standard for modern SaaS
- **Data / monospace:** JetBrains Mono or Geist Mono — for numbers in tables, amounts, IDs
- **Scale:** Tailwind default text scale (text-xs through text-9xl)
- **Body:** `text-sm` (14px) for table content, `text-base` (16px) for form content
- **Headings:** `text-lg` (18px) for card titles, `text-2xl` (24px) for page titles

**Source:** Vercel Geist Typography — <https://vercel.com/geist/typography>

### 7.3 Color Usage in Admin Context

| Color                        | Semantic Use                                        |
| ---------------------------- | --------------------------------------------------- |
| `primary`                    | Main actions, active nav items, selected rows       |
| `secondary`                  | Secondary buttons, hover states                     |
| `muted` / `muted-foreground` | Helper text, descriptions, placeholder text         |
| `destructive`                | Delete buttons, error states, overdue indicators    |
| `success` (custom)           | Confirmation, completed batches, present attendance |
| `warning` (custom)           | Pending approval, low attendance alerts             |
| `info` (custom)              | System messages, tips                               |

### 7.4 Contrast Compliance

Generate all color pairs through a contrast checker. Tailwind's default palette passes AA minimum (4.5:1 for normal text, 3:1 for large text) when used correctly (e.g., `text-gray-900` on `bg-white`).

**Source:** Tailwind CSS Colors — <https://tailwindcss.com/docs/customizing-colors>

---

## 8. Loading, Empty, and Error States

### 8.1 Loading States

| Pattern              | Implementation                             | When                                     |
| -------------------- | ------------------------------------------ | ---------------------------------------- |
| **Skeleton screens** | `SidebarMenuSkeleton`, table skeleton rows | Page initial load, data fetch            |
| **Spinner**          | `Spinner` component                        | Button loading, small operations         |
| **Progress bar**     | Top-of-page linear progress                | Long operations (batch processing)       |
| **Optimistic UI**    | Update UI immediately, revert on error     | Quick actions (check/uncheck attendance) |
| **Disabled state**   | `disabled` + cursor change                 | Prevent double-submit on forms           |

### 8.2 Empty States

Every list/table must have a deliberate empty state:

```tsx
// Table empty state
{
  rows.length === 0 && (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="h-12 w-12 text-muted-foreground/50" />
      <h3 className="mt-4 text-lg font-semibold">No members yet</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Get started by adding your first church member.
      </p>
      <Button className="mt-4">Add Member</Button>
    </div>
  );
}
```

**Theobase-specific empty states:**

- **No members:** "Add your first member" + CTA
- **No tithes:** "No tithes recorded this month" + date range selector
- **No attendance records:** "No attendance taken this Sabbath" + "Record Attendance" CTA
- **No search results:** "No members match your search" + clear filters link

### 8.3 Error States

| Type                       | Pattern                                                        |
| -------------------------- | -------------------------------------------------------------- |
| **Form validation errors** | Inline `FieldError` below the input, red border, error icon    |
| **API errors**             | Toast notification (top-right) with retry action               |
| **Network errors**         | Full-page offline state with cached data indicator             |
| **Permission errors**      | Redirect to dashboard with explanatory toast                   |
| **404 pages**              | Custom not-found page with navigation back to safety           |
| **Server errors**          | Generic error page with "Try again" and "Report issue" actions |

---

## 9. Navigation Patterns

### 9.1 Recommended: Persistent Sidebar with Collapsibility

**Why sidebar over top nav:** Admin apps have 4+ modules with nested items. A sidebar:

- Uses vertical space efficiently (screens are wider than tall)
- Supports 2+ levels of nesting without cramping
- Collapses to icons to maximize content space
- Shows active location clearly
- Works on mobile as offcanvas drawer

### 9.2 Navigation Structure for Theobase

```
Sidebar
├── [Logo] Theobase
├── ── MAIN ──
│   └── Dashboard            ← Home / overview
├── ── MODULES ──
│   ├── Membership           ← Collapsible group
│   │   ├── Member Directory  ← Table with filters
│   │   ├── Add Member        ← Form
│   │   ├── Families          ← Table
│   │   ├── Transfers         ← List
│   │   └── Reports           ← Member stats
│   ├── Finance              ← Collapsible group
│   │   ├── Tithes & Offerings
│   │   ├── Batches
│   │   ├── Expenses
│   │   ├── Budget
│   │   └── Reports
│   ├── Attendance           ← Collapsible group
│   │   ├── Record Attendance
│   │   ├── Attendance History
│   │   ├── Sabbath School
│   │   └── Reports
│   └── Organization         ← Collapsible group
│       ├── Churches
│       ├── Districts/Conferences
│       ├── Departments
│       └── Officers
├── ── TOOLS ──
│   ├── Settings
│   ├── Audit Log
│   └── Help & Support
└── [Footer] User avatar + name + role
```

### 9.3 Collapsible Groups

```tsx
<Collapsible defaultOpen className="group/collapsible">
  <SidebarGroup>
    <SidebarGroupLabel asChild>
      <CollapsibleTrigger>
        Membership
        <ChevronDown
          className="ml-auto transition-transform
          group-data-[state=open]/collapsible:rotate-180"
        />
      </CollapsibleTrigger>
    </SidebarGroupLabel>
    <CollapsibleContent>
      <SidebarGroupContent>
        <SidebarMenu>{/* Nav items */}</SidebarMenu>
      </SidebarGroupContent>
    </CollapsibleContent>
  </SidebarGroup>
</Collapsible>
```

### 9.4 Breadcrumbs

Always show breadcrumbs in the header for orientation:

```
Membership / Member Directory
Finance / Batches / Batch #1234
```

### 9.5 Active State

- Highlight the **exact matched** route in the sidebar
- Expand parent groups when a child is active
- Use `isActive` prop on `SidebarMenuButton`

### 9.6 Keyboard Navigation

- `Tab` through interactive elements in order
- `Enter` / `Space` to activate
- `Escape` to close modals, dropdowns
- `Cmd/Ctrl + K` for command palette / quick search
- `Cmd/Ctrl + B` to toggle sidebar

---

## 10. Data Visualization

### 10.1 Chart Types for Church Metrics

| Metric                      | Chart Type                  | Why                                               |
| --------------------------- | --------------------------- | ------------------------------------------------- |
| **Tithe trends over time**  | Line chart (area fill)      | Shows growth/decline patterns across months/years |
| **Attendance by Sabbath**   | Bar chart                   | Easy comparison of week-over-week numbers         |
| **Membership demographics** | Pie/donut chart             | Age groups, gender, baptism status distribution   |
| **Budget vs actual**        | Horizontal bar chart        | Compare planned vs actual spending per category   |
| **Member growth**           | Line chart with annotations | Net growth (baptisms - transfers out - deaths)    |
| **Church comparison**       | Grouped bar chart           | Compare metrics across churches in a district     |
| **Monthly summary cards**   | Stat cards with sparklines  | Quick-glance KPI cards for dashboard              |

### 10.2 Chart Best Practices

- **Labels:** Always label axes. Use `formatter` for currency ($) and percentages
- **Tooltips:** Show exact values on hover (via `ChartTooltip`)
- **Legends:** Place at bottom or right; interactive toggle to show/hide series
- **Colors:** Use semantic colors (green for income/growth, red for expense/decline)
- **Responsive:** Charts must resize. Use `ResponsiveContainer` with percentage width
- **Empty state:** Show "No data for this period" with date range suggestion
- **Loading state:** Skeleton placeholder matching chart dimensions

### 10.3 Recommended Library

**Recharts** (built on D3) — used by shadcn/ui Charts block, React-native composable API:

```tsx
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

<ResponsiveContainer width="100%" height={300}>
  <LineChart data={titheData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="month" />
    <YAxis tickFormatter={(v) => `$${v.toLocaleString()}`} />
    <Tooltip />
    <Line type="monotone" dataKey="amount" stroke="var(--primary)" />
  </LineChart>
</ResponsiveContainer>;
```

### 10.4 Dashboard Card KPI Pattern

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">Total Members</CardTitle>
      <Users className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">1,234</div>
      <p className="text-xs text-muted-foreground">+12 from last quarter</p>
    </CardContent>
  </Card>
  {/* Repeat for Tithes Total, Avg Attendance, Active Departments */}
</div>
```

---

## 11. Implementation Stack Recommendations

| Layer             | Technology                        | Rationale                                        |
| ----------------- | --------------------------------- | ------------------------------------------------ |
| **Framework**     | Next.js 15+ (App Router)          | Server components, layouts, parallel routes      |
| **UI Primitives** | Radix UI (via shadcn/ui)          | WCAG-compliant, headless, composable             |
| **Styling**       | Tailwind CSS v4                   | Utility-first, semantic CSS variables, dark mode |
| **Tables**        | TanStack Table v9                 | Headless, feature-based, tree-shakeable          |
| **Forms**         | React Aria Components             | Accessible labels, validation, error handling    |
| **Charts**        | Recharts                          | Composable React charts, shadcn/ui integration   |
| **Icons**         | Lucide React                      | MIT-licensed, consistent, 1000+ icons            |
| **PWA**           | Service Worker + Workbox          | Offline caching, background sync                 |
| **State**         | URL search params + React Context | Shareable state, no global store needed          |

---

## 12. Key WCAG 2.2 AA Checklist for Theobase

- [ ] All text meets 4.5:1 contrast ratio (1.4.3)
- [ ] All UI components meet 3:1 contrast (1.4.11)
- [ ] Content works at 320px width without horizontal scroll (1.4.10)
- [ ] All functionality operable by keyboard alone (2.1.1)
- [ ] Visible focus indicator on all interactive elements (2.4.7)
- [ ] Focus never obscured by other content (2.4.11)
- [ ] Labels on all form inputs (3.3.2)
- [ ] Error messages describe the problem specifically (3.3.1)
- [ ] Financial data entry is reversible/confirmed (3.3.4)
- [ ] Touch targets minimum 24×24px (2.5.8)
- [ ] No functionality requires dragging only (2.5.7)
- [ ] Navigation order consistent across pages (3.2.3)
- [ ] Page has descriptive `<title>` (2.4.2)
- [ ] Proper heading hierarchy `<h1>` → `<h2>` → `<h3>` (2.4.6)
- [ ] Content not locked to single orientation (1.3.4)
- [ ] Redundant data entry avoided — auto-populate where possible (3.3.7)
- [ ] Accessible authentication — password managers allowed, no CAPTCHA-only (3.3.8)
- [ ] Help available in consistent location (3.2.6)
- [ ] Status messages announced to screen readers (4.1.3)
- [ ] Dark mode support with full contrast compliance

**Source:** W3C WCAG 2.2 — <https://www.w3.org/TR/WCAG22/>

---

## References

1. **WCAG 2.2** — W3C Recommendation, 12 Dec 2024 — <https://www.w3.org/TR/WCAG22/>
2. **Vercel Geist Design System** — <https://vercel.com/geist/introduction>
3. **shadcn/ui Sidebar** — <https://ui.shadcn.com/docs/components/sidebar>
4. **shadcn/ui Data Table (TanStack Table v9)** — <https://ui.shadcn.com/docs/components/data-table>
5. **Next.js Layouts & Pages** — <https://nextjs.org/docs/app/building-your-application/routing/layouts-and-templates>
6. **React Aria Forms (Adobe)** — <https://react-spectrum.adobe.com/react-aria/forms.html>
7. **Radix UI Select (WAI-ARIA)** — <https://www.radix-ui.com/primitives/docs/components/select>
8. **Tailwind CSS Colors** — <https://tailwindcss.com/docs/customizing-colors>
9. **MDN PWA Offline & Background Operation** — <https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation>
10. **Shopify Polaris Admin Patterns** — <https://shopify.dev/docs/api/polaris>
11. **shadcn/ui Theming** — <https://ui.shadcn.com/docs/theming>
