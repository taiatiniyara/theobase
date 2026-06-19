<script lang="ts">
  import { getCommunionServices, createCommunion } from '$lib/api';
  import { onMount } from 'svelte';
  import FormField from '$lib/components/FormField.svelte';

  let services = $state<any[]>([]);
  let loading = $state(true);
  let tab = $state<'history' | 'plan'>('history');

  let cmDate = $state('');
  let rooms = $state([{ name: '', gender: 'male', volunteerIds: '' }]);
  let inventory = $state([{ item: 'towel', quantity: 1, unit: 'pieces' }]);
  let planned = $state(false);

  onMount(async () => {
    try { services = await getCommunionServices(); } catch {}
    loading = false;
  });

  function addRoom() { rooms = [...rooms, { name: '', gender: 'male', volunteerIds: '' }]; }
  function removeRoom(i: number) { rooms = rooms.filter((_, j) => j !== i); }
  function addItem() { inventory = [...inventory, { item: 'towel', quantity: 1, unit: 'pieces' }]; }
  function removeItem(i: number) { inventory = inventory.filter((_, j) => j !== i); }

  async function plan() {
    if (!cmDate) return;
    try {
      const result = await createCommunion({
        date: cmDate,
        rooms: rooms.filter(r => r.name).map(r => ({ ...r, volunteerIds: r.volunteerIds.split(',').map(s => s.trim()).filter(Boolean) })),
        inventory: inventory.filter(i => i.item).map(i => ({ item: i.item, quantity: i.quantity, unit: i.unit })),
      });
      services = [result, ...services];
      planned = true;
    } catch {}
  }
</script>

<svelte:head><title>Communion — Theobase</title></svelte:head>

<h1>Communion</h1>

<div style="display: flex; gap: 8px; margin-bottom: 16px;">
  <button onclick={() => tab = 'history'} style={tab === 'history' ? '' : 'background: #718096;'}>History</button>
  <button onclick={() => tab = 'plan'} style={tab === 'plan' ? '' : 'background: #718096;'}>Plan Service</button>
</div>

{#if tab === 'history'}
  {#if loading}
    <p style="color: #718096;">Loading...</p>
  {:else if services.length === 0}
    <div class="card"><p style="color: #718096;">No communion services recorded.</p></div>
  {:else}
    {#each services as s}
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: 600;">{s.date}</div>
            <div style="color: #718096; font-size: 0.85rem;">
              {s.rooms?.length || 0} rooms &middot; {s.inventory?.length || 0} inventory items
            </div>
          </div>
        </div>
      </div>
    {/each}
  {/if}
{:else}
  <div class="card">
    <h2>Plan Communion Service</h2>
    <FormField label="Date" type="date" value={cmDate} oninput={(e) => cmDate = (e.target as HTMLInputElement).value} />

    <h3 style="margin-top: 16px;">Rooms</h3>
    {#each rooms as room, i}
      <div class="room-row">
        <div style="flex: 2;">
          <FormField label={i === 0 ? 'Name' : ''} value={room.name} placeholder="Men's Room" oninput={(e) => rooms[i].name = (e.target as HTMLInputElement).value} />
        </div>
        <div style="flex: 1;">
          {#if i === 0}<label class="field-label">Gender</label>{/if}
          <select bind:value={rooms[i].gender} class="select">
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
        <div style="flex: 2;">
          <FormField label={i === 0 ? 'Volunteer IDs' : ''} value={room.volunteerIds} placeholder="deacon-1, deacon-2" oninput={(e) => rooms[i].volunteerIds = (e.target as HTMLInputElement).value} />
        </div>
        {#if rooms.length > 1}
          <button onclick={() => removeRoom(i)} class="remove-btn">✕</button>
        {/if}
      </div>
    {/each}
    <button onclick={addRoom} style="background: #718096; margin-bottom: 16px;">+ Add Room</button>

    <h3>Inventory</h3>
    {#each inventory as inv, i}
      <div class="room-row">
        <div style="flex: 2;">
          <FormField label={i === 0 ? 'Item' : ''} value={inv.item} oninput={(e) => inventory[i].item = (e.target as HTMLInputElement).value} />
        </div>
        <div style="flex: 1;">
          <FormField label={i === 0 ? 'Qty' : ''} type="number" value={inv.quantity} oninput={(e) => inventory[i].quantity = parseInt((e.target as HTMLInputElement).value) || 0} />
        </div>
        <div style="flex: 1;">
          <FormField label={i === 0 ? 'Unit' : ''} value={inv.unit} oninput={(e) => inventory[i].unit = (e.target as HTMLInputElement).value} />
        </div>
        {#if inventory.length > 1}
          <button onclick={() => removeItem(i)} class="remove-btn">✕</button>
        {/if}
      </div>
    {/each}
    <button onclick={addItem} style="background: #718096; margin-bottom: 16px;">+ Add Item</button>

    <button onclick={plan} disabled={!cmDate}>Plan Service</button>
    {#if planned}
      <p class="success" style="margin-top: 12px;">Communion service planned for {cmDate}.</p>
    {/if}
  </div>
{/if}

<style>
  .field-label { display: block; font-size: 0.75rem; color: #4a5568; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; font-weight: 600; }
  .select { width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.9rem; box-sizing: border-box; }
  .room-row { display: flex; gap: 8px; align-items: flex-end; margin-bottom: 8px; }
  .remove-btn { background: #e53e3e; padding: 6px 10px; font-size: 0.8rem; color: white; border: none; border-radius: 8px; cursor: pointer; flex-shrink: 0; }
</style>
