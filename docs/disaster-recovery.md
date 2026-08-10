# Disaster Recovery

This document describes how to recover the Theobase database from Cloudflare D1's point-in-time restore capability.

## Recovery Point Objective (RPO)

**~30 minutes.** D1 automatically backs up the database continuously. The most you can lose is the transactions since the last backup checkpoint.

## Recovery Time Objective (RTO)

**~1 hour.** From detection of data loss to full recovery, assuming an operator is available.

## Scenario: Restore the database

### 1. Identify the database

Theobase uses a single D1 database named `theobase`. Find the database ID:

- Cloudflare Dashboard -> Workers & Pages -> D1 -> find `theobase`
- Or via CLI: `npx wrangler d1 list`

### 2. Initiate restore

1. In the Cloudflare Dashboard, open the `theobase` D1 database.
2. Click the **Backups** tab.
3. Select the restore point just before the data loss event.
4. Click **Restore**.
5. Confirm the restore. D1 creates a new database with the restored data. The original is NOT overwritten.

### 3. Update the Worker binding

After restore, you need to point the Worker at the restored database:

1. In Cloudflare Dashboard, go to Workers & Pages -> theobase -> Settings -> Variables -> D1 Database Bindings.
2. Update the `DB` binding to point to the restored database ID.
3. Redeploy the Worker: `npx wrangler deploy`.

### 4. Verify integrity

1. Log in as the Conference administrator.
2. Check the audit trail — the last entries should match the restore point.
3. Verify a few critical records: member count, last offering batch, most recent transfer.
4. If any data is missing, repeat the restore with an earlier restore point.

## Scenario: Wrong database restored

If you accidentally restore the wrong database:

1. **Do not panic.** The original database was not overwritten.
2. Find the original database ID (it's still in the D1 list with the old name).
3. Revert the Worker binding to the original database ID.
4. Repeat the restore procedure with the correct database.

## Scenario: Partial data corruption

If only some tables are corrupted (e.g., `transactions` but not `members`):

1. Restore the database to a new D1 instance (as above).
2. Export the affected table from the restored database:
   ```bash
   npx wrangler d1 export theobase-restored --table transactions --output transactions.sql
   ```
3. Import the exported data into the production database:
   ```bash
   npx wrangler d1 execute theobase --file=transactions.sql
   ```
4. Verify the imported data is correct.
5. Delete the temporary restored database.

## Escalation

If you cannot restore via the Cloudflare Dashboard:

- Cloudflare Support: https://dash.cloudflare.com/?to=/:account/support
- Emergency contact: [add your contact info here]
- Theobase repository: https://github.com/taiatiniyara/theobase

## Prevention

- The audit trail (`audit_log` table) is append-only — never truncated or updated. This provides a secondary reconstruction path if D1 backups are unavailable.
- All financial transactions are immutable after dual-custody confirmation per ADR-0001.
- Data is isolated by conference within the database using `conference_id` columns on all core tables.
