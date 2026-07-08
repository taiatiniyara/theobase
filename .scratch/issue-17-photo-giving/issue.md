# Issue 17: Photo-Based Giving

## What to build

Members self-report tithes and offerings by photographing their envelope. Photo stored in R2, matched to treasurer's physical count for verification.

## Input/Output

**Input:** Envelope photo (camera capture or gallery upload), amount breakdown JSON (tithe, offering categories by name and amount), church ID
**Output:** MemberGiving record with status "submitted", photo stored in R2 with URL, giving history viewable by member

## Validation Requirements

- Photo must be a valid image (JPG, PNG) under 10MB
- At least one amount field must be non-zero
- Total must be calculated from amount breakdown
- Amounts must be positive numbers
- Member can only record giving for themselves
- Photo is compressed client-side before upload
- Data filtered by member's own record (cannot view other members' giving)

## Acceptance Criteria

- [ ] Member can photograph envelope using PWA camera or upload from gallery
- [ ] Photo stored in R2 with link in MemberGiving record
- [ ] Member enters amount breakdown (tithe, offering categories)
- [ ] Giving record created with status "submitted"
- [ ] Member can view their giving history
- [ ] Data filtered by user's own record (member sees only their own giving)

## Blocked by

- Issue 1: Add First Member

## Docs: `docs/agents/contracts/giving-api.md`, `docs/agents/schemas/giving.json`
