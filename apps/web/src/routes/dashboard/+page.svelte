<script lang="ts">
  import { getMe, getTreasuryBalance, getReceipts } from '$lib/api';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let profile = $state<any>(null);
  let balance = $state<any>(null);
  let loading = $state(true);

  onMount(async () => {
    try {
      profile = await getMe();
      if (!profile || profile.error) { goto('/'); return; }

      const results = await Promise.allSettled([
        getTreasuryBalance(),
        getReceipts(),
      ]);
      if (results[0].status === 'fulfilled') balance = results[0].value;
    } catch { goto('/'); }
    loading = false;
  });

  function isClerk() { return profile?.roles?.includes('clerk'); }
  function isTreasurer() { return profile?.roles?.includes('treasurer'); }
</script>

<svelte:head>
  <title>Dashboard — Theobase</title>
</svelte:head>

{#if loading}
  <p style="color: #718096; padding-top: 32px;">Loading...</p>
{:else}
  <h1>Welcome, {profile?.firstName || profile?.email}</h1>

  <div class="card">
    <h2>Your Giving</h2>
    {#if profile?.giving}
      <div style="display: flex; gap: 16px; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 100px;">
          <div class="label">Total</div>
          <div class="value" style="font-size: 1.25rem; font-weight: 600;">
            ${(profile.giving.totalAmount / 100).toFixed(2)}
          </div>
        </div>
        <div style="flex: 1; min-width: 100px;">
          <div class="label">Receipts</div>
          <div class="value">{profile.giving.totalReceipts}</div>
        </div>
        <div style="flex: 1; min-width: 100px;">
          <div class="label">Pending</div>
          <div class="value">{profile.giving.pendingCount}</div>
        </div>
      </div>
    {/if}
    <a href="/receipts" class="btn" style="margin-top: 12px; display: inline-block;">Submit receipt</a>
  </div>

  {#if isTreasurer() && balance}
    <div class="card">
      <h2>Treasury</h2>
      {#each Object.entries(balance) as [fund, amount]}
        {#if fund !== 'error' && typeof amount === 'number'}
          <div style="display: flex; justify-content: space-between; padding: 4px 0;">
            <span style="text-transform: capitalize;">{fund.replace(/_/g, ' ')}</span>
            <span style="font-weight: 600;">${(amount / 100).toFixed(2)}</span>
          </div>
        {/if}
      {/each}
    </div>
  {/if}

  {#if isClerk() || isTreasurer()}
    <div class="card">
      <h2>Quick Actions</h2>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <a href="/boardroom" class="btn">Boardroom</a>
        {#if isClerk()}
          <a href="/rota" class="btn" style="background: #2b6cb0;">Duty Rota</a>
        {/if}
      </div>
    </div>
  {/if}

  {#if profile?.roles?.length}
    <div class="card">
      <h2>Your Roles</h2>
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        {#each profile.roles as role}
          <span style="background: #ebf4ff; color: #1a365d; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; text-transform: capitalize;">{role}</span>
        {/each}
      </div>
    </div>
  {/if}
{/if}
