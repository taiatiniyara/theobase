<script lang="ts">
  import { getCommunionServices, createCommunion } from '$lib/api';
  import { requireRole } from "$lib/guard";
  import { onMount } from 'svelte';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import { toast } from "$lib/toast";
  import { Wine, X } from '@lucide/svelte';
  import { formatDate } from '$lib/format';

  let services = $state<any[]>([]);
  let loading = $state(true);
  let loadError = $state("");
  let actionError = $state("");
  let submitting = $state(false);
  let tab = $state<'history' | 'plan'>('history');

  let cmDate = $state('');
  let rooms = $state([{ name: '', gender: 'male', volunteerIds: '' }]);
  let inventory = $state([{ item: 'towel', quantity: 1, unit: 'pieces' }]);
  let planned = $state(false);

  onMount(async () => {
    const authorized = await requireRole("clerk", "elder", "deacon", "deaconess");
    if (!authorized) return;
    try { services = await getCommunionServices(); } catch { 
      loadError = "Failed to load. Please try again.";
    }
    loading = false;
  });

  function addRoom() { rooms = [...rooms, { name: '', gender: 'male', volunteerIds: '' }]; }
  function removeRoom(i: number) {
    const removed = rooms[i];
    rooms = rooms.filter((_, j) => j !== i);
    toast("Room removed", {
      action: {
        label: "Undo",
        onClick: () => {
          rooms = [...rooms.slice(0, i), removed, ...rooms.slice(i)];
        },
      },
    });
  }
  function addItem() { inventory = [...inventory, { item: 'towel', quantity: 1, unit: 'pieces' }]; }
  function removeItem(i: number) {
    const removed = inventory[i];
    inventory = inventory.filter((_, j) => j !== i);
    toast("Item removed", {
      action: {
        label: "Undo",
        onClick: () => {
          inventory = [...inventory.slice(0, i), removed, ...inventory.slice(i)];
        },
      },
    });
  }

  async function plan() {
    if (!cmDate) return;
    actionError = "";
    submitting = true;
    try {
      const result = await createCommunion({
        date: cmDate,
        rooms: rooms.filter(r => r.name).map(r => ({ ...r, volunteerIds: r.volunteerIds.split(',').map(s => s.trim()).filter(Boolean) })),
        inventory: inventory.filter(i => i.item).map(i => ({ item: i.item, quantity: i.quantity, unit: i.unit })),
      });
      services = [result, ...services];
      planned = true;
    } catch { 
      actionError = "Failed to plan service. Please try again.";
    }
    submitting = false;
  }
</script>

<svelte:head><title>Communion — Theobase</title></svelte:head>

