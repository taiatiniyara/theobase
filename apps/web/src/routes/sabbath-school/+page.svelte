<script lang="ts">
  import { getSabbathSchoolClasses, createSabbathSchoolClass, recordAttendance } from '$lib/api';
  import { onMount } from 'svelte';
  import FormField from '$lib/components/FormField.svelte';

  let classes = $state<any[]>([]);
  let loading = $state(true);
  let tab = $state<'classes' | 'attendance'>('classes');

  let division = $state('adult');
  let className = $state('');

  let attClassId = $state('');
  let attDate = $state(new Date().toISOString().slice(0, 10));
  let attRecords = $state<{ memberId: string; present: boolean }[]>([]);
  let attSaved = $state(false);

  const divisions = ['beginners', 'kindergarten', 'primary', 'juniors', 'earliteen', 'youth', 'adult'];

  async function addClass() {
    if (!className) return;
    try {
      const result = await createSabbathSchoolClass({ division, name: className });
      classes = [...classes, result];
      className = '';
    } catch {}
  }

  function addAttendee() { attRecords = [...attRecords, { memberId: '', present: true }]; }
  function removeAttendee(i: number) { attRecords = attRecords.filter((_, j) => j !== i); }

  async function submitAttendance() {
    if (!attClassId || !attDate || attRecords.length === 0) return;
    try {
      await recordAttendance({
        attendance: attRecords.filter(a => a.memberId).map(a => ({
          classId: attClassId, date: attDate, memberId: a.memberId, present: a.present,
        })),
      });
      attSaved = true;
      attRecords = [];
    } catch {}
  }

  onMount(async () => {
    try { classes = await getSabbathSchoolClasses(); } catch {}
    loading = false;
  });
</script>

<svelte:head><title>Sabbath School — Theobase</title></svelte:head>

<h1>Sabbath School</h1>

<div style="display: flex; gap: 8px; margin-bottom: 16px;">
  <button onclick={() => tab = 'classes'} style={tab === 'classes' ? '' : 'background: #718096;'}>Classes</button>
  <button onclick={() => tab = 'attendance'} style={tab === 'attendance' ? '' : 'background: #718096;'}>Attendance</button>
</div>

{#if tab === 'attendance'}
  <div class="card">
    <h2>Record Attendance</h2>
    <div class="field">
      <label class="field-label">Class</label>
      <select bind:value={attClassId} class="select">
        <option value="">Select class...</option>
        {#each classes as c}
          <option value={c.id}>{c.name} ({c.division})</option>
        {/each}
      </select>
    </div>
    <FormField label="Date" type="date" value={attDate} oninput={(e) => attDate = (e.target as HTMLInputElement).value} />

    {#each attRecords as att, i}
      <div class="record-row">
        <div style="flex: 3;">
          <FormField label={i === 0 ? 'Member ID' : ''} value={att.memberId} placeholder="person-1" oninput={(e) => attRecords[i].memberId = (e.target as HTMLInputElement).value} />
        </div>
        <div style="flex: 1;">
          {#if i === 0}<label class="field-label">Present</label>{/if}
          <input type="checkbox" bind:checked={attRecords[i].present} style="margin-top: 8px;" />
        </div>
        <button onclick={() => removeAttendee(i)} class="remove-btn">✕</button>
      </div>
    {/each}
    <button onclick={addAttendee} style="background: #718096; margin-bottom: 12px;">+ Add Attendee</button>
    <button onclick={submitAttendance} disabled={!attClassId || attRecords.length === 0}>Record Attendance</button>
    {#if attSaved}
      <p class="success" style="margin-top: 12px;">Attendance recorded for {attDate}.</p>
    {/if}
  </div>
{:else}
  <div class="card">
    <h2>Add Class</h2>
    <div class="field">
      <label class="field-label">Division</label>
      <select bind:value={division} class="select">
        {#each divisions as d}
          <option value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
        {/each}
      </select>
    </div>
    <FormField label="Class Name" value={className} placeholder="Adult Class A" oninput={(e) => className = (e.target as HTMLInputElement).value} />
    <button onclick={addClass} disabled={!className}>Add Class</button>
  </div>

  {#if loading}
    <p style="color: #718096;">Loading...</p>
  {:else if classes.length === 0}
    <div class="card"><p style="color: #718096;">No classes yet.</p></div>
  {:else}
    {#each classes as c}
      <div class="card">
        <div style="font-weight: 600;">{c.name}</div>
        <div style="color: #718096; font-size: 0.85rem; text-transform: capitalize;">{c.division} Division</div>
      </div>
    {/each}
  {/if}
{/if}

<style>
  .field { margin-bottom: 12px; }
  .field-label { display: block; font-size: 0.75rem; color: #4a5568; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; font-weight: 600; }
  .select { width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.9rem; box-sizing: border-box; }
  .record-row { display: flex; gap: 8px; align-items: flex-end; margin-bottom: 8px; }
  .remove-btn { background: #e53e3e; padding: 6px 10px; font-size: 0.8rem; color: white; border: none; border-radius: 8px; cursor: pointer; flex-shrink: 0; }
</style>
