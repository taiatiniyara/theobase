<script lang="ts">
  import { getMe, getPathfinderProgress, createPathfinderProgress, getPathfinderHonors, createPathfinderHonor } from '$lib/api';
  import { onMount } from 'svelte';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Badge } from '$lib/components/ui/badge';
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import { Compass } from '@lucide/svelte';
  import { formatDate } from '$lib/format';
  import DataToolbar from "$lib/components/DataToolbar.svelte";

  let memberId = $state('');
  let progress = $state<any[]>([]);
  let honors = $state<any[]>([]);
  let loading = $state(false);
  let loaded = $state(false);
  let loadError = $state("");
  let actionError = $state("");
  let submitting = $state(false);
  let tab = $state<'progress' | 'honors'>('progress');

  let searchQuery = $state("");
  let sortKey = $state("className");
  let sortDir = $state<"asc" | "desc">("asc");

  const filteredProgress = $derived(
    progress
      .filter(p => !searchQuery ||
        Object.values(p).some(v => String(v).toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .sort((a, b) => {
        const aVal = a[sortKey] ?? "";
        const bVal = b[sortKey] ?? "";
        const cmp = String(aVal).localeCompare(String(bVal));
        return sortDir === "asc" ? cmp : -cmp;
      })
  );

  let hSearchQuery = $state("");
  let hSortKey = $state("name");
  let hSortDir = $state<"asc" | "desc">("asc");

  const filteredHonors = $derived(
    honors
      .filter(h => !hSearchQuery ||
        Object.values(h).some(v => String(v).toLowerCase().includes(hSearchQuery.toLowerCase()))
      )
      .sort((a, b) => {
        const aVal = a[hSortKey] ?? "";
        const bVal = b[hSortKey] ?? "";
        const cmp = String(aVal).localeCompare(String(bVal));
        return hSortDir === "asc" ? cmp : -cmp;
      })
  );

  let clsName = $state('friend');
  let clsStatus = $state('in_progress');
  let honorName = $state('');
  let honorCategory = $state('Health');
  let honorDate = $state(new Date().toISOString().slice(0, 10));

  const classRanks = ['friend', 'companion', 'explorer', 'ranger', 'guide'];
  const honorCategories = ['Health', 'Nature', 'Outdoor', 'Vocational', 'Arts', 'Household', 'Recreation'];

  async function loadData() {
    if (!memberId) return;
    loading = true;
    try {
      const [p, h] = await Promise.all([
        getPathfinderProgress(memberId),
        getPathfinderHonors(memberId),
      ]);
      progress = Array.isArray(p) ? p : [];
      honors = Array.isArray(h) ? h : [];
      loaded = true;
    } catch { 
      loadError = "Failed to load. Please try again.";
    }
    loading = false;
  }

  async function addProgress() {
    if (!memberId) return;
    actionError = "";
    submitting = true;
    try {
      const result = await createPathfinderProgress({ memberId, className: clsName, clubType: 'pathfinders', status: clsStatus });
      progress = [...progress, result];
    } catch { 
      actionError = "Failed to record progress. Please try again.";
    }
    submitting = false;
  }

  async function addHonor() {
    if (!memberId || !honorName) return;
    actionError = "";
    submitting = true;
    try {
      const result = await createPathfinderHonor({ memberId, name: honorName, category: honorCategory, earnedAt: honorDate });
      honors = [...honors, result];
      honorName = '';
    } catch { 
      actionError = "Failed to add honor. Please try again.";
    }
    submitting = false;
  }

  onMount(async () => {
    try {
      const me = await getMe();
      if (me?.personId) memberId = me.personId;
    } catch { 
      loadError = "Failed to load. Please try again.";
    }
  });
</script>

<svelte:head>
  <title>Pathfinders — Theobase</title>
</svelte:head>

<div class="space-y-6">
  <h1 class="text-2xl font-bold text-slate-900">Pathfinders</h1>

  <Card>
    <CardContent class="pt-6">
      <div class="flex gap-2">
        <Input bind:value={memberId} placeholder="person-1" class="flex-1" />
        <Button onclick={loadData}>Load Data</Button>
      </div>
    </CardContent>
  </Card>

  {#if loadError}
    <div class="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <p class="text-sm text-red-600">{loadError}</p>
      <button 
        class="mt-3 text-sm font-medium text-red-700 underline hover:text-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 rounded"
        onclick={() => { loadError = ""; loadData(); }}
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
  {:else if loaded}
    <div class="flex gap-2">
      <Button variant={tab === 'progress' ? 'default' : 'ghost'} onclick={() => tab = 'progress'}>Class Progress</Button>
      <Button variant={tab === 'honors' ? 'default' : 'ghost'} onclick={() => tab = 'honors'}>Honors</Button>
    </div>

    {#if tab === 'progress'}
      <Card>
        <CardHeader>
          <CardTitle>Record Progress</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <Label for="cls">Class</Label>
            <Select bind:value={clsName}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {#each classRanks as rank}
                  <SelectItem value={rank}>{rank.charAt(0).toUpperCase() + rank.slice(1)}</SelectItem>
                {/each}
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <Label for="status">Status</Label>
            <Select bind:value={clsStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="invested">Invested</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onclick={addProgress} disabled={submitting}>Record Progress</Button>
          {#if actionError}
            <div class="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
              <p class="text-sm text-red-600">{actionError}</p>
              <button class="mt-3 text-sm font-medium text-red-700 underline hover:text-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 rounded" onclick={() => { actionError = ""; }}>Dismiss</button>
            </div>
          {/if}
        </CardContent>
      </Card>

      {#if progress.length === 0}
        <div class="flex flex-col items-center gap-3 rounded-lg border border-dashed border-slate-200 bg-white dark:bg-slate-900 py-12">
          <Compass class="size-8 text-slate-300" />
          <p class="text-sm text-slate-500">No class progress recorded.</p>
          <Button variant="outline" size="sm" onclick={() => document.querySelector('button:has([value])')?.click()}>Record your first progress</Button>
        </div>
      {:else}
        <DataToolbar
          searchPlaceholder="Search progress..."
          sortOptions={[{ label: "Class", key: "className" }, { label: "Status", key: "status" }]}
          sortKey={sortKey}
          sortDir={sortDir}
          onsearch={(q) => searchQuery = q}
          onsort={(k, d) => { sortKey = k; sortDir = d; }}
          resultCount={filteredProgress.length}
          totalCount={progress.length}
        />
        {#each filteredProgress as p}
          <div class="border rounded-lg bg-white dark:bg-slate-900 p-4">
            <div class="flex items-center justify-between">
              <div class="capitalize font-semibold text-slate-900">{p.className} — {p.clubType}</div>
              <Badge variant="secondary" class={p.status === 'completed' || p.status === 'invested' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                {p.status?.replace(/_/g, ' ')}
              </Badge>
            </div>
          </div>
        {/each}
      {/if}
    {:else}
      <Card>
        <CardHeader>
          <CardTitle>Add Honor</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <Label for="honor-name">Name</Label>
            <Input id="honor-name" bind:value={honorName} placeholder="First Aid" />
          </div>
          <div class="space-y-2">
            <Label for="honor-category">Category</Label>
            <Select bind:value={honorCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {#each honorCategories as cat}
                  <SelectItem value={cat}>{cat}</SelectItem>
                {/each}
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <Label for="honor-date">Date Earned</Label>
            <Input id="honor-date" type="date" bind:value={honorDate} />
          </div>
          <Button onclick={addHonor} disabled={!honorName || submitting}>Add Honor</Button>
          {#if actionError}
            <div class="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
              <p class="text-sm text-red-600">{actionError}</p>
              <button class="mt-3 text-sm font-medium text-red-700 underline hover:text-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 rounded" onclick={() => { actionError = ""; }}>Dismiss</button>
            </div>
          {/if}
        </CardContent>
      </Card>

      {#if honors.length === 0}
        <div class="flex flex-col items-center gap-3 rounded-lg border border-dashed border-slate-200 bg-white dark:bg-slate-900 py-12">
          <Compass class="size-8 text-slate-300" />
          <p class="text-sm text-slate-500">No honors earned yet.</p>
          <Button variant="outline" size="sm" onclick={() => document.getElementById('honor-name')?.focus()}>Add your first honor</Button>
        </div>
      {:else}
        <DataToolbar
          searchPlaceholder="Search honors..."
          sortOptions={[{ label: "Name", key: "name" }, { label: "Category", key: "category" }]}
          sortKey={hSortKey}
          sortDir={hSortDir}
          onsearch={(q) => hSearchQuery = q}
          onsort={(k, d) => { hSortKey = k; hSortDir = d; }}
          resultCount={filteredHonors.length}
          totalCount={honors.length}
        />
        {#each filteredHonors as h}
          <div class="border rounded-lg bg-white dark:bg-slate-900 p-4">
            <div class="flex justify-between">
              <div>
                <div class="font-semibold text-slate-900">{h.name}</div>
                <div class="text-sm text-slate-500">{h.category} — {formatDate(h.earnedAt)}</div>
              </div>
            </div>
          </div>
        {/each}
      {/if}
    {/if}
  {/if}
</div>
