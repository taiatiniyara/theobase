# REST API for Phase 1

The Worker exposes a REST API, not GraphQL. REST maps cleanly to the sync protocol (push/pull changes, conflict resolution endpoints) and is simpler to cache and secure. GraphQL may be added later for reporting and analytics queries as a complementary surface.
