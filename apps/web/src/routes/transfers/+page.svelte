<script lang="ts">
  import { getTransfers, createTransfer } from '$lib/api';
  import { onMount } from 'svelte';

  let transfers = $state<any[]>([]);
  let loading = $state(true);

  let tfMemberId = $state('');
  let tfToCongregation = $state('');

  async function addTransfer() {
    if (!tfMemberId || !tfToCongregation) return;
    try {
      const result = await createTransfer({ memberId: tfMemberId, toCongregationId: tfToCongregation });
      transfers = [result, ...transfers];
      tfMemberId = ''; tfToCongregation = '';
    } catch {}
  }

  onMount(async () => {
    try { transfers = await getTransfers(); } catch {}
    loading = false;
  });
</script>

<svelte:head><title>Transfers — Theobase</title></svelte:head>

<h1>Membership Transfers</h1>

<div class="card">
  <h2>Request Transfer</h2>
  <div class="label">Member ID</div>
  <input type="text" bind:value={tfMemberId} placeholder="person-1" />
  <div class="label">To Congregation ID</div>
  <input type="text" bind:value={tfToCongregation} placeholder="church-2" />
  <button onclick={addTransfer} disabled={!tfMemberId || !tfToCongregation}>Request Transfer</button>
</div>

{#if loading}
  <p style="color: #718096;">Loading...</p>
{:else if transfers.length === 0}
  <div class="card"><p style="color: #718096;">No transfer requests.</p></div>
{:else}
  {#each transfers as t}
    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-weight: 600;">Transfer #{t.id?.slice(0, 8)}</div>
          <div style="color: #718096; font-size: 0.85rem;">
            Member: {t.memberId} → {t.toCongregationId}
          </div>
        </div>
        <span style="font-size: 0.8rem; padding: 2px 10px; border-radius: 12px;
          {t.status === 'received' ? 'background: #c6f6d5; color: #276749;' : 'background: #fefcbf; color: #975a16;'}">
          {t.status || 'requested'}
        </span>
      </div>
    </div>
  {/each}
{/if}
