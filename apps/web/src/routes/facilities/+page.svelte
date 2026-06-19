<script lang="ts">
  import { getFacilityBookings, createFacilityBooking } from '$lib/api';
  import { onMount } from 'svelte';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import { Building } from '@lucide/svelte';
  import { formatDate } from '$lib/format';
  import DataToolbar from "$lib/components/DataToolbar.svelte";

  let bookings = $state<any[]>([]);
  let loading = $state(true);
  let loadError = $state("");
  let actionError = $state("");
  let submitting = $state(false);

  let searchQuery = $state("");
  let sortKey = $state("date");
  let sortDir = $state<"asc" | "desc">("desc");

  const filteredBookings = $derived(
    bookings
      .filter(b => !searchQuery ||
        Object.values(b).some(v => String(v).toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .sort((a, b) => {
        const aVal = a[sortKey] ?? "";
        const bVal = b[sortKey] ?? "";
        const cmp = String(aVal).localeCompare(String(bVal));
        return sortDir === "asc" ? cmp : -cmp;
      })
  );

  let bkDate = $state('');
  let bkStart = $state('');
  let bkEnd = $state('');
  let bkPurpose = $state('');
  let booked = $state(false);

  onMount(async () => {
    try { bookings = await getFacilityBookings(); } catch { 
      loadError = "Failed to load. Please try again.";
    }
    loading = false;
  });

  async function book() {
    if (!bkDate || !bkStart || !bkEnd || !bkPurpose) return;
    actionError = "";
    submitting = true;
    try {
      const result = await createFacilityBooking({ date: bkDate, timeStart: bkStart, timeEnd: bkEnd, purpose: bkPurpose });
      bookings = [...bookings, result];
      booked = true;
      bkPurpose = '';
    } catch { 
      actionError = "Failed to book facility. Please try again.";
    }
    submitting = false;
  }
</script>

<svelte:head><title>Facilities — Theobase</title></svelte:head>

<div class="space-y-6">
  <h1 class="text-2xl font-bold text-slate-900">Facilities</h1>

  <Card>
    <CardHeader>
      <CardTitle>Book Facility</CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="space-y-2">
        <Label for="bk-date">Date</Label>
        <Input id="bk-date" type="date" bind:value={bkDate} />
      </div>
      <div class="flex gap-2">
        <div class="space-y-2 flex-1">
          <Label for="bk-start">Start Time</Label>
          <Input id="bk-start" type="time" bind:value={bkStart} />
        </div>
        <div class="space-y-2 flex-1">
          <Label for="bk-end">End Time</Label>
          <Input id="bk-end" type="time" bind:value={bkEnd} />
        </div>
      </div>
      <div class="space-y-2">
        <Label for="bk-purpose">Purpose</Label>
        <Input id="bk-purpose" bind:value={bkPurpose} placeholder="Wedding reception" />
      </div>
      <Button onclick={book} disabled={!bkDate || !bkStart || !bkEnd || !bkPurpose || submitting}>Book Facility</Button>
      {#if actionError}
        <div class="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p class="text-sm text-red-600">{actionError}</p>
          <button class="mt-3 text-sm font-medium text-red-700 underline hover:text-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 rounded" onclick={() => { actionError = ""; }}>Dismiss</button>
        </div>
      {/if}
      {#if booked}
        <div class="rounded-lg bg-green-50 p-4 text-sm text-green-800">Facility booked for {bkDate}.</div>
      {/if}
    </CardContent>
  </Card>

  <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mt-6">Bookings</h2>
  {#if loadError}
    <div class="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <p class="text-sm text-red-600">{loadError}</p>
      <button 
        class="mt-3 text-sm font-medium text-red-700 underline hover:text-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 rounded"
        onclick={() => { loadError = ""; onMount(async () => { try { bookings = await getFacilityBookings(); } catch { loadError = "Failed to load. Please try again."; } loading = false; }); }}
      >
        Try again
      </button>
    </div>
  {:else if loading}
    <div class="space-y-3">
      <Skeleton class="h-16" />
      <Skeleton class="h-16" />
    </div>
  {:else if bookings.length === 0}
    <div class="flex flex-col items-center gap-3 rounded-lg border border-dashed border-slate-200 bg-white dark:bg-slate-900 py-12">
      <Building class="size-8 text-slate-300" />
      <p class="text-sm text-slate-500">No bookings yet.</p>
      <Button variant="outline" size="sm" onclick={() => document.getElementById('bk-date')?.focus()}>Book your first one</Button>
    </div>
  {:else}
    <DataToolbar
      searchPlaceholder="Search bookings..."
      sortOptions={[{ label: "Date", key: "date" }, { label: "Purpose", key: "purpose" }]}
      sortKey={sortKey}
      sortDir={sortDir}
      onsearch={(q) => searchQuery = q}
      onsort={(k, d) => { sortKey = k; sortDir = d; }}
      resultCount={filteredBookings.length}
      totalCount={bookings.length}
    />
    {#each filteredBookings as b}
      <div class="border rounded-lg bg-white dark:bg-slate-900 p-4">
        <div class="flex items-center justify-between">
          <div>
            <div class="font-semibold text-slate-900">{formatDate(b.date)}</div>
            <div class="text-sm text-slate-500">{b.timeStart} – {b.timeEnd} &middot; {b.purpose}</div>
          </div>
        </div>
      </div>
    {/each}
  {/if}
</div>
