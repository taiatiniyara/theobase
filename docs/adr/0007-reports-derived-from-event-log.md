# Reports are derived from an append-only event log

The core stores append-only events — membership events and finance events — each with a date and its authorizing act. Rolls, balances, and reports (the statistical report, the Tithe & Offerings report) are derived projections over that event log, never manually entered or edited. We chose this so that reports are always current and every number is reconstructable for an audit, eliminating late or fabricated reports.

Consequence: the event log is immutable; corrections are made by recording a correcting event, not by editing history. The system needs projection machinery to derive current rolls and balances, and must be able to rebuild them from the log.
