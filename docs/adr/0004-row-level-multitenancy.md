# Row-level multi-tenancy with organisation_id

All church data lives in one D1 database, partitioned by an `organisation_id` column on every table. Database-per-church was rejected because D1 has per-database minimum costs and management overhead that doesn't scale to thousands of churches. The API layer enforces organisation scoping on every query — no query reaches D1 without an organisation filter.
