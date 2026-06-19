<script lang="ts">
  import { getSabbathSchoolClasses, createSabbathSchoolClass, getMe } from '$lib/api';
  import { onMount } from 'svelte';

  let classes = $state<any[]>([]);
  let loading = $state(true);

  let division = $state('adult');
  let className = $state('');

  const divisions = ['beginners', 'kindergarten', 'primary', 'juniors', 'earliteen', 'youth', 'adult'];

  async function addClass() {
    if (!className) return;
    try {
      const result = await createSabbathSchoolClass({ division, name: className });
      classes = [...classes, result];
      className = '';
    } catch {}
  }

  onMount(async () => {
    try {
      classes = await getSabbathSchoolClasses();
    } catch {}
    loading = false;
  });
</script>

<svelte:head>
  <title>Sabbath School — Theobase</title>
</svelte:head>

<h1>Sabbath School</h1>

<div class="card">
  <h2>Add Class</h2>
  <div class="label">Division</div>
  <select bind:value={division} style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 8px; font-size: 0.9rem; text-transform: capitalize;">
    {#each divisions as d}
      <option value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
    {/each}
  </select>
  <div class="label">Class Name</div>
  <input type="text" bind:value={className} placeholder="Adult Class A" />
  <button onclick={addClass} disabled={!className}>Add Class</button>
</div>

{#if loading}
  <p style="color: #718096;">Loading...</p>
{:else if classes.length === 0}
  <div class="card">
    <p style="color: #718096;">No classes yet.</p>
  </div>
{:else}
  {#each classes as c}
    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-weight: 600;">{c.name}</div>
          <div style="color: #718096; font-size: 0.85rem; text-transform: capitalize;">{c.division} Division</div>
        </div>
      </div>
    </div>
  {/each}
{/if}
