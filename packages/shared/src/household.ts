import type { Member } from './validators';

export interface HouseholdSuggestion {
  memberIds: string[];
  suggestedName: string;
  reason: 'shared-surname' | 'shared-address';
}

export function suggestHouseholds(members: Member[]): HouseholdSuggestion[] {
  const suggestions: HouseholdSuggestion[] = [];
  const ungrouped = members.filter(m => !m.householdId);

  const bySurname = new Map<string, typeof ungrouped>();
  for (const m of ungrouped) {
    const key = m.lastName.toLowerCase();
    const list = bySurname.get(key) ?? [];
    list.push(m);
    bySurname.set(key, list);
  }

  for (const [, group] of bySurname) {
    if (group.length >= 2) {
      suggestions.push({
        memberIds: group.map(m => m.id),
        suggestedName: `${group[0]!.lastName} Household`,
        reason: 'shared-surname',
      });
    }
  }

  const byAddress = new Map<string, typeof ungrouped>();
  for (const m of ungrouped) {
    if (!m.address) continue;
    const key = m.address.toLowerCase().trim();
    const list = byAddress.get(key) ?? [];
    list.push(m);
    byAddress.set(key, list);
  }

  for (const [, group] of byAddress) {
    if (group.length >= 2) {
      const names = group.map(m => `${m.firstName} ${m.lastName}`).join(', ');
      suggestions.push({
        memberIds: group.map(m => m.id),
        suggestedName: `${names}`,
        reason: 'shared-address',
      });
    }
  }

  return suggestions;
}
