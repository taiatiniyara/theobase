export type MembershipState = 'baptised' | 'profession' | 'transfer-in' | 'transfer-out' | 'deceased' | 'removed';

export const MEMBERSHIP_STATES: readonly MembershipState[] = [
  'baptised',
  'profession',
  'transfer-in',
  'transfer-out',
  'deceased',
  'removed',
] as const;

export const VALID_TRANSITIONS: Record<MembershipState, MembershipState[]> = {
  baptised: ['profession', 'deceased', 'removed'],
  profession: ['baptised', 'transfer-out', 'deceased', 'removed'],
  'transfer-out': ['transfer-in', 'deceased'],
  'transfer-in': ['baptised', 'profession', 'transfer-out', 'deceased', 'removed'],
  deceased: [],
  removed: ['baptised'],
};

export function isValidTransition(from: MembershipState, to: MembershipState): boolean {
  const allowed = VALID_TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(to);
}
