<script lang="ts">
  import { verifyToken, setToken } from '$lib/api';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  let status = $state<'joining' | 'error' | 'success'>('joining');
  let error = $state('');
  let roleName = $state('');

  onMount(async () => {
    const token = $page.url.searchParams.get('token');
    const role = $page.url.searchParams.get('role') || '';
    roleName = role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    if (!token) {
      status = 'error';
      error = 'No invitation token provided.';
      return;
    }
    try {
      const res = await verifyToken(token);
      if (res.ok && res.token) {
        setToken(res.token);
        status = 'success';
        setTimeout(() => goto('/dashboard'), 2000);
      } else {
        status = 'error';
        error = res.error || 'Invalid or expired invitation.';
      }
    } catch {
      status = 'error';
      error = 'Could not verify your invitation. Please contact your congregation clerk.';
    }
  });
</script>

<svelte:head>
  <title>Join — Theobase</title>
</svelte:head>

<div class="card" style="margin-top: 32px; text-align: center;">
  {#if status === 'joining'}
    <h1>Joining Theobase...</h1>
    <p style="color: #718096;">Verifying your invitation{roleName ? ` as ${roleName}` : ''}.</p>
  {:else if status === 'success'}
    <h1>Welcome!</h1>
    <p class="success">You've joined Theobase{roleName ? ` as ${roleName}` : ''}. Redirecting to dashboard...</p>
  {:else}
    <h1>Invitation failed</h1>
    <p class="error">{error}</p>
    <a href="/" class="btn">Try signing in</a>
  {/if}
</div>

<style>
  .btn {
    display: inline-block;
    margin-top: 12px;
    padding: 10px 24px;
    background: #1a365d;
    color: white;
    border-radius: 8px;
    text-decoration: none;
  }
</style>
