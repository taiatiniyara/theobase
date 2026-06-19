<script lang="ts">
  import { getDistrictRotations, createDistrictRotation, createDistrictVisit } from '$lib/api';
  import { onMount } from 'svelte';
  import FormField from '$lib/components/FormField.svelte';

  let rotations = $state<any[]>([]);
  let loading = $state(true);
  let tab = $state<'rotations' | 'visits'>('rotations');

  let rotCongId = $state('');
  let rotDate = $state('');
  let rotPreacher = $state('');
  let rotTopic = $state('');

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
    <FormField label="Congregation ID" value={rotCongId} placeholder="con-1" oninput={(e) => rotCongId = (e.target as HTMLInputElement).value} />
    <FormField label="Date" type="date" value={rotDate} oninput={(e) => rotDate = (e.target as HTMLInputElement).value} />
    <FormField label="Preacher ID" value={rotPreacher} placeholder="pastor-1" oninput={(e) => rotPreacher = (e.target as HTMLInputElement).value} />
    <FormField label="Topic" value={rotTopic} placeholder="Faith" oninput={(e) => rotTopic = (e.target as HTMLInputElement).value} />
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
    <FormField label="Household ID" value={visHousehold} placeholder="household-1" oninput={(e) => visHousehold = (e.target as HTMLInputElement).value} />
    <FormField label="Pastor ID" value={visPastor} placeholder="pastor-1" oninput={(e) => visPastor = (e.target as HTMLInputElement).value} />
    <FormField label="Date" type="date" value={visDate} oninput={(e) => visDate = (e.target as HTMLInputElement).value} />
    <FormField label="Purpose" value={visPurpose} placeholder="Pastoral visit" oninput={(e) => visPurpose = (e.target as HTMLInputElement).value} />
    <FormField label="Notes" type="textarea" value={visNotes} placeholder="Visit notes..." oninput={(e) => visNotes = (e.target as HTMLTextAreaElement).value} />
    <button onclick={addVisit} disabled={!visHousehold || !visDate}>Record Visit</button>
  </div>
{/if}
