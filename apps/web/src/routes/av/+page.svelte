<script lang="ts">
  import { getOrderOfService, updateOrderOfService } from '$lib/api';
  import { onMount } from 'svelte';

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
  <input type="date" bind:value={date} onchange={() => load(date)} style="flex: 1; margin: 0;" />
</div>

<div class="card">
  <h2>Add Item</h2>
  <div style="display: flex; gap: 8px; align-items: flex-end;">
    <div style="flex: 1;">
      <div class="label">Type</div>
      <select bind:value={newType} style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.9rem; margin: 0;">
        {#each itemTypes as t}
          <option value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
        {/each}
      </select>
    </div>
    <div style="flex: 2;">
      <div class="label">Title</div>
      <input type="text" bind:value={newTitle} placeholder="Amazing Grace" style="margin: 0;" />
    </div>
    <button onclick={addItem} disabled={!newTitle} style="flex-shrink: 0;">+ Add</button>
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
            <div style="font-size: 0.75rem; color: #718096; text-transform: uppercase;">{item.type?.replace(/_/g, ' ')}</div>
            <div style="font-weight: 600;">{item.title}</div>
          </div>
          <button onclick={() => removeItem(i)} style="background: #e53e3e; padding: 6px 10px; font-size: 0.8rem;">✕</button>
        </div>
      </div>
    {/each}
  {/if}
{:else}
  <p style="color: #718096;">Loading...</p>
{/if}
