<script lang="ts">
  import { getHealthEvents, createHealthEvent, getHealthContacts, createHealthContact } from '$lib/api';
  import { onMount } from 'svelte';
  import FormField from '$lib/components/FormField.svelte';

  let events = $state<any[]>([]);
  let contacts = $state<any[]>([]);
  let loading = $state(true);
  let tab = $state<'events' | 'contacts'>('events');

  let evName = $state('');
  let evDate = $state(new Date().toISOString().slice(0, 10));
  let evType = $state('health_expo');

  let ctEventId = $state('');
  let ctName = $state('');
  let ctPhone = $state('');
  let ctEmail = $state('');
  let ctInterests = $state('');

  async function addEvent() {
    if (!evName) return;
    try {
      const result = await createHealthEvent({ name: evName, date: evDate, type: evType });
      events = [result, ...events];
      evName = '';
    } catch {}
  }

  async function addContact() {
    if (!ctEventId || !ctName) return;
    try {
      const interests = ctInterests.split(',').map(s => s.trim()).filter(Boolean);
      const result = await createHealthContact({ eventId: ctEventId, name: ctName, phone: ctPhone, email: ctEmail, interests });
      contacts = [...contacts, result];
      ctName = ''; ctPhone = ''; ctEmail = ''; ctInterests = '';
    } catch {}
  }

  onMount(async () => {
    try {
      const [ev, ct] = await Promise.all([getHealthEvents(), getHealthContacts()]);
      events = Array.isArray(ev) ? ev : [];
      contacts = Array.isArray(ct) ? ct : [];
      if (events.length && !ctEventId) ctEventId = events[0]?.id;
    } catch {}
    loading = false;
  });
</script>

<svelte:head><title>Health Ministry — Theobase</title></svelte:head>

<h1>Health Ministry</h1>

<div style="display: flex; gap: 8px; margin-bottom: 16px;">
  <button onclick={() => tab = 'events'} style={tab === 'events' ? '' : 'background: #718096;'}>Events</button>
  <button onclick={() => tab = 'contacts'} style={tab === 'contacts' ? '' : 'background: #718096;'}>Contacts</button>
</div>

{#if loading}
  <p style="color: #718096;">Loading...</p>
{:else if tab === 'events'}
  <div class="card">
    <h2>New Event</h2>
    <FormField label="Name" value={evName} placeholder="Spring Health Expo" oninput={(e) => evName = (e.target as HTMLInputElement).value} />
    <FormField label="Date" type="date" value={evDate} oninput={(e) => evDate = (e.target as HTMLInputElement).value} />

    <div class="field">
      <label class="field-label">Type</label>
      <select bind:value={evType} class="select">
        <option value="health_expo">Health Expo</option>
        <option value="cooking_school">Cooking School</option>
        <option value="screening">Screening</option>
        <option value="seminar">Seminar</option>
      </select>
    </div>
    <button onclick={addEvent} disabled={!evName}>Create Event</button>
  </div>

  {#each events as ev}
    <div class="card">
      <div style="font-weight: 600;">{ev.name}</div>
      <div style="color: #718096; font-size: 0.85rem;">{ev.date} — {ev.type?.replace(/_/g, ' ')}</div>
    </div>
  {/each}
{:else}
  <div class="card">
    <h2>Add Contact</h2>
    <div class="field">
      <label class="field-label">Event</label>
      <select bind:value={ctEventId} class="select">
        {#each events as ev}
          <option value={ev.id}>{ev.name} ({ev.date})</option>
        {/each}
      </select>
    </div>
    <FormField label="Name" value={ctName} placeholder="Jane Visitor" oninput={(e) => ctName = (e.target as HTMLInputElement).value} />
    <FormField label="Phone" type="tel" value={ctPhone} placeholder="+679 1234567" oninput={(e) => ctPhone = (e.target as HTMLInputElement).value} />
    <FormField label="Email" type="email" value={ctEmail} placeholder="jane@example.com" oninput={(e) => ctEmail = (e.target as HTMLInputElement).value} />
    <FormField label="Health Interests (comma-separated)" value={ctInterests} placeholder="diabetes, hypertension" oninput={(e) => ctInterests = (e.target as HTMLInputElement).value} />
    <button onclick={addContact} disabled={!ctEventId || !ctName}>Add Contact</button>
  </div>

  {#each contacts as ct}
    <div class="card">
      <div style="font-weight: 600;">{ct.name}</div>
      {#if ct.phone}<div style="font-size: 0.85rem;">{ct.phone}</div>{/if}
      {#if ct.email}<div style="font-size: 0.85rem; color: #2b6cb0;">{ct.email}</div>{/if}
      {#if ct.interests?.length}
        <div style="display: flex; gap: 4px; margin-top: 4px; flex-wrap: wrap;">
          {#each ct.interests as interest}
            <span style="background: #ebf4ff; color: #1a365d; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem;">{interest}</span>
          {/each}
        </div>
      {/if}
    </div>
  {/each}
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
</style>
