<script lang="ts">
  import { getTreasuryBalance, getExpenses, createExpense, getReceipts, getBoardMeetings } from '$lib/api';
  import { onMount } from 'svelte';
  import FormField from '$lib/components/FormField.svelte';
  import AmountField from '$lib/components/AmountField.svelte';

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
        <div class="balance-row">
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

      <AmountField
        cents={expAmount}
        onchange={(c) => expAmount = c}
        error={formError && !expDesc ? formError : ''}
      />

      <FormField
        label="Description"
        value={expDesc}
        placeholder="Electricity bill"
        oninput={(e) => expDesc = (e.target as HTMLInputElement).value}
        error={formError && !expAmount ? formError : ''}
      />

      <div class="field">
        <label class="field-label">Category</label>
        <select bind:value={expCategory} class="select">
          {#each categories as cat}
            <option value={cat}>{formatFund(cat)}</option>
          {/each}
        </select>
      </div>

      <div class="field">
        <label class="field-label">Linked Receipt (optional)</label>
        <select bind:value={expReceiptId} class="select">
          <option value="">None</option>
          {#each receipts as r}
            <option value={r.id}>#{r.id?.slice(0, 8)} — ${(r.amount / 100).toFixed(2)}</option>
          {/each}
        </select>
      </div>

      <div class="field">
        <label class="field-label">Board Decision (optional)</label>
        <select bind:value={expDecisionId} class="select">
          <option value="">None</option>
          {#each meetings as m}
            <option value={m.id}>{m.date}</option>
          {/each}
        </select>
      </div>

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
        <div class="expense-row">
          <div style="display: flex; justify-content: space-between;">
            <span style="font-weight: 600;">{exp.description}</span>
            <span style="font-weight: 600; color: #e53e3e;">-${(exp.amount / 100).toFixed(2)}</span>
          </div>
          <div class="expense-meta">
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

<style>
  .balance-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
  .expense-row { padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
  .expense-meta { font-size: 0.8rem; color: #718096; display: flex; gap: 12px; }
  .field { margin-bottom: 12px; }
  .field-label {
    display: block;
    font-size: 0.75rem;
    color: #4a5568;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
    font-weight: 600;
  }
  .select { width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.9rem; box-sizing: border-box; }
</style>
