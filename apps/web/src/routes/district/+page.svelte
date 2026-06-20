<script lang="ts">
  import { getDistrictRotations, createDistrictRotation, createDistrictVisit, getDistrictVisits } from '$lib/api';
  import { requireRole } from "$lib/guard";
  import { onMount } from 'svelte';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import { Building2 } from '@lucide/svelte';
  import { formatDate } from '$lib/format';
  import DataToolbar from "$lib/components/DataToolbar.svelte";

  let rotations = $state<any[]>([]);
  let visits = $state<any[]>([]);
  let loading = $state(true);
  let loadError = $state("");
  let actionError = $state("");
  let submitting = $state(false);
  let tab = $state<'rotations' | 'visits'>('rotations');

  let searchQuery = $state("");
  let sortKey = $state("date");
  let sortDir = $state<"asc" | "desc">("desc");

  const filteredRotations = $derived(
    rotations
      .filter(r => !searchQuery ||
        Object.values(r).some(v => String(v).toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .sort((a, b) => {
        const aVal = a[sortKey] ?? "";
        const bVal = b[sortKey] ?? "";
        const cmp = String(aVal).localeCompare(String(bVal));
        return sortDir === "asc" ? cmp : -cmp;
      })
  );

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
    actionError = "";
    submitting = true;
    try {
      const result = await createDistrictRotation({
        congregationId: rotCongId, date: rotDate, preacherId: rotPreacher, topic: rotTopic,
      });
      rotations = [...rotations, result];
      rotTopic = '';
    } catch { 
      actionError = "Failed to schedule rotation. Please try again.";
    }
    submitting = false;
  }

  async function addVisit() {
    if (!visHousehold || !visDate) return;
    actionError = "";
    submitting = true;
    try {
      await createDistrictVisit({
        householdId: visHousehold, pastorId: visPastor, date: visDate,
        purpose: visPurpose, notes: visNotes,
      });
      visHousehold = ''; visPurpose = ''; visNotes = '';
    } catch { 
      actionError = "Failed to record visit. Please try again.";
    }
    submitting = false;
  }

  onMount(async () => {
    const authorized = await requireRole("clerk", "district_pastor");
    if (!authorized) return;
    try { rotations = await getDistrictRotations(); } catch { 
      loadError = "Failed to load. Please try again.";
    }
    try { visits = await getDistrictVisits(); } catch { visits = []; }
    loading = false;
  });
</script>

<svelte:head><title>District Hub — Theobase</title></svelte:head>

<div class="space-y-6">
  <h1 class="text-2xl font-bold text-slate-900">District Hub</h1>

  <div class="flex gap-2">
    <Button variant={tab === 'rotations' ? 'default' : 'ghost'} onclick={() => tab = 'rotations'}>Preaching Rotations</Button>
    <Button variant={tab === 'visits' ? 'default' : 'ghost'} onclick={() => tab = 'visits'}>Pastoral Visits</Button>
  </div>

  {#if loadError}
    <div class="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <p class="text-sm text-red-600">{loadError}</p>
      <button 
        class="mt-3 text-sm font-medium text-red-700 underline hover:text-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 rounded"
        onclick={() => { loadError = ""; onMount(async () => { try { rotations = await getDistrictRotations(); } catch { loadError = "Failed to load. Please try again."; } loading = false; }); }}
      >
        Try again
      </button>
    </div>
  {:else if loading}
    <div class="space-y-3">
      <Skeleton class="h-8 w-40" />
      <Skeleton class="h-20" />
      <Skeleton class="h-20" />
    </div>
  {:else if tab === 'rotations'}
    <Card>
      <CardHeader>
        <CardTitle>Schedule Preaching</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="space-y-2">
          <Label for="rot-cong">Congregation ID</Label>
          <Input id="rot-cong" bind:value={rotCongId} placeholder="con-1" />
        </div>
        <div class="space-y-2">
          <Label for="rot-date">Date</Label>
          <Input id="rot-date" type="date" bind:value={rotDate} />
        </div>
        <div class="space-y-2">
          <Label for="rot-preacher">Preacher ID</Label>
          <Input id="rot-preacher" bind:value={rotPreacher} placeholder="pastor-1" />
        </div>
        <div class="space-y-2">
          <Label for="rot-topic">Topic</Label>
          <Input id="rot-topic" bind:value={rotTopic} placeholder="Faith" />
        </div>
        <Button onclick={addRotation} disabled={!rotCongId || !rotDate || !rotPreacher || submitting}>Schedule</Button>
        {#if actionError}
          <div class="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p class="text-sm text-red-600">{actionError}</p>
            <button class="mt-3 text-sm font-medium text-red-700 underline hover:text-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 rounded" onclick={() => { actionError = ""; }}>Dismiss</button>
          </div>
        {/if}
      </CardContent>
    </Card>

    {#if rotations.length === 0}
      <div class="flex flex-col items-center gap-3 rounded-lg border border-dashed border-slate-200 bg-white dark:bg-slate-900 py-12">
        <Building2 class="size-8 text-slate-300" />
        <p class="text-sm text-slate-500">No preaching rotations scheduled.</p>
        <Button variant="outline" size="sm" onclick={() => document.getElementById('rot-cong')?.focus()}>Schedule your first rotation</Button>
      </div>
    {:else}
      <DataToolbar
        searchPlaceholder="Search rotations..."
        sortOptions={[{ label: "Date", key: "date" }, { label: "Congregation", key: "congregationId" }]}
        sortKey={sortKey}
        sortDir={sortDir}
        onsearch={(q) => searchQuery = q}
        onsort={(k, d) => { sortKey = k; sortDir = d; }}
        resultCount={filteredRotations.length}
        totalCount={rotations.length}
      />
      {#each filteredRotations as r}
        <div class="border rounded-lg bg-white dark:bg-slate-900 p-4">
          <div class="font-semibold text-slate-900">{formatDate(r.date)} — {r.topic || 'TBD'}</div>
          <div class="text-sm text-slate-500">Preacher: {r.preacherId} | Church: {r.congregationId}</div>
        </div>
      {/each}
    {/if}
  {:else}
    <Card>
      <CardHeader>
        <CardTitle>Record Visit</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="space-y-2">
          <Label for="vis-household">Household ID</Label>
          <Input id="vis-household" bind:value={visHousehold} placeholder="household-1" />
        </div>
        <div class="space-y-2">
          <Label for="vis-pastor">Pastor ID</Label>
          <Input id="vis-pastor" bind:value={visPastor} placeholder="pastor-1" />
        </div>
        <div class="space-y-2">
          <Label for="vis-date">Date</Label>
          <Input id="vis-date" type="date" bind:value={visDate} />
        </div>
        <div class="space-y-2">
          <Label for="vis-purpose">Purpose</Label>
          <Input id="vis-purpose" bind:value={visPurpose} placeholder="Pastoral visit" />
        </div>
        <div class="space-y-2">
          <Label for="vis-notes">Notes</Label>
          <Textarea id="vis-notes" bind:value={visNotes} placeholder="Visit notes..." />
        </div>
        <Button onclick={addVisit} disabled={!visHousehold || !visDate || submitting}>Record Visit</Button>
        {#if actionError}
          <div class="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p class="text-sm text-red-600">{actionError}</p>
            <button class="mt-3 text-sm font-medium text-red-700 underline hover:text-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 rounded" onclick={() => { actionError = ""; }}>Dismiss</button>
          </div>
        {/if}
      </CardContent>
    </Card>

    {#if visits.length > 0}
      <div class="space-y-2">
        <h3 class="text-sm font-medium text-slate-500">Recent Visits</h3>
        {#each visits as v (v.id)}
          <div class="rounded border px-3 py-2 text-sm">
            <p><strong>{v.date}</strong> — {v.purpose || 'Pastoral visit'}</p>
            {#if v.notes}<p class="text-xs text-slate-500 mt-1">{v.notes}</p>{/if}
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</div>
