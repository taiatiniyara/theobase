# Issue 28: Search Implementation

## What to build

Global search across all entities (members, reports, churches, actions). Fuzzy matching, recent searches, actionable results.

## Input/Output

**Input:** Search query string, user's organizational scope
**Output:** Ranked results across all searchable entities (members, reports, churches, meetings, actions), recent searches, "did you mean" suggestions for zero results

## Validation Requirements

- Query must be 2+ characters to trigger search
- Debounce: 200ms after last keystroke before API call
- Results ranked by relevance (exact match > starts-with > fuzzy)
- Fuzzy matching threshold: Levenshtein distance <= 2 for queries 4+ chars
- Results filtered by user's organizational scope
- Recent searches: last 10 stored locally, surfaced first on empty input
- Zero results: offer closest fuzzy match or suggest "Add a new member?"
- Long-press: "deep press" triggers context menu with quick actions
- Keyboard shortcut Cmd/Ctrl+K focuses search bar
- Each result navigates directly to its detail screen on tap

## Acceptance Criteria

- [ ] Global search bar always visible on every screen
- [ ] Type "John" → find members, reports, meetings with that name
- [ ] Type "baptism" → find baptism records, classes, reports
- [ ] Fuzzy matching: "Jhon" finds "John", "baptsm" finds "baptism"
- [ ] Recent searches surface first
- [ ] Tap result → navigate directly to relevant screen
- [ ] Long-press result → quick actions (edit, transfer, remove)
- [ ] Zero results: "Did you mean [closest match]?" or "Add a new member?"
- [ ] Debounced at 200ms (type, pause, search)
- [ ] Keyboard shortcut Ctrl+K on desktop

## Blocked by

- Issue 2, 5

## Docs

- `CHANGELOG.md`
