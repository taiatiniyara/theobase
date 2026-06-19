<script lang="ts">
  import { requestMagicLink } from '$lib/api';
  import FormField from '$lib/components/FormField.svelte';

  let email = $state('');
  let status = $state<'idle' | 'sent' | 'error'>('idle');
  let emailError = $state('');

  async function submit() {
    status = 'idle';
    emailError = '';
    if (!email.includes('@')) {
      emailError = 'Please enter a valid email address.';
      return;
    }
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
    <p class="hint-block">Enter your email address and we'll send you a sign-in link.</p>
    <FormField
      label="Email"
      type="email"
      value={email}
      placeholder="elder@mychurch.org"
      error={emailError}
      oninput={(e) => email = (e.target as HTMLInputElement).value}
    />
    <button onclick={submit} disabled={!email.includes('@')}>Send magic link</button>
    {#if status === 'error'}
      <p class="error" style="margin-top: 12px;">Something went wrong. Try again.</p>
    {/if}
  {/if}
</div>

<style>
  .hint-block {
    color: #718096;
    margin-bottom: 16px;
    font-size: 0.95rem;
  }
</style>
