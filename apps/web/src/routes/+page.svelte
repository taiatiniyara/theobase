<script lang="ts">
  import { requestMagicLink } from '$lib/api';
  let email = $state('');
  let status = $state<'idle' | 'sent' | 'error'>('idle');

  async function submit() {
    status = 'idle';
    if (!email.includes('@')) return;
    try {
      await requestMagicLink(email);
      status = 'sent';
    } catch {
      status = 'error';
    }
  }
</script>

<svelte:head>
  <title>Sign in — Theobase</title>
</svelte:head>

<div class="card" style="margin-top: 32px;">
  <h1>Sign in to Theobase</h1>
  {#if status === 'sent'}
    <p class="success">Check your email — we sent you a magic link.</p>
  {:else}
    <p style="color: #718096; margin-bottom: 16px;">Enter your email address and we'll send you a sign-in link.</p>
    <input type="email" bind:value={email} placeholder="elder@mychurch.org" />
    <button onclick={submit} disabled={!email.includes('@')}>Send magic link</button>
    {#if status === 'error'}
      <p class="error">Something went wrong. Try again.</p>
    {/if}
  {/if}
</div>
