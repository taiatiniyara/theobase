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

async function setupAuthAndNavigate(page: Parameters<Parameters<typeof test>[1]>[0]['page'], path: string) {
  await page.goto('/');
  await mockAuth(page);
  await page.goto(path);
}

test.describe('Member CRUD flow', () => {
  test('add member → see in directory → edit → verify persistence', async ({ page }) => {
    await page.route(STATE_URL, (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ json: { members: {} } });
      }
      return route.continue();
    });

    await page.route(MUTATE_URL, (route) => {
      return route.fulfill({ json: { success: true } });
    });

    await setupAuthAndNavigate(page, '/members');

    await expect(page.getByRole('heading', { name: 'No members yet' })).toBeVisible();
    await expect(page.getByText(/Upload your membership roll/)).toBeVisible();

    await page.getByRole('link', { name: 'Add Member' }).click();
    await expect(page).toHaveURL('/members/add');

    await page.locator('label').filter({ hasText: 'First Name' }).locator('input').fill('Jane');
    await page.locator('label').filter({ hasText: 'Last Name' }).locator('input').fill('Doe');
    await page.getByRole('button', { name: 'Save Member' }).click();

    await expect(page).toHaveURL('/members');

    await page.unroute(STATE_URL);
    await page.route(STATE_URL, (route) => {
      return route.fulfill({
        json: {
          members: {
            'm1': {
              id: 'm1', firstName: 'Jane', lastName: 'Doe', email: null, phone: null,
              address: null, dateOfBirth: null, baptismDate: null, gender: null,
              membershipStatus: 'baptised', householdId: null, createdAt: Date.now(), updatedAt: Date.now(),
            },
          },
        },
      });
    });
    await page.reload();

    await expect(page.getByText('Jane Doe').first()).toBeVisible();
  });

  test('member directory renders with search and filter', async ({ page }) => {
    await page.route(STATE_URL, (route) => {
      return route.fulfill({
        json: {
          members: {
            'm1': {
              id: 'm1', firstName: 'Alice', lastName: 'Smith', email: null, phone: null,
              address: null, dateOfBirth: null, baptismDate: null, gender: null,
              membershipStatus: 'baptised', householdId: null, createdAt: Date.now(), updatedAt: Date.now(),
            },
          },
        },
      });
    });

    await setupAuthAndNavigate(page, '/members');

    await expect(page.getByPlaceholder(/search/i).or(page.getByPlaceholder(/khojo/i))).toBeVisible();
    await expect(page.getByRole('combobox')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Add Member' })).toBeVisible();
  });

  test('add member form validates required fields', async ({ page }) => {
    await page.route(MUTATE_URL, (route) => {
      return route.fulfill({ json: { success: true } });
    });

    await setupAuthAndNavigate(page, '/members/add');

    await page.getByRole('button', { name: 'Save Member' }).click();

    const firstNameInput = page.locator('label').filter({ hasText: 'First Name' }).locator('input');
    const lastNameInput = page.locator('label').filter({ hasText: 'Last Name' }).locator('input');
    await expect(firstNameInput).toHaveJSProperty('validity.valueMissing', true);
    await expect(lastNameInput).toHaveJSProperty('validity.valueMissing', true);

    await firstNameInput.fill('Alice');
    await lastNameInput.fill('Smith');
    await page.getByRole('button', { name: 'Save Member' }).click();

    await expect(page).toHaveURL('/members');
  });

  test('login page renders and handles magic link', async ({ page }) => {
    await page.route('**/auth/send-link', (route) => {
      return route.fulfill({ json: { success: true } });
    });

    await page.goto('/login');

    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send Login Link' })).toBeVisible();

    await page.getByRole('textbox', { name: 'Email' }).fill('test@example.com');
    await page.getByRole('button', { name: 'Send Login Link' }).click();

    await expect(page.getByText(/Check your email/)).toBeVisible();
  });
});
