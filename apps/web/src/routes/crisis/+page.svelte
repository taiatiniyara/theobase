<script lang="ts">
  import { getCrisisAssets, createCrisisAsset } from '$lib/api';
  import { onMount } from 'svelte';

  let assets = $state<any[]>([]);
  let loading = $state(true);

  let asType = $state('generator');
  let asDesc = $state('');
  let asStatus = $state('operational');

  const assetTypes = ['generator', 'water_storage', 'shelter', 'first_aid', 'communications', 'food_storage', 'transport'];

  async function addAsset() {
    if (!asDesc) return;
    try {
      const result = await createCrisisAsset({ type: asType, description: asDesc, status: asStatus });
      assets = [...assets, result];
      asDesc = '';
    } catch {}
  }

  onMount(async () => {
    try { assets = await getCrisisAssets(); } catch {}
    loading = false;
  });
</script>

<svelte:head><title>Crisis Resilience — Theobase</title></svelte:head>

<h1>Crisis Resilience</h1>

<div class="card">
  <h2>Register Asset</h2>
  <div class="label">Type</div>
  <select bind:value={asType} style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 8px; font-size: 0.9rem; text-transform: capitalize;">
    {#each assetTypes as t}
      <option value={t}>{t.replace(/_/g, ' ')}</option>
    {/each}
  </select>
  <div class="label">Description</div>
  <input type="text" bind:value={asDesc} placeholder="Honda 5kW" />
  <div class="label">Status</div>
  <select bind:value={asStatus} style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 12px; font-size: 0.9rem;">
    <option value="operational">Operational</option>
    <option value="maintenance">Needs Maintenance</option>
    <option value="deployed">Deployed</option>
  </select>
  <button onclick={addAsset} disabled={!asDesc}>Register</button>
</div>

{#if loading}
  <p style="color: #718096;">Loading...</p>
{:else}
  {#each assets as a}
    <div class="card">
      <div style="display: flex; justify-content: space-between;">
        <div>
          <div style="font-weight: 600;">{a.description}</div>
          <div style="color: #718096; font-size: 0.85rem; text-transform: capitalize;">{a.type?.replace(/_/g, ' ')}</div>
        </div>
        <span style="font-size: 0.8rem; padding: 2px 10px; border-radius: 12px;
          {a.status === 'operational' ? 'background: #c6f6d5; color: #276749;' : a.status === 'maintenance' ? 'background: #fefcbf; color: #975a16;' : 'background: #ebf4ff; color: #2b6cb0;'}">
          {a.status}
        </span>
      </div>
    </div>
  {/each}
{/if}
