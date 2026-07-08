# ADR 0010: Guest-to-Member Pipeline

## Status

Accepted

## Context

When visitors attend an SDA church, the church typically follows up to build relationships, offer Bible studies, and eventually guide them toward baptism or membership. This pipeline is a core evangelism function of the church.

## Decision

Implement a **GuestRecord** entity that tracks visitors through a conversion pipeline:

- Captures basic contact info and interests at first visit
- Automatically assigns to Personal Ministries leader for follow-up
- Tracks follow-up contacts (dates, notes, who followed up)
- Progressive status: new → contacted → attending-regularly → in-baptism-class → baptized → joined
- No automatic conversion — each status change requires explicit action
- GuestRecord converts to Person when they are baptized or join

## Alternatives Considered

### Track guests as regular Person records

- Pros: Single entity for all people, simpler schema
- Cons: Guests are not members, should not appear in membership counts, different data fields

### No guest tracking in core system

- Pros: Simpler, delegated to external evangelism tools
- Cons: Lost opportunity to track conversion pipeline, duplicate data entry

## Consequences

### Positive

- Full visibility of conversion pipeline (how many guests → members)
- Personal Ministries leader can prioritize follow-ups
- Automatic assignment reduces administrative burden
- Integration with BaptismClass when guest decides to join
- Reporting: conversion rate, follow-up effectiveness

### Negative

- Guest data privacy considerations
- Guests may need their own record even if they never join
- Status progression requires action (could be automated partially)

## Related Decisions

- ADR 0001: Hierarchical Organizational Model (guests tracked at church level)
