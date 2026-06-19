<script lang="ts">
  import { api, getMe } from '$lib/api';
  import { onMount } from 'svelte';

  let stats = $state<any>(null);
  let loading = $state(true);
  let congId = $state('');
  let exportText = $state('');

  async function loadStats() {
    loading = true;
    try {
      // Aggregate stats from existing endpoints
      const [receipts, balance, transfers, meetings] = await Promise.all([
        api('/receipts').then(r => r.json()),
        api('/treasury/balance').then(r => r.json()),
        api('/transfers').then(r => r.json()),
        api('/board/meetings').then(r => r.json()),
      ]);

      const totalIncome = Object.values(balance || {}).reduce((sum: number, v: any) => sum + (typeof v === 'number' ? v : 0), 0);

      stats = {
        congregationId: congId,
        receipts: Array.isArray(receipts) ? receipts.length : 0,
        approvedReceipts: Array.isArray(receipts) ? receipts.filter((r: any) => r.status === 'approved').length : 0,
        totalIncome: totalIncome || 0,
        transfers: Array.isArray(transfers) ? transfers.length : 0,
        meetings: Array.isArray(meetings) ? meetings.length : 0,
        generatedAt: new Date().toISOString(),
      };
    } catch { stats = null; }
    loading = false;
  }

  function generateExport() {
    if (!stats) return;
    const csv = [
      'Metric,Value',
      `Receipts,${stats.receipts}`,
      `Approved Receipts,${stats.approvedReceipts}`,
      `Total Income (cents),${stats.totalIncome}`,
      `Transfers,${stats.transfers}`,
      `Board Meetings,${stats.meetings}`,
      `Generated,${stats.generatedAt}`,
    ].join('\n');
    exportText = csv;
  }

  onMount(async () => {
    try {
      const me = await getMe();
      if (me?.congregationId) {
        congId = me.congregationId;
        await loadStats();
      } else {
        loading = false;
      }
    } catch { loading = false; }
  });
</script>

<svelte:head><title>Conference Report — Theobase</title></svelte:head>

<h1>Conference Report</h1>

{#if loading}
  <p style="color: #718096;">Loading...</p>
{:else if !congId}
  <div class="card"><p style="color: #718096;">No congregation associated.</p></div>
{:else if stats}
  <div class="card">
    <h2>Quarterly Statistics — {congId}</h2>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
      <div>
        <div class="label">Total Receipts</div>
        <div class="value" style="font-size: 1.25rem; font-weight: 600;">{stats.receipts}</div>
      </div>
      <div>
        <div class="label">Approved</div>
        <div class="value" style="font-size: 1.25rem; font-weight: 600;">{stats.approvedReceipts}</div>
      </div>
      <div>
        <div class="label">Total Income</div>
        <div class="value" style="font-size: 1.25rem; font-weight: 600;">${(stats.totalIncome / 100).toFixed(2)}</div>
      </div>
      <div>
        <div class="label">Board Meetings</div>
        <div class="value" style="font-size: 1.25rem; font-weight: 600;">{stats.meetings}</div>
      </div>
    </div>
  </div>

  <button onclick={generateExport} style="margin-bottom: 16px;">Generate CSV Export</button>

  {#if exportText}
    <div class="card">
      <h2>CSV Export</h2>
      <textarea value={exportText} rows="10" readonly style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.8rem; font-family: monospace; box-sizing: border-box; background: #f7fafc;"></textarea>
      <div style="margin-top: 8px; color: #718096; font-size: 0.8rem;">Copy and send to your conference secretary.</div>
    </div>
  {/if}
{:else}
  <div class="card"><p class="error">Failed to load statistics.</p></div>
{/if}
