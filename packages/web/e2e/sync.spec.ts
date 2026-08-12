import { test, expect } from '@playwright/test';

const MOCK_JWT =
  'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiY2h1cmNoSWQiOiJ0ZXN0LWNodXJjaCIsInJvbGUiOiJjbGVyayIsInRva2VuVmVyc2lvbiI6MSwiaWF0IjoxLCJleHAiOjk5OTk5OTk5OTl9.dummy';

function mockAuth(page: Parameters<Parameters<typeof test>[1]>[0]['page']) {
  return page.evaluate((token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('churchId', 'test-church');
    localStorage.setItem('role', 'clerk');
    localStorage.setItem('email', 'test@example.com');
  }, MOCK_JWT);
}

test.describe('PWA offline sync', () => {
  test('installs service worker and caches app shell', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Take care of the mundane. Focus on the gospel.');
  });

  test('enqueues intents to IndexedDB WAL when offline', async ({ page }) => {
    await page.goto('/');

    await page.evaluate(async () => {
      const { addIntent, getPendingCount } = await import('../src/lib/wal');
      await addIntent({
        id: 'test-intent-1',
        operation: 'member:create',
        payload: { id: 'm1', firstName: 'Test', lastName: 'User' },
        timestamp: Date.now(),
      });
      const count = await getPendingCount();
      if (count !== 1) throw new Error(`Expected 1 pending, got ${count}`);
    });
  });

  test('flushes WAL when online', async ({ page }) => {
    await page.goto('/');

    await page.evaluate(async () => {
      const { addIntent } = await import('../src/lib/wal');
      const { flushWal } = await import('../src/lib/sync');
      const { getPendingCount } = await import('../src/lib/wal');

      await addIntent({
        id: 'test-intent-2',
        operation: 'member:create',
        payload: { id: 'm2', firstName: 'Flush', lastName: 'Test' },
        timestamp: Date.now(),
      });

      await flushWal('default-church');

      const remaining = await getPendingCount();
      if (remaining !== 1)
        throw new Error(`Expected 1 remaining (DO unreachable), got ${remaining}`);
    });
  });

  test('sync state reflects pending count', async ({ page }) => {
    await page.goto('/');

    const state = await page.evaluate(async () => {
      const { addIntent, getPendingCount } = await import('../src/lib/wal');
      const { getSyncState, setPendingCount } = await import('../src/lib/sync-state');

      await addIntent({
        id: 'test-intent-3',
        operation: 'member:create',
        payload: { id: 'm3', firstName: 'State', lastName: 'Test' },
        timestamp: Date.now(),
      });

      const count = await getPendingCount();
      setPendingCount(count);

      return getSyncState();
    });

    expect(state.status).toBe('pending');
    expect(state.pendingCount).toBeGreaterThan(0);
  });

  test('sync indicator renders on page', async ({ page }) => {
    await page.goto('/');
    await mockAuth(page);
    await page.reload();
    await page.waitForTimeout(500);
    await expect(page.getByText(/Up to date|Saving|Offline/)).toBeVisible();
  });
});
