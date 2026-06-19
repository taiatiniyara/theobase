<script lang="ts">
  import { getTreasuryBalance, getExpenses, createExpense, getReceipts, getBoardMeetings } from '$lib/api';
  import { onMount } from 'svelte';

  let balance = $state<Record<string, number>>({});
  let expenses = $state<any[]>([]);
  let receipts = $state<any[]>([]);
  let meetings = $state<any[]>([]);
  let loading = $state(true);
  let showForm = $state(false);
  let formError = $state('');

  let expAmount = $state(0);
  let expDesc = $state('');
  let expCategory = $state('church_budget');
  let expReceiptId = $state('');
  let expDecisionId = $state('');

  const categories = ['church_budget', 'pathfinders', 'sabbath_school', 'adra', 'local_church', 'dorcas', 'health'];

  async function submitExpense() {
    formError = '';
    if (!expAmount || !expDesc) { formError = 'Amount and description required.'; return; }
    try {
      const result = await createExpense({
        amount: expAmount,
        description: expDesc,
        category: expCategory,
        receiptId: expReceiptId || undefined,
        boardDecisionId: expDecisionId || undefined,
      });
      if (result.error) { formError = result.error; return; }
      expenses = [...expenses, result];
      showForm = false;
      expAmount = 0; expDesc = ''; expReceiptId = ''; expDecisionId = '';
      // Refresh balance
      balance = await getTreasuryBalance();
    } catch { formError = 'Failed to create expense.'; }
  }

  onMount(async () => {
    try {
      const [b, e, r, m] = await Promise.all([
        getTreasuryBalance(), getExpenses(), getReceipts(), getBoardMeetings(),
      ]);
      balance = b;
      expenses = e;
      receipts = r.filter((rec: any) => rec.status === 'approved');
      meetings = m;
    } catch {}
    loading = false;
  });

  function formatFund(fund: string) { return fund.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }
</script>

<svelte:head>
  <title>Treasury — Theobase</title>
</svelte:head>

<h1>Treasury</h1>

{#if loading}
  <p style="color: #718096;">Loading...</p>
{:else}
  <div class="card">
    <h2>Fund Balances</h2>
    {#if Object.keys(balance).length === 0}
      <p style="color: #718096;">No fund activity yet.</p>
    {:else}
      {#each Object.entries(balance) as [fund, amount]}
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
          <span style="text-transform: capitalize;">{formatFund(fund)}</span>
          <span style="font-weight: 600; color: {amount >= 0 ? '#38a169' : '#e53e3e'};">
            ${(amount / 100).toFixed(2)}
          </span>
        </div>
      {/each}
    {/if}
  </div>

  {#if !showForm}
    <button onclick={() => showForm = true} style="margin-bottom: 16px;">+ New Expense</button>
  {:else}
    <div class="card">
      <h2>Record Expense</h2>
      <div class="label">Amount (cents)</div>
      <input type="number" bind:value={expAmount} placeholder="3000" />

      <div class="label">Description</div>
      <input type="text" bind:value={expDesc} placeholder="Electricity bill" />

      <div class="label">Category</div>
      <select bind:value={expCategory} style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 12px; font-size: 0.9rem;">
        {#each categories as cat}
          <option value={cat}>{formatFund(cat)}</option>
        {/each}
      </select>

      <div class="label">Linked Receipt (optional)</div>
      <select bind:value={expReceiptId} style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 12px; font-size: 0.9rem;">
        <option value="">None</option>
        {#each receipts as r}
          <option value={r.id}>#{r.id?.slice(0, 8)} — ${(r.amount / 100).toFixed(2)}</option>
        {/each}
      </select>

      <div class="label">Board Decision (optional)</div>
      <select bind:value={expDecisionId} style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 12px; font-size: 0.9rem;">
        <option value="">None</option>
        {#each meetings as m}
          <option value={m.id}>{m.date}</option>
        {/each}
      </select>

      {#if formError}
        <p class="error">{formError}</p>
      {/if}

      <div style="display: flex; gap: 8px;">
        <button onclick={submitExpense}>Record</button>
        <button style="background: #718096;" onclick={() => showForm = false}>Cancel</button>
      </div>
    </div>
  {/if}

  <div class="card">
    <h2>Expenses ({expenses.length})</h2>
    {#if expenses.length === 0}
      <p style="color: #718096;">No expenses recorded yet.</p>
    {:else}
      {#each expenses as exp}
        <div style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
          <div style="display: flex; justify-content: space-between;">
            <span style="font-weight: 600;">{exp.description}</span>
            <span style="font-weight: 600; color: #e53e3e;">-${(exp.amount / 100).toFixed(2)}</span>
          </div>
          <div style="font-size: 0.8rem; color: #718096; display: flex; gap: 12px;">
            <span style="text-transform: capitalize;">{formatFund(exp.category)}</span>
            {#if exp.receiptId}
              <span>Receipt #{exp.receiptId?.slice(0, 8)}</span>
            {/if}
          </div>
        </div>
      {/each}
    {/if}
  </div>
{/if}
