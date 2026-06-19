<script lang="ts">
  import { getWelfareCases, createWelfareCase, getPantryItems, createPantryItem } from '$lib/api';
  import { onMount } from 'svelte';
  import AmountField from '$lib/components/AmountField.svelte';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import { HeartHandshake } from '@lucide/svelte';
  import DataToolbar from "$lib/components/DataToolbar.svelte";

  let cases = $state<any[]>([]);
  let pantry = $state<any[]>([]);
  let loading = $state(true);
  let loadError = $state("");
  let actionError = $state("");
  let submitting = $state(false);
  let tab = $state<'cases' | 'pantry'>('cases');

  let searchQuery = $state("");
  let sortKey = $state("personId");
  let sortDir = $state<"asc" | "desc">("asc");

  const filteredCases = $derived(
    cases
      .filter(c => !searchQuery ||
        Object.values(c).some(v => String(v).toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .sort((a, b) => {
        const aVal = a[sortKey] ?? "";
        const bVal = b[sortKey] ?? "";
        const cmp = String(aVal).localeCompare(String(bVal));
        return sortDir === "asc" ? cmp : -cmp;
      })
  );

  let ptSearchQuery = $state("");
  let ptSortKey = $state("name");
  let ptSortDir = $state<"asc" | "desc">("asc");

  const filteredPantry = $derived(
    pantry
      .filter(item => !ptSearchQuery ||
        Object.values(item).some(v => String(v).toLowerCase().includes(ptSearchQuery.toLowerCase()))
      )
      .sort((a, b) => {
        const aVal = a[ptSortKey] ?? "";
        const bVal = b[ptSortKey] ?? "";
        const cmp = String(aVal).localeCompare(String(bVal));
        return ptSortDir === "asc" ? cmp : -cmp;
      })
  );

  let casePersonId = $state('');
  let caseType = $state('food');
  let caseDesc = $state('');
  let caseValue = $state(0);

  let itemName = $state('');
  let itemQty = $state(0);
  let itemUnit = $state('kg');

  async function addCase() {
    if (!casePersonId || !caseDesc) return;
    actionError = "";
    submitting = true;
    try {
      const result = await createWelfareCase({ personId: casePersonId, assistanceType: caseType, description: caseDesc, value: caseValue });
      cases = [result, ...cases];
      caseDesc = ''; caseValue = 0;
    } catch { 
      actionError = "Failed to record case. Please try again.";
    }
    submitting = false;
  }

  async function addPantryItem() {
    if (!itemName || !itemQty) return;
    actionError = "";
    submitting = true;
    try {
      const result = await createPantryItem({ name: itemName, quantity: itemQty, unit: itemUnit });
      pantry = [...pantry, result];
      itemName = ''; itemQty = 0;
    } catch { 
      actionError = "Failed to add pantry item. Please try again.";
    }
    submitting = false;
  }

  onMount(async () => {
    try {
      const [c, p] = await Promise.all([getWelfareCases(), getPantryItems()]);
      cases = Array.isArray(c) ? c : [];
      pantry = Array.isArray(p) ? p : [];
    } catch { 
      loadError = "Failed to load. Please try again.";
    }
    loading = false;
  });
</script>

<svelte:head>
  <title>Welfare — Theobase</title>
</svelte:head>

<div class="space-y-6">
  <h1 class="text-2xl font-bold text-slate-900">Community Welfare</h1>

  <div class="flex gap-2">
    <Button variant={tab === 'cases' ? 'default' : 'ghost'} onclick={() => tab = 'cases'}>Cases</Button>
    <Button variant={tab === 'pantry' ? 'default' : 'ghost'} onclick={() => tab = 'pantry'}>Pantry</Button>
  </div>

  {#if loadError}
    <div class="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <p class="text-sm text-red-600">{loadError}</p>
      <button 
        class="mt-3 text-sm font-medium text-red-700 underline hover:text-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 rounded"
        onclick={() => { loadError = ""; onMount(async () => { try { const [c, p] = await Promise.all([getWelfareCases(), getPantryItems()]); cases = Array.isArray(c) ? c : []; pantry = Array.isArray(p) ? p : []; } catch { loadError = "Failed to load. Please try again."; } loading = false; }); }}
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
  {:else if tab === 'cases'}
    <Card>
      <CardHeader>
        <CardTitle>New Case</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="space-y-2">
          <Label for="case-person">Person ID</Label>
          <Input id="case-person" bind:value={casePersonId} placeholder="person-1" />
        </div>

        <div class="space-y-2">
          <Label for="case-type">Type</Label>
          <Select bind:value={caseType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="food">Food</SelectItem>
              <SelectItem value="financial">Financial</SelectItem>
              <SelectItem value="clothing">Clothing</SelectItem>
              <SelectItem value="shelter">Shelter</SelectItem>
              <SelectItem value="medical">Medical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <Label for="case-desc">Description</Label>
          <Input id="case-desc" bind:value={caseDesc} placeholder="Emergency food parcel" />
        </div>

        <AmountField cents={caseValue} onchange={(c) => caseValue = c} />

        <Button onclick={addCase} disabled={!casePersonId || !caseDesc || submitting}>Record Case</Button>
        {#if actionError}
          <div class="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p class="text-sm text-red-600">{actionError}</p>
            <button class="mt-3 text-sm font-medium text-red-700 underline hover:text-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 rounded" onclick={() => { actionError = ""; }}>Dismiss</button>
          </div>
        {/if}
      </CardContent>
    </Card>

    {#if cases.length === 0}
      <div class="flex flex-col items-center gap-3 rounded-lg border border-dashed border-slate-200 bg-white dark:bg-slate-900 py-12">
        <HeartHandshake class="size-8 text-slate-300" />
        <p class="text-sm text-slate-500">No welfare cases yet.</p>
        <Button variant="outline" size="sm" onclick={() => document.getElementById('case-person')?.focus()}>Record your first case</Button>
      </div>
    {:else}
      <DataToolbar
        searchPlaceholder="Search cases..."
        sortOptions={[{ label: "Person ID", key: "personId" }, { label: "Type", key: "assistanceType" }]}
        sortKey={sortKey}
        sortDir={sortDir}
        onsearch={(q) => searchQuery = q}
        onsort={(k, d) => { sortKey = k; sortDir = d; }}
        resultCount={filteredCases.length}
        totalCount={cases.length}
      />
      {#each filteredCases as c}
        <div class="border rounded-lg bg-white dark:bg-slate-900 p-4">
          <div class="flex justify-between">
            <div>
              <div class="font-semibold text-slate-900 dark:text-slate-100 capitalize">{c.assistanceType}</div>
              <div class="text-sm text-slate-500">{c.description}</div>
            </div>
            <div class="font-semibold text-slate-900">${(c.value / 100).toFixed(2)}</div>
          </div>
        </div>
      {/each}
    {/if}
  {:else}
    <Card>
      <CardHeader>
        <CardTitle>Add Item</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="space-y-2">
          <Label for="item-name">Name</Label>
          <Input id="item-name" bind:value={itemName} placeholder="Rice" />
        </div>
        <div class="flex gap-2">
          <div class="space-y-2 flex-1">
            <Label for="item-qty">Quantity</Label>
            <Input id="item-qty" type="number" bind:value={itemQty} placeholder="100" />
          </div>
          <div class="space-y-2 flex-1">
            <Label for="item-unit">Unit</Label>
            <Select bind:value={itemUnit}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">kg</SelectItem>
                <SelectItem value="pieces">pieces</SelectItem>
                <SelectItem value="litres">litres</SelectItem>
                <SelectItem value="packets">packets</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onclick={addPantryItem} disabled={!itemName || !itemQty || submitting}>Add Item</Button>
        {#if actionError}
          <div class="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p class="text-sm text-red-600">{actionError}</p>
            <button class="mt-3 text-sm font-medium text-red-700 underline hover:text-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 rounded" onclick={() => { actionError = ""; }}>Dismiss</button>
          </div>
        {/if}
      </CardContent>
    </Card>

    {#if pantry.length === 0}
      <div class="flex flex-col items-center gap-3 rounded-lg border border-dashed border-slate-200 bg-white dark:bg-slate-900 py-12">
        <HeartHandshake class="size-8 text-slate-300" />
        <p class="text-sm text-slate-500">No pantry items yet.</p>
        <Button variant="outline" size="sm" onclick={() => document.getElementById('item-name')?.focus()}>Add your first item</Button>
      </div>
    {:else}
      <DataToolbar
        searchPlaceholder="Search pantry..."
        sortOptions={[{ label: "Name", key: "name" }]}
        sortKey={ptSortKey}
        sortDir={ptSortDir}
        onsearch={(q) => ptSearchQuery = q}
        onsort={(k, d) => { ptSortKey = k; ptSortDir = d; }}
        resultCount={filteredPantry.length}
        totalCount={pantry.length}
      />
      {#each filteredPantry as item}
        <div class="border rounded-lg bg-white dark:bg-slate-900 p-4">
          <div class="flex justify-between">
            <div class="font-semibold text-slate-900">{item.name}</div>
            <div class="text-slate-500">{item.quantity} {item.unit}</div>
          </div>
        </div>
      {/each}
    {/if}
  {/if}
</div>
