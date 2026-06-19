<script lang="ts">
  import { createFacilityBooking } from '$lib/api';

  let bkDate = $state('');
  let bkStart = $state('');
  let bkEnd = $state('');
  let bkPurpose = $state('');
  let booked = $state(false);

  async function book() {
    if (!bkDate || !bkStart || !bkEnd || !bkPurpose) return;
    try {
      await createFacilityBooking({ date: bkDate, timeStart: bkStart, timeEnd: bkEnd, purpose: bkPurpose });
      booked = true;
      bkPurpose = '';
    } catch {}
  }
</script>

<svelte:head><title>Facilities — Theobase</title></svelte:head>

<h1>Facilities</h1>

<div class="card">
  <h2>Book Facility</h2>
  <div class="label">Date</div>
  <input type="date" bind:value={bkDate} />
  <div style="display: flex; gap: 8px;">
    <div style="flex: 1;">
      <div class="label">Start Time</div>
      <input type="time" bind:value={bkStart} style="margin: 0;" />
    </div>
    <div style="flex: 1;">
      <div class="label">End Time</div>
      <input type="time" bind:value={bkEnd} style="margin: 0;" />
    </div>
  </div>
  <div class="label" style="margin-top: 8px;">Purpose</div>
  <input type="text" bind:value={bkPurpose} placeholder="Wedding reception" />
  <button onclick={book} disabled={!bkDate || !bkStart || !bkEnd || !bkPurpose}>Book</button>
  {#if booked}
    <p class="success" style="margin-top: 12px;">Facility booked for {bkDate}.</p>
  {/if}
</div>
