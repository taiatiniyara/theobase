<script lang="ts">
  import { getCandidacies, createCandidacy } from '$lib/api';
  import { onMount } from 'svelte';
  import FormField from '$lib/components/FormField.svelte';

  let candidacies = $state<any[]>([]);
  let loading = $state(true);
  let cdPersonId = $state('');
  let cdStage = $state('interest');
  let cdStartDate = $state(new Date().toISOString().slice(0, 10));

  const stages = ['interest', 'bible_study', 'baptismal_class', 'decision', 'baptized'];

  onMount(async () => {
    try { candidacies = await getCandidacies(); } catch {}
    loading = false;
  });

  async function addCandidacy() {
    if (!cdPersonId) return;
    try {
      const result = await createCandidacy({ personId: cdPersonId, stage: cdStage, startDate: cdStartDate });
      candidacies = [...candidacies, result];
      cdPersonId = '';
    } catch {}
  }

  function stageLabel(s: string) {
    return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
</script>

<svelte:head><title>Candidacy Pipeline — Theobase</title></svelte:head>

<h1>Candidacy Pipeline</h1>

<div class="card">
  <h2>Add Candidacy</h2>
  <FormField label="Person ID" value={cdPersonId} placeholder="person-1" oninput={(e) => cdPersonId = (e.target as HTMLInputElement).value} />
  <div class="field">
    <label class="field-label">Stage</label>
    <select bind:value={cdStage} class="select">
      {#each stages as s}
        <option value={s}>{stageLabel(s)}</option>
      {/each}
    </select>
  </div>
  <FormField label="Start Date" type="date" value={cdStartDate} oninput={(e) => cdStartDate = (e.target as HTMLInputElement).value} />
  <button onclick={addCandidacy} disabled={!cdPersonId}>Add Candidacy</button>
</div>

{#if loading}
  <p style="color: #718096;">Loading...</p>
{:else if candidacies.length === 0}
  <div class="card"><p style="color: #718096;">No candidacies registered.</p></div>
{:else}
  {#each candidacies as c}
    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-weight: 600;">{c.personId?.slice(0, 8)}</div>
          <div style="color: #718096; font-size: 0.85rem;">Started: {c.startDate}</div>
        </div>
        <span class="badge">{stageLabel(c.stage)}</span>
      </div>
    </div>
  {/each}
{/if}

<style>
  .field { margin-bottom: 12px; }
  .field-label { display: block; font-size: 0.75rem; color: #4a5568; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; font-weight: 600; }
  .select { width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.9rem; box-sizing: border-box; }
  .badge { font-size: 0.8rem; padding: 2px 10px; border-radius: 12px; background: #ebf4ff; color: #2b6cb0; }
</style>
