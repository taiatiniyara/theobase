<script lang="ts">
  import { getHouseholds, createHousehold } from '$lib/api';
  import { onMount } from 'svelte';
  import FormField from '$lib/components/FormField.svelte';

  let households = $state<any[]>([]);
  let loading = $state(true);
  let hhName = $state('');

  async function addHousehold() {
    if (!hhName.trim()) return;
    try {
      const result = await createHousehold({ name: hhName.trim() });
      households = [...households, result];
      hhName = '';
    } catch {}
  }

  onMount(async () => {
    try { households = await getHouseholds(); } catch {}
    loading = false;
  });
</script>

<svelte:head><title>Households — Theobase</title></svelte:head>

<h1>Households</h1>

<div class="card">
  <h2>Add Household</h2>
  <FormField label="Household Name" value={hhName} placeholder="Smith Family" oninput={(e) => hhName = (e.target as HTMLInputElement).value} />
  <button onclick={addHousehold} disabled={!hhName.trim()}>Add Household</button>
</div>

{#if loading}
  <p style="color: #718096;">Loading...</p>
{:else if households.length === 0}
  <div class="card"><p style="color: #718096;">No households registered.</p></div>
{:else}
  {#each households as h}
    <div class="card">
      <div style="font-weight: 600;">{h.name}</div>
      <div style="color: #718096; font-size: 0.85rem;">ID: {h.id?.slice(0, 8)}</div>
    </div>
  {/each}
{/if}
