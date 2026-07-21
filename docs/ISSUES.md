# Issues — Dependency Graph

| #   | Title                             | GitHub                                                      | Type | Blocked by       |
| --- | --------------------------------- | ----------------------------------------------------------- | ---- | ---------------- |
| 1   | Foundation — Org Hierarchy & Auth | [#118](https://github.com/taiatiniyara/theobase/issues/118) | AFK  | None             |
| 2   | Membership Core                   | [#119](https://github.com/taiatiniyara/theobase/issues/119) | AFK  | #118             |
| 3   | Financial Records                 | [#120](https://github.com/taiatiniyara/theobase/issues/120) | AFK  | #118             |
| 4   | Member & Proxy Self-Service       | [#121](https://github.com/taiatiniyara/theobase/issues/121) | AFK  | #119             |
| 5   | Attendance Tracking               | [#122](https://github.com/taiatiniyara/theobase/issues/122) | AFK  | #118             |
| 6   | Transfer Workflow                 | [#123](https://github.com/taiatiniyara/theobase/issues/123) | AFK  | #119             |
| 7   | Conference/Union/Division Reports | [#124](https://github.com/taiatiniyara/theobase/issues/124) | AFK  | #119, #120, #122 |
| 8   | Offline PWA                       | [#125](https://github.com/taiatiniyara/theobase/issues/125) | AFK  | #121             |
| 9   | Contribution Statements           | [#126](https://github.com/taiatiniyara/theobase/issues/126) | AFK  | #120             |
| 10  | Admin Health & Polish             | [#127](https://github.com/taiatiniyara/theobase/issues/127) | AFK  | #124, #125       |

## Dependency Graph

```
#118 (Foundation)
 ├── #119 (Membership)
 │    ├── #121 (Member & Proxy)
 │    │    └── #125 (Offline PWA)
 │    └── #123 (Transfer Workflow)
 ├── #120 (Financial)
 │    ├── #126 (Contribution Statements)
 │    └── #124 (Reports) ─────────┐
 ├── #122 (Attendance)            │
 │    └── #124 (Reports) ─────────┤
 │                                │
 #124 (Reports) ──────────────────┤
 #125 (Offline PWA) ──────────────┤
              └── #127 (Admin Health & Polish)
```

## Tracer Bullet

**#118 Foundation** is the tracer bullet — the thinnest vertical slice through every layer: D1 schema → Worker API → JWT auth → React UI → Vitest tests. Once merged, every subsequent issue adds a single feature on top of a working skeleton.

## Parent

PRD: [#117](https://github.com/taiatiniyara/theobase/issues/117) — Theobase SDA Grassroots Management Platform