<div class="space-y-6">
  <h1 class="text-2xl font-bold text-slate-900">Communion</h1>

  <div class="flex gap-2">
    <Button variant={tab === 'history' ? 'default' : 'ghost'} onclick={() => tab = 'history'}>History</Button>
    <Button variant={tab === 'plan' ? 'default' : 'ghost'} onclick={() => tab = 'plan'}>Plan Service</Button>
  </div>

  {#if tab === 'history'}
    {#if loadError}
      <div class="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p class="text-sm text-red-600">{loadError}</p>
        <button 
          class="mt-3 text-sm font-medium text-red-700 underline hover:text-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 rounded"
          onclick={() => { loadError = ""; onMount(async () => { try { services = await getCommunionServices(); } catch { loadError = "Failed to load. Please try again."; } loading = false; }); }}
        >
          Try again
        </button>
      </div>
    {:else if loading}
      <div class="space-y-3">
        <Skeleton class="h-16" />
        <Skeleton class="h-16" />
      </div>
    {:else if services.length === 0}
      <div class="flex flex-col items-center gap-3 rounded-lg border border-dashed border-slate-200 bg-white dark:bg-slate-900 py-12">
        <Wine class="size-8 text-slate-300" />
        <p class="text-sm text-slate-500">No communion services recorded.</p>
        <Button variant="outline" size="sm" onclick={() => tab = 'plan'}>Plan your first service</Button>
      </div>
    {:else}
      {#each services as s}
        <div class="border rounded-lg bg-white dark:bg-slate-900 p-4">
          <div class="flex items-center justify-between">
            <div>
              <div class="font-semibold text-slate-900">{formatDate(s.date)}</div>
              <div class="text-sm text-slate-500">
                {s.rooms?.length || 0} rooms &middot; {s.inventory?.length || 0} inventory items
              </div>
            </div>
          </div>
        </div>
      {/each}
    {/if}
  {:else}
    <Card>
      <CardHeader>
        <CardTitle>Plan Communion Service</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="space-y-2">
          <Label for="cm-date">Date</Label>
          <Input id="cm-date" type="date" bind:value={cmDate} />
        </div>

        <div class="font-semibold text-slate-900">Rooms</div>
        {#each rooms as room, i}
          <div class="flex gap-2 items-end">
            <div class="space-y-2 flex-1">
              {#if i === 0}<Label for="room-name-{i}">Name</Label>{/if}
              <Input id="room-name-{i}" bind:value={rooms[i].name} placeholder="Men's Room" />
            </div>
            <div class="space-y-2 w-28">
              {#if i === 0}<Label for="room-gender-{i}">Gender</Label>{/if}
              <Select bind:value={rooms[i].gender}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-2 flex-1">
              {#if i === 0}<Label for="room-vol-{i}">Volunteer IDs</Label>{/if}
              <Input id="room-vol-{i}" bind:value={rooms[i].volunteerIds} placeholder="deacon-1, deacon-2" />
            </div>
            {#if rooms.length > 1}
              <Button variant="destructive" size="icon" class="size-7 shrink-0" onclick={() => removeRoom(i)} aria-label="Remove room"><X class="size-4" /></Button>
            {/if}
          </div>
        {/each}
        <Button variant="outline" size="sm" onclick={addRoom}>+ Add Room</Button>

        <div class="font-semibold text-slate-900">Inventory</div>
        {#each inventory as inv, i}
          <div class="flex gap-2 items-end">
            <div class="space-y-2 flex-1">
              {#if i === 0}<Label for="inv-item-{i}">Item</Label>{/if}
              <Input id="inv-item-{i}" bind:value={inventory[i].item} />
            </div>
            <div class="space-y-2 w-20">
              {#if i === 0}<Label for="inv-qty-{i}">Qty</Label>{/if}
              <Input id="inv-qty-{i}" type="number" value={inventory[i].quantity} oninput={(e: Event) => inventory[i].quantity = parseInt((e.target as HTMLInputElement).value) || 0} />
            </div>
            <div class="space-y-2 flex-1">
              {#if i === 0}<Label for="inv-unit-{i}">Unit</Label>{/if}
              <Input id="inv-unit-{i}" bind:value={inventory[i].unit} />
            </div>
            {#if inventory.length > 1}
              <Button variant="destructive" size="icon" class="size-7 shrink-0" onclick={() => removeItem(i)} aria-label="Remove item"><X class="size-4" /></Button>
            {/if}
          </div>
        {/each}
        <Button variant="outline" size="sm" onclick={addItem}>+ Add Item</Button>

        <div>
          <Button onclick={plan} disabled={!cmDate || submitting}>Plan Service</Button>
        </div>
        {#if actionError}
          <div class="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p class="text-sm text-red-600">{actionError}</p>
            <button class="mt-3 text-sm font-medium text-red-700 underline hover:text-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 rounded" onclick={() => { actionError = ""; }}>Dismiss</button>
          </div>
        {/if}
        {#if planned}
          <div class="rounded-lg bg-green-50 p-4 text-sm text-green-800">Communion service planned for {cmDate}.</div>
        {/if}
      </CardContent>
    </Card>
  {/if}
</div>
