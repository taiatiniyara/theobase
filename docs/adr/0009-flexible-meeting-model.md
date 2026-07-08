# ADR 0009: Flexible Meeting Model

## Status

Accepted

## Context

SDA churches hold multiple types of meetings: quarterly business meetings, monthly church board meetings, ministry department meetings (Sabbath School, Youth, etc.), and special committee meetings (nominating, building, finance). Each type has different attendees, decision scope, and frequency.

Rather than creating separate entities for each meeting type, we chose a flexible model.

## Decision

Implement a single **Meeting** entity that can represent any type of meeting:

- `MeetingType` lookup table defines the types (business, board, ministry, committee)
- Common fields: date, church, presiding officer, attendees, agenda, decisions, minutes
- Type-specific behavior handled at the application layer (e.g., business meetings have voting records, board meetings focus on operational decisions)
- Minutes stored as file attachments in R2
- Recurring flag for regular meetings (board, ministry)
- Status: scheduled, held, minutes-approved

## Alternatives Considered

### Separate entities per meeting type

- Pros: Type-specific validation, clear schema per meeting type
- Cons: Schema explosion, harder to add new types, duplicate logic

### Unstructured meeting notes

- Pros: Simple, flexible
- Cons: No query capability, no automated reporting

## Consequences

### Positive

- Single model for all meeting types reduces schema complexity
- New meeting types can be added without schema changes (just add to lookup)
- Unified query interface for all meetings
- Minutes stored with consistent access pattern

### Negative

- Less type-specific validation at database level
- Some meeting types may need fields that others don't (sparse schema)
- Application logic needs to handle type-specific behavior

## Related Decisions

- ADR 0001: Hierarchical Organizational Model (meetings belong to churches)
