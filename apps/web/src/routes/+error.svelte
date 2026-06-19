<script lang="ts">
  import { page } from '$app/stores';
</script>

<svelte:head>
  <title>Error — Theobase</title>
</svelte:head>

<div class="card" style="margin-top: 32px; text-align: center;">
  <h1>Something went wrong</h1>
  <p style="color: #718096; margin-bottom: 24px;">
    {#if $page.status === 404}
      Page not found.
    {:else if $page.status === 500}
      Server error. Please try again.
    {:else}
      An unexpected error occurred.
    {/if}
  </p>
  <a href="/" class="btn">Go home</a>
</div>
