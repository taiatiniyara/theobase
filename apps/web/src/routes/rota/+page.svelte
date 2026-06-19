<script lang="ts">
  import { getRota } from '$lib/api';
  import { onMount } from 'svelte';

  let date = $state(new Date().toISOString().slice(0, 10));
  let slots = $state<any[]>([]);
  let loading = $state(false);

  async function loadRota() {
    loading = true;
    try {
      const data = await getRota(date);
      slots = Array.isArray(data) ? data : [];
    } catch { slots = []; }
    loading = false;
  }

  onMount(loadRota);

  function prevWeek() {
    const d = new Date(date);
    d.setDate(d.getDate() - 7);
    date = d.toISOString().slice(0, 10);
    loadRota();
  }

  function nextWeek() {
    const d = new Date(date);
    d.setDate(d.getDate() + 7);
    date = d.toISOString().slice(0, 10);
    loadRota();
  }

  const roleLabels: Record<string, string> = {
    elder: 'Elder of the Day',
    preacher: 'Preacher',
    deacon: 'Deacon',
    deaconess: 'Deaconess',
    musician: 'Musician',
    av_operator: 'AV Operator',
    youth_leader: 'Youth Leader',
    sabbath_school_superintendent: 'Sabbath School Supt.',
  };
</script>

<svelte:head>
  <title>Duty Rota — Theobase</title>
</svelte:head>

<h1>Duty Rota</h1>

<div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
  <button onclick={prevWeek} style="background: #718096; padding: 8px 16px;">← Prev</button>
  <input type="date" bind:value={date} onchange={loadRota} style="flex: 1; margin: 0;" />
  <button onclick={nextWeek} style="background: #718096; padding: 8px 16px;">Next →</button>
</div>

{#if loading}
  <p style="color: #718096;">Loading...</p>
{:else if slots.length === 0}
  <div class="card">
    <p style="color: #718096;">No duty assignments for this Sabbath. Ask your clerk to set up the rota.</p>
  </div>
{:else}
  {#each slots as slot}
    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-weight: 600; text-transform: capitalize;">
            {roleLabels[slot.role] || slot.role?.replace(/_/g, ' ')}
          </div>
          {#if slot.volunteerName}
            <div style="color: #718096; font-size: 0.875rem;">{slot.volunteerName}</div>
          {/if}
        </div>
        <span style="font-size: 0.8rem; padding: 2px 10px; border-radius: 12px;
          {slot.status === 'assigned' ? 'background: #c6f6d5; color: #276749;' : 'background: #fefcbf; color: #975a16;'}">
          {slot.status}
        </span>
      </div>
    </div>
  {/each}
{/if}
