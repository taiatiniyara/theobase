<script lang="ts">
  import { getCrisisAssets, createCrisisAsset } from '$lib/api';
  import { onMount } from 'svelte';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Badge } from '$lib/components/ui/badge';
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import { AlertTriangle } from '@lucide/svelte';
  import DataToolbar from "$lib/components/DataToolbar.svelte";

  let assets = $state<any[]>([]);
  let loading = $state(true);
  let loadError = $state("");
  let actionError = $state("");
  let submitting = $state(false);

  let searchQuery = $state("");
  let sortKey = $state("type");
  let sortDir = $state<"asc" | "desc">("asc");

  const filteredAssets = $derived(
    assets
      .filter(a => !searchQuery ||
        Object.values(a).some(v => String(v).toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .sort((a, b) => {
        const aVal = a[sortKey] ?? "";
        const bVal = b[sortKey] ?? "";
        const cmp = String(aVal).localeCompare(String(bVal));
        return sortDir === "asc" ? cmp : -cmp;
      })
  );

  let asType = $state('generator');
  let asDesc = $state('');
  let asStatus = $state('operational');

  const assetTypes = ['generator', 'water_storage', 'shelter', 'first_aid', 'communications', 'food_storage', 'transport'];

  async function addAsset() {
    if (!asDesc) return;
    actionError = "";
    submitting = true;
    try {
      const result = await createCrisisAsset({ type: asType, description: asDesc, status: asStatus });
      assets = [...assets, result];
      asDesc = '';
    } catch { 
      actionError = "Failed to register asset. Please try again.";
    }
    submitting = false;
  }

  onMount(async () => {
    try { assets = await getCrisisAssets(); } catch { 
      loadError = "Failed to load. Please try again.";
    }
    loading = false;
  });
</script>

<svelte:head><title>Crisis Resilience — Theobase</title></svelte:head>

<div class="space-y-6">
  <h1 class="text-2xl font-bold text-slate-900">Crisis Resilience</h1>

  <Card>
    <CardHeader>
      <CardTitle>Register Asset</CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="space-y-2">
        <Label for="as-type">Type</Label>
        <Select bind:value={asType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {#each assetTypes as t}
              <SelectItem value={t}>{t.replace(/_/g, ' ')}</SelectItem>
            {/each}
          </SelectContent>
        </Select>
      </div>
      <div class="space-y-2">
        <Label for="as-desc">Description</Label>
        <Input id="as-desc" bind:value={asDesc} placeholder="Honda 5kW" />
      </div>
      <div class="space-y-2">
        <Label for="as-status">Status</Label>
        <Select bind:value={asStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="operational">Operational</SelectItem>
            <SelectItem value="maintenance">Needs Maintenance</SelectItem>
            <SelectItem value="deployed">Deployed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button onclick={addAsset} disabled={!asDesc || submitting}>Register Asset</Button>
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
        onclick={() => { loadError = ""; onMount(async () => { try { assets = await getCrisisAssets(); } catch { loadError = "Failed to load. Please try again."; } loading = false; }); }}
      >
        Try again
      </button>
    </div>
  {:else if loading}
    <div class="space-y-3">
      <Skeleton class="h-16" />
      <Skeleton class="h-16" />
    </div>
  {:else if assets.length === 0}
    <div class="flex flex-col items-center gap-3 rounded-lg border border-dashed border-slate-200 bg-white dark:bg-slate-900 py-12">
      <AlertTriangle class="size-8 text-slate-300" />
      <p class="text-sm text-slate-500">No crisis assets registered.</p>
      <Button variant="outline" size="sm" onclick={() => document.getElementById('as-desc')?.focus()}>Register your first asset</Button>
    </div>
  {:else}
    <DataToolbar
      searchPlaceholder="Search assets..."
      sortOptions={[{ label: "Type", key: "type" }, { label: "Status", key: "status" }]}
      sortKey={sortKey}
      sortDir={sortDir}
      onsearch={(q) => searchQuery = q}
      onsort={(k, d) => { sortKey = k; sortDir = d; }}
      resultCount={filteredAssets.length}
      totalCount={assets.length}
    />
    {#each filteredAssets as a}
      <div class="border rounded-lg bg-white dark:bg-slate-900 p-4">
        <div class="flex justify-between">
          <div>
            <div class="font-semibold text-slate-900">{a.description}</div>
            <div class="text-sm text-slate-500 dark:text-slate-400 capitalize">{a.type?.replace(/_/g, ' ')}</div>
          </div>
          <Badge variant="secondary" class={a.status === 'operational' ? 'bg-green-100 text-green-700' : a.status === 'maintenance' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}>
            {a.status}
          </Badge>
        </div>
      </div>
    {/each}
  {/if}
</div>
