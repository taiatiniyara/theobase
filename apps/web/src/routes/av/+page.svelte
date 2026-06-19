<script lang="ts">
  import { getOrderOfService, updateOrderOfService } from '$lib/api';
  import { requireRole } from "$lib/guard";
  import { onMount } from 'svelte';
  import { toast } from '$lib/toast';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import { MonitorPlay, X } from '@lucide/svelte';
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';

  let date = $state(new Date().toISOString().slice(0, 10));
  let items = $state<any[]>([]);
  let loaded = $state(false);
  let loadError = $state("");
  let saving = $state(false);
  let deleteIndex = $state<number | null>(null);

  let newType = $state('hymn');
  let newTitle = $state('');

  const itemTypes = ['hymn', 'scripture', 'prayer', 'sermon', 'announcement', 'offering', 'special_music', 'benediction'];

  async function load(dateStr: string) {
    loaded = false;
    loadError = "";
    try {
      const data = await getOrderOfService(dateStr);
      if (data?.items) items = data.items;
      else items = [];
    } catch { loadError = "Failed to load order of service."; }
    loaded = true;
  }

  async function addItem() {
    if (!newTitle || saving) return;
    items = [...items, { type: newType, title: newTitle }];
    newTitle = '';
    await save(items);
  }

  function removeItem(i: number) {
    deleteIndex = i;
  }

  async function confirmRemove() {
    if (deleteIndex !== null) {
      items = items.filter((_, j) => j !== deleteIndex);
      await save(items);
      deleteIndex = null;
    }
  }

  async function save(current: any[]) {
    saving = true;
    try {
      await updateOrderOfService({ date, items: current });
    } catch { toast.error("Failed to save."); items = []; await load(date); }
    saving = false;
  }

  onMount(async () => {
    const authorized = await requireRole("clerk", "av_operator", "elder");
    if (!authorized) return;
    load(date);
  });
</script>

<svelte:head><title>AV Sync — Theobase</title></svelte:head>

<div class="space-y-6">
  <h1 class="text-2xl font-bold text-slate-900">AV — Order of Service</h1>

  <div class="flex gap-2 items-end">
    <Input type="date" bind:value={date} onchange={() => load(date)} class="w-full max-w-xs" />
  </div>

  <Card>
    <CardHeader>
      <CardTitle>Add Item</CardTitle>
    </CardHeader>
    <CardContent>
      <div class="flex gap-2 items-end">
        <div class="w-36">
          <Select bind:value={newType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {#each itemTypes as t}
                <SelectItem value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>
              {/each}
            </SelectContent>
          </Select>
        </div>
        <div class="flex-1">
          <Input bind:value={newTitle} placeholder="Amazing Grace" />
        </div>
        <Button onclick={addItem} disabled={!newTitle || saving}>+ Add</Button>
      </div>
    </CardContent>
  </Card>

  {#if loadError}
    <div class="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <p class="text-sm text-red-600">{loadError}</p>
      <button class="mt-3 text-sm font-medium text-red-700 underline" onclick={() => load(date)}>Try again</button>
    </div>
  {:else if loaded}
    {#if items.length === 0}
      <div class="flex flex-col items-center gap-3 rounded-lg border border-dashed border-slate-200 bg-white dark:bg-slate-900 py-12">
        <MonitorPlay class="size-8 text-slate-300" />
        <p class="text-sm text-slate-500">No order of service for this date.</p>
        <Button variant="outline" size="sm" onclick={() => document.querySelector('[placeholder="Amazing Grace"]')?.focus()}>Add your first item</Button>
      </div>
    {:else}
      {#each items as item, i}
        <div class="border rounded-lg bg-white dark:bg-slate-900 p-4">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-xs text-slate-500 dark:text-slate-400 uppercase">{item.type?.replace(/_/g, ' ')}</div>
              <div class="font-semibold text-slate-900">{item.title}</div>
            </div>
            <Button variant="destructive" size="icon" class="size-7" onclick={() => removeItem(i)} disabled={saving} aria-label="Remove item"><X class="size-4" /></Button>
          </div>
        </div>
      {/each}
    {/if}
  {:else}
    <div class="space-y-3">
      <Skeleton class="h-16" />
      <Skeleton class="h-16" />
    </div>
  {/if}

  <ConfirmDialog
    open={deleteIndex !== null}
    onOpenChange={(o) => { if (!o) deleteIndex = null; }}
    title="Remove item"
    description="Remove this item from the order of service?"
    confirmLabel="Remove"
    variant="destructive"
    onconfirm={confirmRemove}
  />
</div>
