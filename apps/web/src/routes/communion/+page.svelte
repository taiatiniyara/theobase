<script lang="ts">
  import { createCommunion } from '$lib/api';

  let date = $state('');
  let rooms = $state([{ name: '', gender: 'male', volunteerIds: '' }]);
  let inventory = $state([{ item: '', quantity: 0, unit: 'pieces' }]);
  let result = $state<any>(null);

  function addRoom() { rooms = [...rooms, { name: '', gender: 'male', volunteerIds: '' }]; }
  function addItem() { inventory = [...inventory, { item: '', quantity: 0, unit: 'pieces' }]; }

  async function plan() {
    if (!date) return;
    try {
      const formattedRooms = rooms.filter(r => r.name).map(r => ({
        name: r.name,
        gender: r.gender,
        volunteerIds: r.volunteerIds.split(',').map(s => s.trim()).filter(Boolean),
      }));
      const formattedInventory = inventory.filter(i => i.item).map(i => ({
        item: i.item, quantity: i.quantity, unit: i.unit,
      }));
      const r = await createCommunion({ date, rooms: formattedRooms, inventory: formattedInventory });
      result = r;
    } catch {}
  }
</script>

<svelte:head><title>Communion — Theobase</title></svelte:head>

<h1>Communion Service</h1>

<div class="card">
  <h2>Plan Service</h2>
  <div class="label">Date</div>
  <input type="date" bind:value={date} />

  <div class="label">Rooms</div>
  {#each rooms as room, i}
    <div style="padding: 8px; margin-bottom: 8px; background: #f7fafc; border-radius: 8px;">
      <input type="text" bind:value={room.name} placeholder="Room name (e.g. Men's Room)" />
      <select bind:value={room.gender} style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 8px; font-size: 0.9rem;">
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="family">Family</option>
      </select>
      <input type="text" bind:value={room.volunteerIds} placeholder="Volunteer IDs (comma-separated)" style="margin: 0;" />
    </div>
  {/each}
  <button onclick={addRoom} style="background: #718096; padding: 8px 16px; font-size: 0.85rem; margin-bottom: 16px;">+ Add Room</button>

  <div class="label">Inventory</div>
  {#each inventory as inv, i}
    <div style="display: flex; gap: 8px; margin-bottom: 8px; align-items: center;">
      <select bind:value={inv.item} style="flex: 1; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.9rem; margin: 0;">
        <option value="">Select item...</option>
        <option value="towel">Towel</option>
        <option value="basin">Basin</option>
        <option value="bread">Bread</option>
        <option value="wine">Wine</option>
        <option value="footwashing_basin">Foot Washing Basin</option>
      </select>
      <input type="number" bind:value={inv.quantity} placeholder="Qty" style="width: 80px; margin: 0;" />
      <input type="text" bind:value={inv.unit} placeholder="pieces" style="width: 80px; margin: 0;" />
    </div>
  {/each}
  <button onclick={addItem} style="background: #718096; padding: 8px 16px; font-size: 0.85rem; margin-bottom: 16px;">+ Add Item</button>

  <button onclick={plan} disabled={!date}>Plan Service</button>
</div>

{#if result}
  <div class="card">
    <p class="success">Service planned for {result.date}.</p>
    <div class="label">Rooms</div>
    <div class="value">{result.rooms?.length || 0} rooms configured</div>
    <div class="label">Inventory Items</div>
    <div class="value">{result.inventory?.length || 0} items listed</div>
  </div>
{/if}
