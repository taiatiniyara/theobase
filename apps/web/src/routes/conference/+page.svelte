<script lang="ts">
  import { api, getMe } from '$lib/api';
  import { onMount } from 'svelte';

  let stats = $state<any>(null);
  let loading = $state(true);
  let congId = $state('');
  let exportText = $state('');
  let quarterStart = $state('');
  let quarterEnd = $state('');

  function setCurrentQuarter() {
    const now = new Date();
    const q = Math.floor(now.getMonth() / 3);
    quarterStart = `${now.getFullYear()}-${String(q * 3 + 1).padStart(2, '0')}-01`;
    const endMonth = q * 3 + 3;
    quarterEnd = `${now.getFullYear()}-${String(endMonth).padStart(2, '0')}-${new Date(now.getFullYear(), endMonth, 0).getDate()}`;
  }

  function inRange(date: string) {
    if (!quarterStart || !quarterEnd) return true;
    return date >= quarterStart && date <= quarterEnd;
  }

  async function loadStats() {
    loading = true;
    try {
      const [receipts, expenses, transfers, meetings] = await Promise.all([
        api('/receipts').then(r => r.json()),
        api('/treasury/expenses').then(r => r.json()),
        api('/transfers').then(r => r.json()),
        api('/board/meetings').then(r => r.json()),
      ]);

      const receiptsArr: any[] = Array.isArray(receipts) ? receipts : [];
      const expensesArr: any[] = Array.isArray(expenses) ? expenses : [];
      const transfersArr: any[] = Array.isArray(transfers) ? transfers : [];
      const meetingsArr: any[] = Array.isArray(meetings) ? meetings : [];

      const filteredReceipts = receiptsArr.filter((r: any) => inRange(r.createdAt));
      const filteredExpenses = expensesArr.filter((e: any) => inRange(e.createdAt));
      const filteredTransfers = transfersArr.filter((t: any) => inRange(t.createdAt));
      const filteredMeetings = meetingsArr.filter((m: any) => inRange(m.date || m.createdAt));

      const totalIncome = filteredReceipts.reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
      const totalExpenses = filteredExpenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

      stats = {
        congregationId: congId,
        receipts: filteredReceipts.length,
        approvedReceipts: filteredReceipts.filter((r: any) => r.status === 'approved').length,
        totalIncome,
        totalExpenses,
        transfers: filteredTransfers.length,
        meetings: filteredMeetings.length,
        quarterStart,
        quarterEnd,
        generatedAt: new Date().toISOString(),
      };
    } catch { stats = null; }
    loading = false;
  }

  function generateExport() {
    if (!stats) return;
    const header = quarterStart ? `Q${Math.floor((parseInt(quarterStart.slice(5,7)) - 1) / 3) + 1} ${quarterStart.slice(0,4)}` : 'All Time';
    const csv = [
      `Theobase Quarterly Report — ${header}`,
      `Congregation: ${stats.congregationId}`,
      `Period: ${quarterStart || 'All'} to ${quarterEnd || 'All'}`,
      '',
      'Metric,Value',
      `Total Receipts,${stats.receipts}`,
      `Approved Receipts,${stats.approvedReceipts}`,
      `Total Income (cents),${stats.totalIncome}`,
      `Total Expenses (cents),${stats.totalExpenses}`,
      `Net Balance (cents),${stats.totalIncome - stats.totalExpenses}`,
      `Transfers,${stats.transfers}`,
      `Board Meetings,${stats.meetings}`,
      `Generated,${stats.generatedAt}`,
    ].join('\n');
    exportText = csv;
  }

  onMount(async () => {
    setCurrentQuarter();
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

<div class="card">
  <h2>Date Range</h2>
  <div style="display: flex; gap: 8px;">
    <div style="flex: 1;">
      <label class="field-label">From</label>
      <input type="date" bind:value={quarterStart} onchange={() => loadStats()} class="input-date" />
    </div>
    <div style="flex: 1;">
      <label class="field-label">To</label>
      <input type="date" bind:value={quarterEnd} onchange={() => loadStats()} class="input-date" />
    </div>
  </div>
</div>

{#if loading}
  <p style="color: #718096;">Loading...</p>
{:else if !congId}
  <div class="card"><p style="color: #718096;">No congregation associated.</p></div>
{:else if stats}
  <div class="card">
    <h2>Statistics</h2>
    <div class="stat-grid">
      <div>
        <div class="stat-label">Total Receipts</div>
        <div class="stat-value">{stats.receipts}</div>
      </div>
      <div>
        <div class="stat-label">Approved</div>
        <div class="stat-value">{stats.approvedReceipts}</div>
      </div>
      <div>
        <div class="stat-label">Income</div>
        <div class="stat-value">${(stats.totalIncome / 100).toFixed(2)}</div>
      </div>
      <div>
        <div class="stat-label">Expenses</div>
        <div class="stat-value">${(stats.totalExpenses / 100).toFixed(2)}</div>
      </div>
      <div>
        <div class="stat-label">Board Meetings</div>
        <div class="stat-value">{stats.meetings}</div>
      </div>
      <div>
        <div class="stat-label">Transfers</div>
        <div class="stat-value">{stats.transfers}</div>
      </div>
    </div>
  </div>

  <button onclick={generateExport} style="margin-bottom: 16px;">Generate CSV Export</button>

  {#if exportText}
    <div class="card">
      <h2>CSV Export</h2>
      <textarea value={exportText} rows="14" readonly class="csv-output"></textarea>
      <div style="margin-top: 8px; color: #718096; font-size: 0.8rem;">Copy and send to your conference secretary.</div>
    </div>
  {/if}
{:else}
  <div class="card"><p class="error">Failed to load statistics.</p></div>
{/if}

<style>
  .field-label { display: block; font-size: 0.75rem; color: #4a5568; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; font-weight: 600; }
  .input-date { width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.9rem; box-sizing: border-box; }
  .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .stat-label { font-size: 0.75rem; color: #718096; text-transform: uppercase; }
  .stat-value { font-size: 1.25rem; font-weight: 600; }
  .csv-output { width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.8rem; font-family: monospace; box-sizing: border-box; background: #f7fafc; }
</style>
