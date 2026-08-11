export type DataClassification = 'PII' | 'Financial' | 'Governance' | 'Public';

export const FIELD_CLASSIFICATIONS: Record<string, DataClassification> = {
  firstName: 'PII',
  lastName: 'PII',
  email: 'PII',
  phone: 'PII',
  address: 'PII',
  dateOfBirth: 'PII',
  photo: 'PII',
  amount: 'Financial',
  type: 'Financial',
  paymentMethod: 'Financial',
  batchId: 'Financial',
  membershipStatus: 'Governance',
  role: 'Governance',
  baptismDate: 'Governance',
  name: 'Public',
  churchName: 'Public',
  conferenceName: 'Public',
  status: 'Governance',
};

export const RETENTION_POLICIES: Record<string, number> = {
  givingRecords: 7 * 365 * 24 * 60 * 60 * 1000,
  memberRecords: 3 * 365 * 24 * 60 * 60 * 1000,
  accessLogs: 365 * 24 * 60 * 60 * 1000,
  loginLogs: 90 * 24 * 60 * 60 * 1000,
};

export function classifyField(fieldName: string): DataClassification {
  return FIELD_CLASSIFICATIONS[fieldName] ?? 'Public';
}

export function getRetentionMs(category: keyof typeof RETENTION_POLICIES): number {
  return RETENTION_POLICIES[category] ?? 0;
}
