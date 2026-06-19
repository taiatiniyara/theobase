<script lang="ts">
  import { getTransfers, createTransfer, updateTransferStatus } from '$lib/api';
  import { onMount } from 'svelte';
  import FormField from '$lib/components/FormField.svelte';

  let transfers = $state<any[]>([]);
  let loading = $state(true);

  let tfMemberId = $state('');
  let tfToCongregation = $state('');

  const statusLabels: Record<string, string> = {
    requested: 'Requested',
    approved_by_sending: 'Approved (Sending)',
    received_by_destination: 'Received',
    completed: 'Completed',
    rejected: 'Rejected',
  };

  const nextActions: Record<string, { label: string; status: string }[]> = {
    requested: [
      { label: 'Approve', status: 'approved_by_sending' },
      { label: 'Reject', status: 'rejected' },
    ],
    approved_by_sending: [
      { label: 'Receive', status: 'received_by_destination' },
      { label: 'Reject', status: 'rejected' },
    ],
    received_by_destination: [
      { label: 'Complete', status: 'completed' },
    ],
  };

  async function loadTransfers() {
    try { transfers = await getTransfers(); } catch {}
    loading = false;
  }

  async function addTransfer() {
    if (!tfMemberId || !tfToCongregation) return;
    try {
      const result = await createTransfer({ memberId: tfMemberId, toCongregationId: tfToCongregation });
      transfers = [result, ...transfers];
      tfMemberId = ''; tfToCongregation = '';
    } catch {}
  }

  async function transition(id: string, status: string) {
    try {
      const updated = await updateTransferStatus(id, status);
      transfers = transfers.map(t => t.id === id ? updated : t);
    } catch {}
  }

  onMount(loadTransfers);
</script>

<svelte:head><title>Transfers — Theobase</title></svelte:head>

<h1>Membership Transfers</h1>

<div class="card">
  <h2>Request Transfer</h2>
  <FormField label="Member ID" value={tfMemberId} placeholder="person-1" oninput={(e) => tfMemberId = (e.target as HTMLInputElement).value} />
  <FormField label="To Congregation ID" value={tfToCongregation} placeholder="church-2" oninput={(e) => tfToCongregation = (e.target as HTMLInputElement).value} />
  <button onclick={addTransfer} disabled={!tfMemberId || !tfToCongregation}>Request Transfer</button>
</div>

{#if loading}
  <p style="color: #718096;">Loading...</p>
{:else if transfers.length === 0}
  <div class="card"><p style="color: #718096;">No transfer requests.</p></div>
{:else}
  {#each transfers as t}
    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <div style="font-weight: 600;">Transfer #{t.id?.slice(0, 8)}</div>
          <div style="color: #718096; font-size: 0.85rem;">
            Member: {t.memberId} → {t.toCongregationId}
          </div>
        </div>
        <span class="badge" class:completed={t.status === 'completed'} class:rejected={t.status === 'rejected'}>
          {statusLabels[t.status] || t.status}
        </span>
      </div>
      {#if nextActions[t.status]}
        <div style="margin-top: 12px; display: flex; gap: 8px;">
          {#each nextActions[t.status] as action}
            <button
              class="action-btn"
              class:reject={action.status === 'rejected'}
              onclick={() => transition(t.id, action.status)}
            >
              {action.label}
            </button>
          {/each}
        </div>
      {/if}
    </div>
  {/each}
{/if}

<style>
  .badge { font-size: 0.8rem; padding: 2px 10px; border-radius: 12px; background: #fefcbf; color: #975a16; }
  .badge.completed { background: #c6f6d5; color: #276749; }
  .badge.rejected { background: #fed7d7; color: #9b2c2c; }
  .action-btn {
    font-size: 0.8rem; padding: 4px 12px; border-radius: 6px;
    border: 1px solid #1a365d; background: #ebf4ff; color: #1a365d; cursor: pointer;
  }
  .action-btn.reject { border-color: #e53e3e; background: #fed7d7; color: #9b2c2c; }
</style>
