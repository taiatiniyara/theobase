<script lang="ts">
  import { getDistrictRotations, createDistrictRotation, createDistrictVisit } from '$lib/api';
  import { onMount } from 'svelte';

  let rotations = $state<any[]>([]);
  let loading = $state(true);
  let tab = $state<'rotations' | 'visits'>('rotations');

  // Rotation form
  let rotCongId = $state('');
  let rotDate = $state('');
  let rotPreacher = $state('');
  let rotTopic = $state('');

  // Visit form
  let visHousehold = $state('');
  let visPastor = $state('');
  let visDate = $state('');
  let visPurpose = $state('');
  let visNotes = $state('');

  async function addRotation() {
    if (!rotCongId || !rotDate || !rotPreacher) return;
    try {
      const result = await createDistrictRotation({
        congregationId: rotCongId, date: rotDate, preacherId: rotPreacher, topic: rotTopic,
      });
      rotations = [...rotations, result];
      rotTopic = '';
    } catch {}
  }

  async function addVisit() {
    if (!visHousehold || !visDate) return;
    try {
      await createDistrictVisit({
        householdId: visHousehold, pastorId: visPastor, date: visDate,
        purpose: visPurpose, notes: visNotes,
      });
      visHousehold = ''; visPurpose = ''; visNotes = '';
    } catch {}
  }

  onMount(async () => {
    try { rotations = await getDistrictRotations(); } catch {}
    loading = false;
  });
</script>

<svelte:head><title>District Hub — Theobase</title></svelte:head>

<h1>District Hub</h1>

<div style="display: flex; gap: 8px; margin-bottom: 16px;">
  <button onclick={() => tab = 'rotations'} style={tab === 'rotations' ? '' : 'background: #718096;'}>Preaching Rotations</button>
  <button onclick={() => tab = 'visits'} style={tab === 'visits' ? '' : 'background: #718096;'}>Pastoral Visits</button>
</div>

{#if loading}
  <p style="color: #718096;">Loading...</p>
{:else if tab === 'rotations'}
  <div class="card">
    <h2>Schedule Preaching</h2>
    <div class="label">Congregation ID</div>
    <input type="text" bind:value={rotCongId} placeholder="con-1" />
    <div class="label">Date</div>
    <input type="date" bind:value={rotDate} />
    <div class="label">Preacher ID</div>
    <input type="text" bind:value={rotPreacher} placeholder="pastor-1" />
    <div class="label">Topic</div>
    <input type="text" bind:value={rotTopic} placeholder="Faith" />
    <button onclick={addRotation} disabled={!rotCongId || !rotDate || !rotPreacher}>Schedule</button>
  </div>

  {#each rotations as r}
    <div class="card">
      <div style="font-weight: 600;">{r.date} — {r.topic || 'TBD'}</div>
      <div style="color: #718096; font-size: 0.85rem;">Preacher: {r.preacherId} | Church: {r.congregationId}</div>
    </div>
  {/each}
{:else}
  <div class="card">
    <h2>Record Visit</h2>
    <div class="label">Household ID</div>
    <input type="text" bind:value={visHousehold} placeholder="household-1" />
    <div class="label">Pastor ID</div>
    <input type="text" bind:value={visPastor} placeholder="pastor-1" />
    <div class="label">Date</div>
    <input type="date" bind:value={visDate} />
    <div class="label">Purpose</div>
    <input type="text" bind:value={visPurpose} placeholder="Pastoral visit" />
    <div class="label">Notes</div>
    <textarea bind:value={visNotes} rows="2" placeholder="Visit notes..." style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.85rem; box-sizing: border-box; margin-bottom: 12px;"></textarea>
    <button onclick={addVisit} disabled={!visHousehold || !visDate}>Record Visit</button>
  </div>
{/if}
