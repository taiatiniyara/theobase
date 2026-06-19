<script lang="ts">
  import { getHouseholds, createHousehold } from '$lib/api';
  import { onMount } from 'svelte';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import { Users, Plus } from '@lucide/svelte';
  import DataToolbar from "$lib/components/DataToolbar.svelte";

  let households = $state<any[]>([]);
  let loading = $state(true);
  let loadError = $state("");
  let actionError = $state("");
  let submitting = $state(false);

  let searchQuery = $state("");
  let sortKey = $state("name");
  let sortDir = $state<"asc" | "desc">("asc");

  const filteredHouseholds = $derived(
    households
      .filter(h => !searchQuery ||
        Object.values(h).some(v => String(v).toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .sort((a, b) => {
        const aVal = a[sortKey] ?? "";
        const bVal = b[sortKey] ?? "";
        const cmp = String(aVal).localeCompare(String(bVal));
        return sortDir === "asc" ? cmp : -cmp;
      })
  );

  let hhName = $state('');

  async function addHousehold() {
    if (!hhName.trim()) return;
    actionError = "";
    submitting = true;
    try {
      const result = await createHousehold({ name: hhName.trim() });
      households = [...households, result];
      hhName = '';
    } catch { 
      actionError = "Failed to add household. Please try again.";
    }
    submitting = false;
  }

  onMount(async () => {
    try { households = await getHouseholds(); } catch { 
      loadError = "Failed to load. Please try again.";
    }
    loading = false;
  });
</script>

<svelte:head><title>Households — Theobase</title></svelte:head>

<div class="space-y-6">
  <h1 class="text-2xl font-bold text-slate-900">Households</h1>

  <Card>
    <CardHeader>
      <CardTitle>Add Household</CardTitle>
      <CardDescription>Register a new household in your congregation</CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="space-y-2">
        <Label for="hh-name">Household Name</Label>
        <Input id="hh-name" bind:value={hhName} placeholder="Smith Family" />
      </div>
      <Button onclick={addHousehold} disabled={!hhName.trim() || submitting}>
        <Plus class="size-4" />
        Add Household
      </Button>
      {#if actionError}
        <div class="rounded-lg border border-red-200 bg-red-50 p-4 mt-2">
          <p class="text-sm text-red-600">{actionError}</p>
          <button class="mt-2 text-sm font-medium text-red-700 hover:text-red-800 underline" onclick={() => { actionError = ""; }}>Try again</button>
        </div>
      {/if}
    </CardContent>
  </Card>

  {#if loadError}
    <div class="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <p class="text-sm text-red-600">{loadError}</p>
      <button 
        class="mt-3 text-sm font-medium text-red-700 hover:text-red-800 underline"
        onclick={() => { loadError = ""; onMount(async () => { try { households = await getHouseholds(); } catch { loadError = "Failed to load. Please try again."; } loading = false; }); }}
      >
        Try again
      </button>
    </div>
  {:else if loading}
    <div class="space-y-4">
      <Skeleton class="h-20 w-full" />
      <Skeleton class="h-20 w-full" />
      <Skeleton class="h-20 w-full" />
    </div>
  {:else if households.length === 0}
    <div class="flex flex-col items-center gap-3 rounded-lg border border-dashed border-slate-200 bg-white dark:bg-slate-900 py-12">
      <Users class="size-8 text-slate-300" />
      <p class="text-sm text-slate-500">No households registered.</p>
      <Button variant="outline" size="sm" onclick={() => document.getElementById('hh-name')?.focus()}>Create your first household</Button>
    </div>
  {:else}
    <DataToolbar
      searchPlaceholder="Search households..."
      sortOptions={[{ label: "Name", key: "name" }]}
      sortKey={sortKey}
      sortDir={sortDir}
      onsearch={(q) => searchQuery = q}
      onsort={(k, d) => { sortKey = k; sortDir = d; }}
      resultCount={filteredHouseholds.length}
      totalCount={households.length}
    />
    {#each filteredHouseholds as h}
      <Card>
        <CardHeader>
          <CardTitle>{h.name}</CardTitle>
          <CardDescription>ID: {h.id?.slice(0, 8)}</CardDescription>
        </CardHeader>
      </Card>
    {/each}
  {/if}
</div>
