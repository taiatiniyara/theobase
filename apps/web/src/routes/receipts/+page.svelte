<script lang="ts">
  import { getReceipts, createReceipt } from '$lib/api';
  import { onMount } from 'svelte';

  let receipts = $state<any[]>([]);
  let loading = $state(true);
  let showForm = $state(false);
  let formError = $state('');

  let amount = $state(0);
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
    if (total !== amount) {
      formError = `Fund splits (${total}) don't match total amount (${amount}).`;
      return;
    }
    try {
      const result = await createReceipt({ amount, fundSplit: split });
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
    <div class="label">Total Amount (cents)</div>
    <input type="number" bind:value={amount} placeholder="10000" />

    <div class="label">Fund Split</div>
    {#each fundSplits as fund, i}
      <div style="display: flex; gap: 8px; margin-bottom: 8px; align-items: center;">
        <select value={fund.name} onchange={(e) => updateFundName(i, (e.target as HTMLSelectElement).value)} style="flex: 1; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.9rem;">
          <option value="">Select fund...</option>
          {#each fundOptions as opt}
            <option value={opt} disabled={fundSplits.some((f, j) => f.name === opt && j !== i)}>
              {opt.replace(/_/g, ' ')}
            </option>
          {/each}
        </select>
        <input type="number" value={fund.value} oninput={(e) => updateFundValue(i, parseInt((e.target as HTMLInputElement).value) || 0)} placeholder="0" style="width: 100px; margin: 0;" />
        {#if fundSplits.length > 1}
          <button onclick={() => removeFund(i)} style="background: #e53e3e; padding: 8px 12px; font-size: 0.85rem;">✕</button>
        {/if}
      </div>
    {/each}
    {#if fundSplits.length < fundOptions.length}
      <button onclick={addFund} style="background: #718096; padding: 8px 16px; font-size: 0.85rem; margin-bottom: 12px;">+ Add fund</button>
    {/if}

    {#if formError}
      <p class="error">{formError}</p>
    {/if}

    <div style="display: flex; gap: 8px;">
      <button onclick={submit}>Submit</button>
      <button style="background: #718096;" onclick={() => showForm = false}>Cancel</button>
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
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <div class="label">Receipt #{receipt.id?.slice(0, 8)}</div>
          <div style="font-weight: 600;">${(receipt.amount / 100).toFixed(2)}</div>
        </div>
        <span style="font-size: 0.8rem; padding: 2px 10px; border-radius: 12px;
          {receipt.status === 'approved' ? 'background: #c6f6d5; color: #276749;' : receipt.status === 'rejected' ? 'background: #fed7d7; color: #9b2c2c;' : 'background: #fefcbf; color: #975a16;'}">
          {receipt.status}
        </span>
      </div>
      {#if receipt.fundSplit}
        <div style="margin-top: 8px;">
          {#each Object.entries(receipt.fundSplit) as [fund, val]}
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; padding: 2px 0;">
              <span style="text-transform: capitalize;">{fund.replace(/_/g, ' ')}</span>
              <span>${((val as number) / 100).toFixed(2)}</span>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/each}
{/if}
