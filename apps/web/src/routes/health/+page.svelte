<script lang="ts">
  import { getHealthEvents, createHealthEvent, getHealthContacts, createHealthContact } from '$lib/api';
  import { onMount } from 'svelte';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Badge } from '$lib/components/ui/badge';
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import { HeartPulse } from '@lucide/svelte';
  import { formatDate } from '$lib/format';
  import DataToolbar from "$lib/components/DataToolbar.svelte";

  let events = $state<any[]>([]);
  let contacts = $state<any[]>([]);
  let loading = $state(true);
  let loadError = $state("");
  let actionError = $state("");
  let submitting = $state(false);
  let tab = $state<'events' | 'contacts'>('events');

  let searchQuery = $state("");
  let sortKey = $state("date");
  let sortDir = $state<"asc" | "desc">("desc");

  const filteredEvents = $derived(
    events
      .filter(ev => !searchQuery ||
        Object.values(ev).some(v => String(v).toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .sort((a, b) => {
        const aVal = a[sortKey] ?? "";
        const bVal = b[sortKey] ?? "";
        const cmp = String(aVal).localeCompare(String(bVal));
        return sortDir === "asc" ? cmp : -cmp;
      })
  );

  let ctSearchQuery = $state("");
  let ctSortKey = $state("name");
  let ctSortDir = $state<"asc" | "desc">("asc");

  const filteredContacts = $derived(
    contacts
      .filter(ct => !ctSearchQuery ||
        Object.values(ct).some(v => String(v).toLowerCase().includes(ctSearchQuery.toLowerCase()))
      )
      .sort((a, b) => {
        const aVal = a[ctSortKey] ?? "";
        const bVal = b[ctSortKey] ?? "";
        const cmp = String(aVal).localeCompare(String(bVal));
        return ctSortDir === "asc" ? cmp : -cmp;
      })
  );

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
    actionError = "";
    submitting = true;
    try {
      const result = await createHealthEvent({ name: evName, date: evDate, type: evType });
      events = [result, ...events];
      evName = '';
    } catch { 
      actionError = "Failed to create event. Please try again.";
    }
    submitting = false;
  }

  async function addContact() {
    if (!ctEventId || !ctName) return;
    actionError = "";
    submitting = true;
    try {
      const interests = ctInterests.split(',').map(s => s.trim()).filter(Boolean);
      const result = await createHealthContact({ eventId: ctEventId, name: ctName, phone: ctPhone, email: ctEmail, interests });
      contacts = [...contacts, result];
      ctName = ''; ctPhone = ''; ctEmail = ''; ctInterests = '';
    } catch { 
      actionError = "Failed to add contact. Please try again.";
    }
    submitting = false;
  }

  onMount(async () => {
    try {
      const [ev, ct] = await Promise.all([getHealthEvents(), getHealthContacts()]);
      events = Array.isArray(ev) ? ev : [];
      contacts = Array.isArray(ct) ? ct : [];
      if (events.length && !ctEventId) ctEventId = events[0]?.id;
    } catch { 
      loadError = "Failed to load. Please try again.";
    }
    loading = false;
  });
</script>

<svelte:head><title>Health Ministry — Theobase</title></svelte:head>

<div class="space-y-6">
  <h1 class="text-2xl font-bold text-slate-900">Health Ministry</h1>

  <div class="flex gap-2">
    <Button variant={tab === 'events' ? 'default' : 'ghost'} onclick={() => tab = 'events'}>Events</Button>
    <Button variant={tab === 'contacts' ? 'default' : 'ghost'} onclick={() => tab = 'contacts'}>Contacts</Button>
  </div>

  {#if loadError}
    <div class="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <p class="text-sm text-red-600">{loadError}</p>
      <button 
        class="mt-3 text-sm font-medium text-red-700 underline hover:text-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 rounded"
        onclick={() => { loadError = ""; onMount(async () => { try { const [ev, ct] = await Promise.all([getHealthEvents(), getHealthContacts()]); events = Array.isArray(ev) ? ev : []; contacts = Array.isArray(ct) ? ct : []; if (events.length && !ctEventId) ctEventId = events[0]?.id; } catch { loadError = "Failed to load. Please try again."; } loading = false; }); }}
      >
        Try again
      </button>
    </div>
  {:else if loading}
    <div class="space-y-3">
      <Skeleton class="h-8 w-32" />
      <Skeleton class="h-32" />
      <Skeleton class="h-16" />
    </div>
  {:else if tab === 'events'}
    <Card>
      <CardHeader>
        <CardTitle>New Event</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="space-y-2">
          <Label for="ev-name">Name</Label>
          <Input id="ev-name" bind:value={evName} placeholder="Spring Health Expo" />
        </div>
        <div class="space-y-2">
          <Label for="ev-date">Date</Label>
          <Input id="ev-date" type="date" bind:value={evDate} />
        </div>
        <div class="space-y-2">
          <Label for="ev-type">Type</Label>
          <Select bind:value={evType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="health_expo">Health Expo</SelectItem>
              <SelectItem value="cooking_school">Cooking School</SelectItem>
              <SelectItem value="screening">Screening</SelectItem>
              <SelectItem value="seminar">Seminar</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onclick={addEvent} disabled={!evName || submitting}>Create Event</Button>
        {#if actionError}
          <div class="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p class="text-sm text-red-600">{actionError}</p>
            <button class="mt-3 text-sm font-medium text-red-700 underline hover:text-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 rounded" onclick={() => { actionError = ""; }}>Dismiss</button>
          </div>
        {/if}
      </CardContent>
    </Card>

    {#if events.length === 0}
      <div class="flex flex-col items-center gap-3 rounded-lg border border-dashed border-slate-200 bg-white dark:bg-slate-900 py-12">
        <HeartPulse class="size-8 text-slate-300" />
        <p class="text-sm text-slate-500">No health events yet.</p>
        <Button variant="outline" size="sm" onclick={() => document.getElementById('ev-name')?.focus()}>Create your first event</Button>
      </div>
    {:else}
      <DataToolbar
        searchPlaceholder="Search events..."
        sortOptions={[{ label: "Date", key: "date" }, { label: "Name", key: "name" }]}
        sortKey={sortKey}
        sortDir={sortDir}
        onsearch={(q) => searchQuery = q}
        onsort={(k, d) => { sortKey = k; sortDir = d; }}
        resultCount={filteredEvents.length}
        totalCount={events.length}
      />
      {#each filteredEvents as ev}
        <div class="border rounded-lg bg-white dark:bg-slate-900 p-4">
          <div class="font-semibold text-slate-900">{ev.name}</div>
          <div class="text-sm text-slate-500">{formatDate(ev.date)} — {ev.type?.replace(/_/g, ' ')}</div>
        </div>
      {/each}
    {/if}
  {:else}
    <Card>
      <CardHeader>
        <CardTitle>Add Contact</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="space-y-2">
          <Label for="ct-event">Event</Label>
          <Select bind:value={ctEventId}>
            <SelectTrigger>
              <SelectValue placeholder="Select event..." />
            </SelectTrigger>
            <SelectContent>
              {#each events as ev}
                <SelectItem value={ev.id}>{ev.name} ({formatDate(ev.date)})</SelectItem>
              {/each}
            </SelectContent>
          </Select>
        </div>
        <div class="space-y-2">
          <Label for="ct-name">Name</Label>
          <Input id="ct-name" bind:value={ctName} placeholder="Jane Visitor" />
        </div>
        <div class="space-y-2">
          <Label for="ct-phone">Phone</Label>
          <Input id="ct-phone" type="tel" bind:value={ctPhone} placeholder="+679 1234567" />
        </div>
        <div class="space-y-2">
          <Label for="ct-email">Email</Label>
          <Input id="ct-email" type="email" bind:value={ctEmail} placeholder="jane@example.com" />
        </div>
        <div class="space-y-2">
          <Label for="ct-interests">Health Interests (comma-separated)</Label>
          <Input id="ct-interests" bind:value={ctInterests} placeholder="diabetes, hypertension" />
        </div>
        <Button onclick={addContact} disabled={!ctEventId || !ctName || submitting}>Add Contact</Button>
        {#if actionError}
          <div class="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p class="text-sm text-red-600">{actionError}</p>
            <button class="mt-3 text-sm font-medium text-red-700 underline hover:text-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 rounded" onclick={() => { actionError = ""; }}>Dismiss</button>
          </div>
        {/if}
      </CardContent>
    </Card>

    {#if contacts.length === 0}
      <div class="flex flex-col items-center gap-3 rounded-lg border border-dashed border-slate-200 bg-white dark:bg-slate-900 py-12">
        <HeartPulse class="size-8 text-slate-300" />
        <p class="text-sm text-slate-500">No health contacts yet.</p>
        <Button variant="outline" size="sm" onclick={() => document.getElementById('ct-name')?.focus()}>Add your first contact</Button>
      </div>
    {:else}
      <DataToolbar
        searchPlaceholder="Search contacts..."
        sortOptions={[{ label: "Name", key: "name" }]}
        sortKey={ctSortKey}
        sortDir={ctSortDir}
        onsearch={(q) => ctSearchQuery = q}
        onsort={(k, d) => { ctSortKey = k; ctSortDir = d; }}
        resultCount={filteredContacts.length}
        totalCount={contacts.length}
      />
      {#each filteredContacts as ct}
        <div class="border rounded-lg bg-white dark:bg-slate-900 p-4">
          <div class="font-semibold text-slate-900">{ct.name}</div>
          {#if ct.phone}<div class="text-sm text-slate-600">{ct.phone}</div>{/if}
          {#if ct.email}<div class="text-sm text-blue-700">{ct.email}</div>{/if}
          {#if ct.interests?.length}
            <div class="flex gap-1.5 mt-2 flex-wrap">
              {#each ct.interests as interest}
                <Badge variant="secondary" class="bg-blue-50 text-blue-800">{interest}</Badge>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    {/if}
  {/if}
</div>
