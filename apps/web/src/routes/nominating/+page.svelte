<script lang="ts">
  import { createNominatingSession, createNominatingRole } from '$lib/api';
  import FormField from '$lib/components/FormField.svelte';

  let year = $state(new Date().getFullYear());
  let session = $state<any>(null);
  let roles = $state<any[]>([]);

  let roleType = $state('elder');

  const roleTypes = ['elder', 'clerk', 'treasurer', 'deacon', 'deaconess', 'head_deacon', 'head_deaconess', 'sabbath_school_superintendent', 'pathfinder_director', 'adventurer_director', 'dorcas_coordinator', 'health_ministries_leader', 'youth_leader', 'music_coordinator'];

  async function openSession() {
    try {
      const result = await createNominatingSession({ year });
      session = result;
    } catch {}
  }

  async function addRole() {
    if (!session || !roleType) return;
    try {
      const result = await createNominatingRole({ sessionId: session.id, roleType });
      roles = [...roles, result];
    } catch {}
  }
</script>

<svelte:head><title>Nominating — Theobase</title></svelte:head>

<h1>Nominating Committee</h1>

{#if !session}
  <div class="card">
    <h2>Open Session</h2>
    <FormField label="Year" type="number" value={year} placeholder="2025" oninput={(e) => year = parseInt((e.target as HTMLInputElement).value) || 0} />
    <button onclick={openSession}>Open Nominating Session</button>
  </div>
{:else}
  <div class="card">
    <h2>Session Active — {session.year}</h2>
    <div class="info-row"><span class="label">Opened</span> <span class="value">{session.id?.slice(0, 8)}</span></div>
  </div>

  <div class="card">
    <h2>Add Role to Ballot</h2>
    <div class="field">
      <label class="field-label">Role</label>
      <select bind:value={roleType} class="select">
        {#each roleTypes as r}
          <option value={r}>{r.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
        {/each}
      </select>
    </div>
    <button onclick={addRole}>Add Role</button>
  </div>

  {#if roles.length > 0}
    <div class="card">
      <h2>Ballot ({roles.length} roles)</h2>
      {#each roles as role}
        <div style="padding: 4px 0; text-transform: capitalize;">
          {role.roleType?.replace(/_/g, ' ')}
        </div>
      {/each}
    </div>
  {/if}
{/if}

<style>
  .field { margin-bottom: 12px; }
  .field-label {
    display: block;
    font-size: 0.75rem;
    color: #4a5568;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
    font-weight: 600;
  }
  .select { width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.9rem; box-sizing: border-box; }
  .info-row { margin-bottom: 8px; }
  .label { font-size: 0.75rem; color: #718096; text-transform: uppercase; }
  .value { font-size: 1rem; }
</style>
