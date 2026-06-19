<script lang="ts">
  import { getMe, updateMe } from '$lib/api';
  import { onMount } from 'svelte';

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
  <div class="card" style="margin-top: 32px;">
    <h1>Welcome, {profile.firstName || profile.email}</h1>

    {#if !editMode}
      <div class="label">Email</div>
      <div class="value">{profile.email}</div>

      <div class="label">Phone</div>
      <div class="value">{profile.phone || 'Not set'}</div>

      <div class="label">Address</div>
      <div class="value">{profile.address || 'Not set'}</div>

      {#if profile.congregationId}
        <div class="label">Congregation</div>
        <div class="value">{profile.congregationId}</div>
      {/if}

      <button onclick={startEdit}>Edit Profile</button>
      {#if saved}
        <p class="success">Profile updated.</p>
      {/if}
    {:else}
      <div class="label">Phone</div>
      <input type="tel" bind:value={phone} placeholder="+679 1234567" />
      <div class="label">Address</div>
      <input type="text" bind:value={address} placeholder="123 Church St" />
      <button onclick={save}>Save</button>
      <button style="background: #718096; margin-left: 8px;" onclick={() => editMode = false}>Cancel</button>
    {/if}
  </div>
{/if}
