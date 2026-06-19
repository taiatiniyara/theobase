<script lang="ts">
  import { createNominatingSession, createNominatingRole } from '$lib/api';

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
    <div class="label">Year</div>
    <input type="number" bind:value={year} placeholder="2025" />
    <button onclick={openSession}>Open Nominating Session</button>
  </div>
{:else}
  <div class="card">
    <h2>Session Active — {session.year}</h2>
    <div class="label">Opened</div>
    <div class="value">{session.id?.slice(0, 8)}</div>
  </div>

  <div class="card">
    <h2>Add Role to Ballot</h2>
    <div class="label">Role</div>
    <select bind:value={roleType} style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 12px; font-size: 0.9rem; text-transform: capitalize;">
      {#each roleTypes as r}
        <option value={r}>{r.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
      {/each}
    </select>
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
