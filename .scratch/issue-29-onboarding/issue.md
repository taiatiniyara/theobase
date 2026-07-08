# Issue 29: Onboarding Flow

## What to build

Zero-config onboarding: guided first task in under 2 minutes, smart defaults, learn-as-you-go.

## Input/Output

**Input:** First-launch state (no data, no configuration), church setup data (name, location, denomination pre-fill), first member data (name, phone, baptism date)
**Output:** Configured church record, first member created, dashboard visible with contextual next-action guide, user productive in under 2 minutes

## Validation Requirements

- First launch must detect zero-data state and show onboarding, not empty dashboard
- Church setup pre-fills from denomination database when available
- Church name is required; location is optional
- First task is always "Add your first member" with exactly 3 fields (name, phone, baptism date)
- Name is required; phone and baptism date are optional
- Timer: from first launch to "dashboard with first member" must complete in under 2 minutes
- Success state must include confetti/animation and contextual next action ("Want to add their family?")
- No configuration screens before user is productive
- Features surface in context, not via settings or onboarding carousels
- Onboarding can be skipped (power users) with one tap

## Acceptance Criteria

- [ ] First launch: "Welcome! Let's set up your church" — pre-fill from denomination database
- [ ] Guided first task: "Add your first member" — form with 3 fields (name, phone, baptism date)
- [ ] Task completes in under 2 minutes
- [ ] Success state: "You're ready! Here's your dashboard" with confetti moment
- [ ] Success banner guides to next action: "Want to add their family?"
- [ ] No configuration screens before user is productive
- [ ] Learn as you go — features surface in context, not upfront
- [ ] Smart defaults everywhere (empty baptism date, current quarter for reports)

## Blocked by

- Issue 1: Add First Member

## Docs

- `CHANGELOG.md`
