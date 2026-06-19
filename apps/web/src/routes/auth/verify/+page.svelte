<script lang="ts">
  import { verifyToken, setToken } from '$lib/api';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  let status = $state<'verifying' | 'error'>('verifying');
  let error = $state('');

  onMount(async () => {
    const token = $page.url.searchParams.get('token');
    if (!token) {
      status = 'error';
      error = 'No token provided.';
      return;
    }
    try {
      const res = await verifyToken(token);
      if (res.ok && res.token) {
        setToken(res.token);
        goto('/dashboard');
      } else {
        status = 'error';
        error = res.error || 'Invalid or expired token.';
      }
    } catch {
      status = 'error';
      error = 'Could not verify your token. Please request a new link.';
    }
  });
</script>

<svelte:head>
  <title>Verify — Theobase</title>
</svelte:head>

<div class="card" style="margin-top: 32px; text-align: center;">
  {#if status === 'verifying'}
    <h1>Verifying...</h1>
    <p style="color: #718096;">Checking your sign-in link.</p>
  {:else}
    <h1>Sign-in failed</h1>
    <p class="error">{error}</p>
    <a href="/" class="btn">Try again</a>
  {/if}
</div>
