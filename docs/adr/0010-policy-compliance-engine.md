# Policy-compliance engine as configurable rules

The policy-compliance engine is a configurable rule set, not hardcoded checks. Each rule maps a policy requirement (e.g., "quorum before voting") to a system behavior (e.g., "block motion recording if attendee count < required quorum"). Rules are defined per union/conference and cascade down to churches. The engine evaluates rules at the API boundary before mutations are committed. This was chosen over embedding policy checks directly in feature code, which would require code changes for every union's policy variation.
