<script lang="ts">
  import { getFacilityBookings, createFacilityBooking } from '$lib/api';
  import { onMount } from 'svelte';
  import FormField from '$lib/components/FormField.svelte';

  let bookings = $state<any[]>([]);
  let loading = $state(true);

  let bkDate = $state('');
  let bkStart = $state('');
  let bkEnd = $state('');
  let bkPurpose = $state('');
  let booked = $state(false);

  onMount(async () => {
    try { bookings = await getFacilityBookings(); } catch {}
    loading = false;
  });

  async function book() {
    if (!bkDate || !bkStart || !bkEnd || !bkPurpose) return;
    try {
      const result = await createFacilityBooking({ date: bkDate, timeStart: bkStart, timeEnd: bkEnd, purpose: bkPurpose });
      bookings = [...bookings, result];
      booked = true;
      bkPurpose = '';
    } catch {}
  }
</script>

<svelte:head><title>Facilities — Theobase</title></svelte:head>

<h1>Facilities</h1>

<div class="card">
  <h2>Book Facility</h2>
  <FormField label="Date" type="date" value={bkDate} oninput={(e) => bkDate = (e.target as HTMLInputElement).value} />
  <div style="display: flex; gap: 8px;">
    <div style="flex: 1;">
      <FormField label="Start Time" type="time" value={bkStart} oninput={(e) => bkStart = (e.target as HTMLInputElement).value} />
    </div>
    <div style="flex: 1;">
      <FormField label="End Time" type="time" value={bkEnd} oninput={(e) => bkEnd = (e.target as HTMLInputElement).value} />
    </div>
  </div>
  <FormField label="Purpose" value={bkPurpose} placeholder="Wedding reception" oninput={(e) => bkPurpose = (e.target as HTMLInputElement).value} />
  <button onclick={book} disabled={!bkDate || !bkStart || !bkEnd || !bkPurpose}>Book</button>
  {#if booked}
    <p class="success" style="margin-top: 12px;">Facility booked for {bkDate}.</p>
  {/if}
</div>

<h2 style="margin-top: 24px;">Bookings</h2>
{#if loading}
  <p style="color: #718096;">Loading...</p>
{:else if bookings.length === 0}
  <div class="card"><p style="color: #718096;">No bookings yet.</p></div>
{:else}
  {#each bookings as b}
    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-weight: 600;">{b.date}</div>
          <div style="color: #718096; font-size: 0.85rem;">{b.timeStart} – {b.timeEnd} &middot; {b.purpose}</div>
        </div>
      </div>
    </div>
  {/each}
{/if}
