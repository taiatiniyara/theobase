# Drizzle ORM for database access

Drizzle ORM is the database access layer for both D1 (cloud) and local SQLite (WASM). Drizzle targets SQLite natively, generates D1-compatible migrations, and the same query code runs on both sides. Raw SQL was rejected because it adds boilerplate for schema parity; Kysely was considered but Drizzle's migration tooling and SQLite-first design made it the better fit. This carries meaningful lock-in — swapping the ORM later would touch every query in the codebase.
