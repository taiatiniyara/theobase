<script lang="ts">
  import { getMe, updateMe } from '$lib/api';
  import { onMount } from 'svelte';
  import FormField from '$lib/components/FormField.svelte';

  let profile = $state<any>(null);
  let loading = $state(true);
  let editMode = $state(false);
  let phone = $state('');
  let address = $state('');
  let saved = $state(false);

  onMount(async () => {
    try {
      profile = await getMe();
    } catch { /* not logged in */ }
    loading = false;
  });

  function startEdit() {
    phone = profile?.phone || '';
    address = profile?.address || '';
    editMode = true;
    saved = false;
  }

  async function save() {
    try {
      profile = await updateMe({ phone, address });
      editMode = false;
      saved = true;
    } catch {}
  }
</script>

<svelte:head>
  <title>Profile — Theobase</title>
</svelte:head>

{#if loading}
  <p style="color: #718096; padding-top: 32px;">Loading...</p>
{:else if !profile}
  <div class="card" style="margin-top: 32px;">
    <h1>Theobase</h1>
    <p style="color: #718096;">You are not signed in.</p>
    <a href="/" class="btn">Sign in</a>
  </div>
{:else}
  <a href="/dashboard" style="display: inline-block; margin-top: 16px; color: #2b6cb0; text-decoration: none;">← Dashboard</a>

  <div class="card">
    <h1>Welcome, {profile.firstName || profile.email}</h1>

    {#if !editMode}
      <div class="field">
        <span class="label">Email</span>
        <div class="value">{profile.email}</div>
      </div>

      <div class="field">
        <span class="label">Phone</span>
        <div class="value">{profile.phone || 'Not set'}</div>
      </div>

      <div class="field">
        <span class="label">Address</span>
        <div class="value">{profile.address || 'Not set'}</div>
      </div>

      {#if profile.congregationId}
        <div class="field">
          <span class="label">Congregation</span>
          <div class="value">{profile.congregationId}</div>
        </div>
      {/if}

      <button onclick={startEdit}>Edit Profile</button>
      {#if saved}
        <p class="success">Profile updated.</p>
      {/if}
    {:else}
      <FormField
        label="Phone"
        type="tel"
        value={phone}
        placeholder="+679 1234567"
        oninput={(e) => phone = (e.target as HTMLInputElement).value}
      />
      <FormField
        label="Address"
        value={address}
        placeholder="123 Church St"
        oninput={(e) => address = (e.target as HTMLInputElement).value}
      />
      <button onclick={save}>Save</button>
      <button style="background: #718096; margin-left: 8px;" onclick={() => editMode = false}>Cancel</button>
    {/if}
  </div>
{/if}

<style>
  .field { margin-bottom: 12px; }
  .label {
    display: block;
    font-size: 0.75rem;
    color: #4a5568;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 2px;
    font-weight: 600;
  }
  .value { font-size: 1rem; margin-bottom: 0; }
</style>
