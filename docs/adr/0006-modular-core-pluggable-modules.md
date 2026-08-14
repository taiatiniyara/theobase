# A modular core with pluggable domain modules

Theobase is built around a shared core — the Unit tree, Person and Member records, the versioned Policy engine, and the offline/sync pipeline — onto which domain modules are added as plugins. Finance is the first module; membership, attendance, ministry, education, and others follow. No module is a standalone app.

This is what makes "everything in one place" possible: every module shares the same org spine, the same people, and the same policy and sync machinery, so data from different modules can be aggregated and reconciled together rather than living in separate silos.

Consequence: the core must be designed for extension from the start — stable interfaces for records, policy rules, and sync — and the first module (finance) must be built on that core, not as a one-off. The same shared frontend ships to both the phone (PWA) and the office (Tauri), with domain logic living in a single shared core that both shells reuse.
