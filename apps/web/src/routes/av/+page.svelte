<script lang="ts">
  import { getOrderOfService, updateOrderOfService } from '$lib/api';
  import { onMount } from 'svelte';
  import FormField from '$lib/components/FormField.svelte';

  let date = $state(new Date().toISOString().slice(0, 10));
  let items = $state<any[]>([]);
  let loaded = $state(false);

  let newType = $state('hymn');
  let newTitle = $state('');

  const itemTypes = ['hymn', 'scripture', 'prayer', 'sermon', 'announcement', 'offering', 'special_music', 'benediction'];

  async function load(dateStr: string) {
    try {
      const data = await getOrderOfService(dateStr);
      if (data?.items) items = data.items;
      else items = [];
    } catch { items = []; }
    loaded = true;
  }

  async function addItem() {
    if (!newTitle) return;
    items = [...items, { type: newType, title: newTitle }];
    newTitle = '';
    await save(items);
  }

  async function removeItem(i: number) {
    items = items.filter((_, j) => j !== i);
    await save(items);
  }

  async function save(current: any[]) {
    try {
      await updateOrderOfService({ date, items: current });
    } catch {}
  }

  onMount(() => load(date));
</script>

<svelte:head><title>AV Sync — Theobase</title></svelte:head>

<h1>AV — Order of Service</h1>

<div style="display: flex; gap: 8px; margin-bottom: 16px; align-items: center;">
  <input type="date" bind:value={date} onchange={() => load(date)} class="input-date" />
</div>

<div class="card">
  <h2>Add Item</h2>
  <div class="add-row">
    <div style="flex: 1;">
      <select bind:value={newType} class="select">
        {#each itemTypes as t}
          <option value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
        {/each}
      </select>
    </div>
    <div style="flex: 2;">
      <FormField label="Title" value={newTitle} placeholder="Amazing Grace" oninput={(e) => newTitle = (e.target as HTMLInputElement).value} />
    </div>
    <button onclick={addItem} disabled={!newTitle} class="add-btn">+ Add</button>
  </div>
</div>

{#if loaded}
  {#if items.length === 0}
    <div class="card"><p style="color: #718096;">No order of service for this date.</p></div>
  {:else}
    {#each items as item, i}
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div class="item-type">{item.type?.replace(/_/g, ' ')}</div>
            <div style="font-weight: 600;">{item.title}</div>
          </div>
          <button onclick={() => removeItem(i)} class="remove-btn">✕</button>
        </div>
      </div>
    {/each}
  {/if}
{:else}
  <p style="color: #718096;">Loading...</p>
{/if}

<style>
  .input-date { flex: 1; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.9rem; }
  .select { width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.9rem; box-sizing: border-box; }
  .add-row { display: flex; gap: 8px; align-items: flex-end; }
  .add-btn { flex-shrink: 0; padding: 12px 16px; }
  .remove-btn { background: #e53e3e; padding: 6px 10px; font-size: 0.8rem; color: white; border: none; border-radius: 8px; cursor: pointer; }
  .item-type { font-size: 0.75rem; color: #718096; text-transform: uppercase; }
</style>
