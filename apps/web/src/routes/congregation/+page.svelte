<script lang="ts">
  import { api } from '$lib/api';
  import { onMount } from 'svelte';

  let congregation = $state<any>(null);
  let loading = $state(true);
  let inviteEmail = $state('');
  let inviteRole = $state('elder');
  let inviteStatus = $state('');
  let csvText = $state('');
  let csvResult = $state<any>(null);
  let csvError = $state('');

  const roleOptions = ['elder', 'clerk', 'treasurer', 'deacon', 'deaconess', 'musician', 'av_operator', 'youth_leader', 'sabbath_school_superintendent', 'pathfinder_director', 'adventurer_director', 'dorcas_coordinator', 'health_ministries_leader'];

  async function loadCongregation(id: string) {
    try {
      const res = await api(`/congregations/${id}`);
      congregation = await res.json();
    } catch {}
    loading = false;
  }

  async function sendInvite() {
    if (!inviteEmail) return;
    inviteStatus = '';
    try {
      const res = await api(`/congregations/${congregation.id}/invite`, {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      inviteStatus = data.ok ? 'Invitation sent!' : (data.error || 'Failed');
      if (data.ok) inviteEmail = '';
    } catch { inviteStatus = 'Failed to send.'; }
  }

  async function importCSV() {
    if (!csvText.trim()) return;
    csvError = '';
    csvResult = null;
    try {
      const res = await api(`/congregations/${congregation.id}/members/import`, {
        method: 'POST',
        body: JSON.stringify({ csv: csvText }),
      });
      const data = await res.json();
      if (res.status === 201 || res.status === 200) {
        csvResult = data;
        csvText = '';
      } else {
        csvError = data.error || 'Import failed.';
      }
    } catch { csvError = 'Import failed.'; }
  }

  onMount(async () => {
    try {
      const meRes = await api('/me');
      const me = await meRes.json();
      if (me?.congregationId) {
        await loadCongregation(me.congregationId);
      } else {
        loading = false;
      }
    } catch { loading = false; }
  });
</script>

<svelte:head>
  <title>Congregation — Theobase</title>
</svelte:head>

<h1>Congregation</h1>

{#if loading}
  <p style="color: #718096;">Loading...</p>
{:else if !congregation}
  <div class="card">
    <p style="color: #718096;">You are not associated with a congregation yet. Contact your conference office.</p>
  </div>
{:else}
  <div class="card">
    <h2>{congregation.name}</h2>
    <div class="label">Type</div>
    <div class="value" style="text-transform: capitalize;">{congregation.type}</div>
    <div class="label">Timezone</div>
    <div class="value">{congregation.timezone}</div>
  </div>

  <div class="card">
    <h2>Invite Officer</h2>
    <div class="label">Email</div>
    <input type="email" bind:value={inviteEmail} placeholder="officer@mychurch.org" />

    <div class="label">Role</div>
    <select bind:value={inviteRole} style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 12px; font-size: 0.9rem;">
      {#each roleOptions as role}
        <option value={role}>{role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
      {/each}
    </select>

    <button onclick={sendInvite} disabled={!inviteEmail}>Send Invitation</button>
    {#if inviteStatus}
      <p class={inviteStatus.includes('sent') ? 'success' : 'error'} style="margin-top: 8px;">{inviteStatus}</p>
    {/if}
  </div>

  <div class="card">
    <h2>Import Members (CSV)</h2>
    <div class="label">Paste CSV</div>
    <textarea bind:value={csvText} rows="5" placeholder="firstName,lastName,email,phone,isMember&#10;Alice,Smith,alice@test.com,+679 111,true&#10;Bob,Jones,bob@test.com,+679 222,false" style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.85rem; font-family: monospace; box-sizing: border-box; margin-bottom: 12px;"></textarea>

    <button onclick={importCSV} disabled={!csvText.trim()}>Import</button>

    {#if csvResult}
      <div style="margin-top: 12px;">
        <p class="success">{csvResult.imported} members imported.</p>
        {#if csvResult.errors?.length}
          <p class="error">{csvResult.errors.length} rows had errors.</p>
        {/if}
      </div>
    {/if}
    {#if csvError}
      <p class="error">{csvError}</p>
    {/if}
  </div>
{/if}
