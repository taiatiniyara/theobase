import { describe, it, expect } from 'vitest';
import { parseCsv } from './csv';

describe('CSV parser', () => {
  it('parses valid CSV rows', () => {
    const csv = `firstName,lastName,email,gender\nJohn,Wesley,john@church.org,male\nSarah,Smith,sarah@church.org,female`;

    const result = parseCsv(csv);
    expect(result.resolved).toHaveLength(2);
    expect(result.flagged).toHaveLength(0);
    expect(result.resolved[0]!.data.firstname).toBe('John');
    expect(result.resolved[0]!.data.lastname).toBe('Wesley');
    expect(result.resolved[1]!.data.gender).toBe('female');
  });

  it('flags rows with missing names', () => {
    const csv = `firstName,lastName,email\n,Wesley,wrong@email.org\nSarah,,sarah@church.org`;

    const result = parseCsv(csv);
    expect(result.resolved).toHaveLength(0);
    expect(result.flagged).toHaveLength(2);
    expect(result.flagged[0]!.errors).toContain('Missing first name');
    expect(result.flagged[1]!.errors).toContain('Missing last name');
  });

  it('flags invalid dates', () => {
    const csv = `firstName,lastName,dateOfBirth\nJohn,Smith,not-a-date\nJane,Doe,2020-01-01`;

    const result = parseCsv(csv);
    expect(result.flagged).toHaveLength(1);
    expect(result.flagged[0]!.errors[0]).toContain('Invalid date of birth');
    expect(result.resolved).toHaveLength(1);
  });

  it('flags invalid gender', () => {
    const csv = `firstName,lastName,gender\nJohn,Smith,unknown`;

    const result = parseCsv(csv);
    expect(result.flagged).toHaveLength(1);
    expect(result.flagged[0]!.errors[0]).toContain('Invalid gender');
  });

  it('handles empty input', () => {
    const result = parseCsv('');
    expect(result.resolved).toHaveLength(0);
    expect(result.flagged).toHaveLength(0);

    const result2 = parseCsv('header\n');
    expect(result2.resolved).toHaveLength(0);
    expect(result2.flagged).toHaveLength(0);
  });

  it('ignores unknown columns', () => {
    const csv = `firstName,lastName,extra_field,unknown\nJohn,Smith,ignored,also_ignored`;

    const result = parseCsv(csv);
    expect(result.resolved).toHaveLength(1);
    expect(result.resolved[0]!.data.firstname).toBe('John');
    expect(result.resolved[0]!.data.lastname).toBe('Smith');
  });
});
