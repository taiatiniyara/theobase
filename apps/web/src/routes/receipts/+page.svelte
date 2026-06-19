<script lang="ts">
  import { getReceipts, createReceipt } from '$lib/api';
  import { onMount } from 'svelte';
  import FormField from '$lib/components/FormField.svelte';
  import AmountField from '$lib/components/AmountField.svelte';

  let receipts = $state<any[]>([]);
  let loading = $state(true);
  let showForm = $state(false);
  let formError = $state('');

  let amountCents = $state(0);
  let fundSplits = $state([{ name: 'tithe', value: 0 }, { name: 'church_budget', value: 0 }]);

  const fundOptions = ['tithe', 'church_budget', 'pathfinders', 'sabbath_school', 'adra', 'local_church'];

  function addFund() {
    fundSplits = [...fundSplits, { name: '', value: 0 }];
  }

  function removeFund(index: number) {
    fundSplits = fundSplits.filter((_, i) => i !== index);
  }

  function updateFundName(index: number, name: string) {
    fundSplits = fundSplits.map((f, i) => i === index ? { ...f, name } : f);
  }

  function updateFundValue(index: number, value: number) {
    fundSplits = fundSplits.map((f, i) => i === index ? { ...f, value } : f);
  }

  async function submit() {
    formError = '';
    const split: Record<string, number> = {};
    let total = 0;
    for (const f of fundSplits) {
      if (!f.name) { formError = 'All fund categories must be selected.'; return; }
      split[f.name] = f.value;
      total += f.value;
    }
    if (total !== amountCents) {
      formError = `Fund splits ($${(total / 100).toFixed(2)}) don't match total amount ($${(amountCents / 100).toFixed(2)}).`;
      return;
    }
    try {
      const result = await createReceipt({ amount: amountCents, fundSplit: split });
      if (result.error) { formError = result.error; return; }
      showForm = false;
      receipts = [result, ...receipts];
    } catch { formError = 'Failed to submit receipt.'; }
  }

  onMount(async () => {
    try { receipts = await getReceipts(); } catch {}
    loading = false;
  });
</script>

<svelte:head>
  <title>Giving — Theobase</title>
</svelte:head>

<h1>Giving</h1>

{#if !showForm}
  <button onclick={() => showForm = true} style="margin-bottom: 16px;">+ New Receipt</button>
{:else}
  <div class="card">
    <h2>Submit Receipt</h2>
    <AmountField
      cents={amountCents}
      onchange={(c) => amountCents = c}
      error={formError && !fundSplits.length ? formError : ''}
    />

    <div class="field-group">
      <label class="label">Fund Split</label>
      {#each fundSplits as fund, i}
        <div class="fund-row">
          <select
            value={fund.name}
            onchange={(e) => updateFundName(i, (e.target as HTMLSelectElement).value)}
            class="select"
          >
            <option value="">Select fund...</option>
            {#each fundOptions as opt}
              <option value={opt} disabled={fundSplits.some((f, j) => f.name === opt && j !== i)}>
                {opt.replace(/_/g, ' ')}
              </option>
            {/each}
          </select>
          <AmountField
            label=""
            cents={fund.value}
            onchange={(c) => updateFundValue(i, c)}
            placeholder="0.00"
          />
          {#if fundSplits.length > 1}
            <button class="remove-btn" onclick={() => removeFund(i)}>✕</button>
          {/if}
        </div>
      {/each}
      {#if fundSplits.length < fundOptions.length}
        <button class="add-btn" onclick={addFund}>+ Add fund</button>
      {/if}
    </div>

    {#if formError}
      <p class="error">{formError}</p>
    {/if}

    <div class="button-row">
      <button onclick={submit}>Submit</button>
      <button class="cancel-btn" onclick={() => showForm = false}>Cancel</button>
    </div>
  </div>
{/if}

{#if loading}
  <p style="color: #718096;">Loading...</p>
{:else if receipts.length === 0}
  <div class="card">
    <p style="color: #718096;">No receipts yet. Submit your first one above.</p>
  </div>
{:else}
  {#each receipts as receipt}
    <div class="card">
      <div class="receipt-header">
        <div>
          <div class="label">Receipt #{receipt.id?.slice(0, 8)}</div>
          <div style="font-weight: 600;">${(receipt.amount / 100).toFixed(2)}</div>
        </div>
        <span class="badge" class:approved={receipt.status === 'approved'} class:rejected={receipt.status === 'rejected'} class:pending={receipt.status !== 'approved' && receipt.status !== 'rejected'}>
          {receipt.status}
        </span>
      </div>
      {#if receipt.fundSplit}
        <div style="margin-top: 8px;">
          {#each Object.entries(receipt.fundSplit) as [fund, val]}
            <div class="fund-line">
              <span class="fund-name">{fund.replace(/_/g, ' ')}</span>
              <span>${((val as number) / 100).toFixed(2)}</span>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/each}
{/if}

<style>
  .field-group { margin-bottom: 16px; }
  .label {
    display: block;
    font-size: 0.75rem;
    color: #4a5568;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
    font-weight: 600;
  }
  .fund-row { display: flex; gap: 8px; margin-bottom: 8px; align-items: flex-start; }
  .select { flex: 1; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.9rem; }
  .remove-btn { background: #e53e3e; padding: 8px 12px; font-size: 0.85rem; border-radius: 8px; color: white; border: none; cursor: pointer; }
  .add-btn { background: #718096; padding: 8px 16px; font-size: 0.85rem; border-radius: 8px; color: white; border: none; cursor: pointer; }
  .button-row { display: flex; gap: 8px; }
  .cancel-btn { background: #718096; }
  .receipt-header { display: flex; justify-content: space-between; align-items: flex-start; }
  .badge { font-size: 0.8rem; padding: 2px 10px; border-radius: 12px; }
  .badge.approved { background: #c6f6d5; color: #276749; }
  .badge.rejected { background: #fed7d7; color: #9b2c2c; }
  .badge.pending { background: #fefcbf; color: #975a16; }
  .fund-line { display: flex; justify-content: space-between; font-size: 0.85rem; padding: 2px 0; }
  .fund-name { text-transform: capitalize; }
</style>
