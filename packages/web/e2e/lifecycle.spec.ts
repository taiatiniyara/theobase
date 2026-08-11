import { test, expect } from '@playwright/test';

const MOCK_JWT =
  'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiY2h1cmNoSWQiOiJ0ZXN0LWNodXJjaCIsInJvbGUiOiJjbGVyayIsInRva2VuVmVyc2lvbiI6MSwiaWF0IjoxLCJleHAiOjk5OTk5OTk5OTl9.dummy';

const CHURCH_ID = 'test-church';
const STATE_URL = `**/church/${CHURCH_ID}/state`;
const MUTATE_URL = `**/church/${CHURCH_ID}/mutate`;

function mockAuth(page: Parameters<Parameters<typeof test>[1]>[0]['page']) {
  return page.evaluate((token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('churchId', 'test-church');
    localStorage.setItem('role', 'clerk');
    localStorage.setItem('email', 'test@example.com');
  }, MOCK_JWT);
}

async function setupAuthAndNavigate(
  page: Parameters<Parameters<typeof test>[1]>[0]['page'],
  path: string,
) {
  await page.goto('/');
  await mockAuth(page);
  await page.goto(path);
}

function makeMember(overrides: Record<string, unknown> = {}) {
  return {
    id: 'some-member-id',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: null,
    address: null,
    dateOfBirth: null,
    baptismDate: null,
    gender: null,
    membershipStatus: 'baptised',
    householdId: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

function makeAuditEntry(
  memberId: string,
  prevState: string,
  newState: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    memberId,
    prevState,
    newState,
    actor: 'test@example.com',
    timestamp: Date.now(),
    ...overrides,
  };
}

function mockStateRoute(page: Parameters<Parameters<typeof test>[1]>[0]['page'], members: Record<string, unknown>, auditLog: Array<Record<string, unknown>> = []) {
  return page.route(STATE_URL, (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ json: { members, auditLog } });
    }
    return route.continue();
  });
}

function mockMutateRoute(
  page: Parameters<Parameters<typeof test>[1]>[0]['page'],
  status: number,
  body: Record<string, unknown>,
) {
  return page.route(MUTATE_URL, (route) => {
    return route.fulfill({ status, json: body });
  });
}

test.describe('Member lifecycle', () => {
  test('full lifecycle: view member, see audit log, then verify state change', async ({ page }) => {
    const member = makeMember();
    const auditLog = [makeAuditEntry('some-member-id', 'baptised', 'baptised', { reason: 'Initial registration' })];

    await mockStateRoute(page, { 'some-member-id': member }, auditLog);
    await mockMutateRoute(page, 200, { success: true });

    await setupAuthAndNavigate(page, '/members/some-member-id');

    await expect(page.getByRole('heading', { name: 'John Doe' })).toBeVisible();
    await expect(page.getByText('baptised', { exact: true })).toBeVisible();
    await expect(page.getByText('baptised → baptised')).toBeVisible();
    await expect(page.getByText('Initial registration')).toBeVisible();

    const changedMember = makeMember({ membershipStatus: 'profession' });
    const updatedAuditLog = [
      ...auditLog,
      makeAuditEntry('some-member-id', 'baptised', 'profession', { reason: 'Transferred to profession' }),
    ];

    await page.unroute(STATE_URL);
    await mockStateRoute(page, { 'some-member-id': changedMember }, updatedAuditLog);
    await page.reload();

    await expect(page.getByText('profession', { exact: true })).toBeVisible();
    await expect(page.getByText('baptised → profession')).toBeVisible();
    await expect(page.getByText('Transferred to profession')).toBeVisible();
  });

  test('invalid transition: mutate returns 400, UI survives error gracefully', async ({ page }) => {
    const member = makeMember();

    await mockStateRoute(page, { 'some-member-id': member }, []);
    await mockMutateRoute(page, 400, { error: 'Invalid transition from baptised to transfer-out' });

    await setupAuthAndNavigate(page, '/members/some-member-id/edit');

    await expect(page.getByText('Membership Status')).toBeVisible();
    await page.getByText('Select new status').click();

    const professionOption = page.getByRole('option', { name: 'profession' });
    await expect(professionOption).toBeVisible();
    await professionOption.click();

    await expect(page.getByText(/Change to profession/)).toBeVisible();
    await page.getByRole('button', { name: /Change to profession/ }).click();

    await expect(page.getByText(/Change to profession/)).toBeVisible();
  });
});
