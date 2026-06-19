<script lang="ts">
  import { getMe, getPathfinderProgress, createPathfinderProgress, getPathfinderHonors, createPathfinderHonor } from '$lib/api';
  import { onMount } from 'svelte';

  let memberId = $state('');
  let progress = $state<any[]>([]);
  let honors = $state<any[]>([]);
  let loading = $state(false);
  let loaded = $state(false);
  let tab = $state<'progress' | 'honors'>('progress');

  let clsName = $state('friend');
  let clsStatus = $state('in_progress');
  let honorName = $state('');
  let honorCategory = $state('Health');
  let honorDate = $state(new Date().toISOString().slice(0, 10));

  const classRanks = ['friend', 'companion', 'explorer', 'ranger', 'guide'];
  const honorCategories = ['Health', 'Nature', 'Outdoor', 'Vocational', 'Arts', 'Household', 'Recreation'];
  const clubTypes = ['pathfinders', 'adventurers'];

  async function loadData() {
    if (!memberId) return;
    loading = true;
    try {
      const [p, h] = await Promise.all([
        getPathfinderProgress(memberId),
        getPathfinderHonors(memberId),
      ]);
      progress = Array.isArray(p) ? p : [];
      honors = Array.isArray(h) ? h : [];
      loaded = true;
    } catch {}
    loading = false;
  }

  async function addProgress() {
    if (!memberId) return;
    try {
      const result = await createPathfinderProgress({ memberId, className: clsName, clubType: 'pathfinders', status: clsStatus });
      progress = [...progress, result];
    } catch {}
  }

  async function addHonor() {
    if (!memberId || !honorName) return;
    try {
      const result = await createPathfinderHonor({ memberId, name: honorName, category: honorCategory, earnedAt: honorDate });
      honors = [...honors, result];
      honorName = '';
    } catch {}
  }

  onMount(async () => {
    try {
      const me = await getMe();
      if (me?.personId) memberId = me.personId;
    } catch {}
  });
</script>

<svelte:head>
  <title>Pathfinders — Theobase</title>
</svelte:head>

<h1>Pathfinders</h1>

<div class="card">
  <div class="label">Member ID</div>
  <div style="display: flex; gap: 8px;">
    <input type="text" bind:value={memberId} placeholder="person-1" style="flex: 1; margin: 0;" />
    <button onclick={loadData}>Load</button>
  </div>
</div>

{#if loading}
  <p style="color: #718096;">Loading...</p>
{:else if loaded}
  <div style="display: flex; gap: 8px; margin-bottom: 16px;">
    <button onclick={() => tab = 'progress'} style={tab === 'progress' ? '' : 'background: #718096;'}>Class Progress</button>
    <button onclick={() => tab = 'honors'} style={tab === 'honors' ? '' : 'background: #718096;'}>Honors</button>
  </div>

  {#if tab === 'progress'}
    <div class="card">
      <h2>Record Progress</h2>
      <div class="label">Class</div>
      <select bind:value={clsName} style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 8px; font-size: 0.9rem;">
        {#each classRanks as rank}
          <option value={rank}>{rank.charAt(0).toUpperCase() + rank.slice(1)}</option>
        {/each}
      </select>
      <div class="label">Status</div>
      <select bind:value={clsStatus} style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 12px; font-size: 0.9rem;">
        <option value="in_progress">In Progress</option>
        <option value="completed">Completed</option>
        <option value="invested">Invested</option>
      </select>
      <button onclick={addProgress}>Record</button>
    </div>

    {#each progress as p}
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="text-transform: capitalize; font-weight: 600;">{p.className} — {p.clubType}</div>
          <span style="font-size: 0.8rem; padding: 2px 10px; border-radius: 12px;
            {p.status === 'completed' || p.status === 'invested' ? 'background: #c6f6d5; color: #276749;' : 'background: #fefcbf; color: #975a16;'}">
            {p.status?.replace(/_/g, ' ')}
          </span>
        </div>
      </div>
    {/each}
  {:else}
    <div class="card">
      <h2>Add Honor</h2>
      <div class="label">Name</div>
      <input type="text" bind:value={honorName} placeholder="First Aid" />
      <div class="label">Category</div>
      <select bind:value={honorCategory} style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 8px; font-size: 0.9rem;">
        {#each honorCategories as cat}
          <option value={cat}>{cat}</option>
        {/each}
      </select>
      <div class="label">Date Earned</div>
      <input type="date" bind:value={honorDate} style="margin-bottom: 12px;" />
      <button onclick={addHonor} disabled={!honorName}>Add Honor</button>
    </div>

    {#each honors as h}
      <div class="card">
        <div style="display: flex; justify-content: space-between;">
          <div>
            <div style="font-weight: 600;">{h.name}</div>
            <div style="color: #718096; font-size: 0.85rem;">{h.category} — {h.earnedAt}</div>
          </div>
        </div>
      </div>
    {/each}
  {/if}
{/if}
