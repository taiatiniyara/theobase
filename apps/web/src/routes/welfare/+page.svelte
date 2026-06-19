<script lang="ts">
  import { getWelfareCases, createWelfareCase, getPantryItems, createPantryItem } from '$lib/api';
  import { onMount } from 'svelte';
  import FormField from '$lib/components/FormField.svelte';
  import AmountField from '$lib/components/AmountField.svelte';

  let cases = $state<any[]>([]);
  let pantry = $state<any[]>([]);
  let loading = $state(true);
  let tab = $state<'cases' | 'pantry'>('cases');

  let casePersonId = $state('');
  let caseType = $state('food');
  let caseDesc = $state('');
  let caseValue = $state(0);

  let itemName = $state('');
  let itemQty = $state(0);
  let itemUnit = $state('kg');

  async function addCase() {
    if (!casePersonId || !caseDesc) return;
    try {
      const result = await createWelfareCase({ personId: casePersonId, assistanceType: caseType, description: caseDesc, value: caseValue });
      cases = [result, ...cases];
      caseDesc = ''; caseValue = 0;
    } catch {}
  }

  async function addPantryItem() {
    if (!itemName || !itemQty) return;
    try {
      const result = await createPantryItem({ name: itemName, quantity: itemQty, unit: itemUnit });
      pantry = [...pantry, result];
      itemName = ''; itemQty = 0;
    } catch {}
  }

  onMount(async () => {
    try {
      const [c, p] = await Promise.all([getWelfareCases(), getPantryItems()]);
      cases = Array.isArray(c) ? c : [];
      pantry = Array.isArray(p) ? p : [];
    } catch {}
    loading = false;
  });
</script>

<svelte:head>
  <title>Welfare — Theobase</title>
</svelte:head>

<h1>Community Welfare</h1>

<div style="display: flex; gap: 8px; margin-bottom: 16px;">
  <button onclick={() => tab = 'cases'} style={tab === 'cases' ? '' : 'background: #718096;'}>Cases</button>
  <button onclick={() => tab = 'pantry'} style={tab === 'pantry' ? '' : 'background: #718096;'}>Pantry</button>
</div>

{#if loading}
  <p style="color: #718096;">Loading...</p>
{:else if tab === 'cases'}
  <div class="card">
    <h2>New Case</h2>
    <FormField label="Person ID" value={casePersonId} placeholder="person-1" oninput={(e) => casePersonId = (e.target as HTMLInputElement).value} />

    <div class="field">
      <label class="field-label">Type</label>
      <select bind:value={caseType} class="select">
        <option value="food">Food</option>
        <option value="financial">Financial</option>
        <option value="clothing">Clothing</option>
        <option value="shelter">Shelter</option>
        <option value="medical">Medical</option>
      </select>
    </div>

    <FormField label="Description" value={caseDesc} placeholder="Emergency food parcel" oninput={(e) => caseDesc = (e.target as HTMLInputElement).value} />

    <AmountField cents={caseValue} onchange={(c) => caseValue = c} />
    <button onclick={addCase} disabled={!casePersonId || !caseDesc}>Record Case</button>
  </div>

  {#each cases as c}
    <div class="card">
      <div style="display: flex; justify-content: space-between;">
        <div>
          <div style="font-weight: 600; text-transform: capitalize;">{c.assistanceType}</div>
          <div style="color: #718096; font-size: 0.875rem;">{c.description}</div>
        </div>
        <div style="font-weight: 600;">${(c.value / 100).toFixed(2)}</div>
      </div>
    </div>
  {/each}
{:else}
  <div class="card">
    <h2>Add Item</h2>
    <FormField label="Name" value={itemName} placeholder="Rice" oninput={(e) => itemName = (e.target as HTMLInputElement).value} />
    <div style="display: flex; gap: 8px;">
      <div style="flex: 1;">
        <FormField label="Quantity" type="number" value={itemQty} placeholder="100" oninput={(e) => itemQty = parseInt((e.target as HTMLInputElement).value) || 0} />
      </div>
      <div style="flex: 1;">
        <div class="field">
          <label class="field-label">Unit</label>
          <select bind:value={itemUnit} class="select">
            <option value="kg">kg</option>
            <option value="pieces">pieces</option>
            <option value="litres">litres</option>
            <option value="packets">packets</option>
          </select>
        </div>
      </div>
    </div>
    <button onclick={addPantryItem} disabled={!itemName || !itemQty} style="margin-top: 12px;">Add</button>
  </div>

  {#each pantry as item}
    <div class="card">
      <div style="display: flex; justify-content: space-between;">
        <div style="font-weight: 600;">{item.name}</div>
        <div style="color: #718096;">{item.quantity} {item.unit}</div>
      </div>
    </div>
  {/each}
{/if}

<style>
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
