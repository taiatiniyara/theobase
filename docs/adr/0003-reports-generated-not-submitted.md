# ADR-0003: Reports Are Generated, Not Submitted

**Status:** Accepted
**Date:** 2026-07-21

## Context

The SDA Church requires quarterly statistical reports (QSR) from every local church to the conference, covering membership counts, attendance, baptisms, and financial summaries. The traditional workflow is: clerk fills out a paper/digital form → submits to conference → conference compiles.

Theobase's value prop is to eliminate this burden.

## Decision

There is **no "Statistical Report" entity** in the system. Clerks and officers enter discrete events (a baptism, a transfer vote, an attendance count, a tithe deposit) as part of their normal workflow. Quarterly/annual reports are **generated queries** over accumulated data — materialized on demand. Conference/Union/Division users slice and export reports from live aggregated data at any time.

## Alternatives Considered

1. **Traditional form-based reporting** — Clerk fills out a QSR form quarterly, separate from data entry. Rejected because:
   - Duplicates work (data already in the system).
   - Increases burden on clerks (exactly what we're trying to eliminate).
   - Creates drift between day-to-day records and reported figures.
2. **Hybrid: auto-fill form, clerk confirms** — System pre-fills the QSR from data, clerk reviews and submits. Rejected as unnecessary ceremony; the data is already auditable.

## Consequences

- **No quarterly scramble**: reports are always up to date, available any time.
- **Upstream flexibility**: Conference/Union/Division officers can query custom date ranges, filter by org, export to any format — not limited to a fixed quarterly template.
- **Requires data discipline**: if clerks don't enter data promptly, reports are stale. Mitigation: the clerk dashboard highlights unreported weeks/months as a nudge, without blocking report generation.
- **Report accuracy is a query concern**: verifying report correctness requires verifying that the query matches the SDA QSR specification, rather than checking individual submitted forms.
