<script lang="ts">
  import { getMe, updateMe } from '$lib/api';
  import { onMount } from 'svelte';
  import { toast } from "$lib/toast";
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Skeleton } from "$lib/components/ui/skeleton";
  import { Pencil, ArrowLeft } from "@lucide/svelte";

  let profile = $state<any>(null);
  let loading = $state(true);
  let loadError = $state("");
  let submitting = $state(false);
  let editMode = $state(false);
  let phone = $state('');
  let address = $state('');
  let saved = $state(false);

  async function loadProfile() {
    loading = true;
    loadError = "";
    try {
      profile = await getMe();
    } catch { loadError = "Failed to load profile."; }
    loading = false;
  }

  onMount(loadProfile);

  function startEdit() {
    phone = profile?.phone || '';
    address = profile?.address || '';
    editMode = true;
    saved = false;
  }

  async function save() {
    submitting = true;
    try {
      profile = await updateMe({ phone, address });
      editMode = false;
      saved = true;
      toast.success("Profile updated.");
    } catch {
      toast.error("Failed to update profile.");
    }
    finally { submitting = false; }
  }
</script>

<svelte:head>
  <title>Profile — Theobase</title>
</svelte:head>

{#if loading}
  <div class="space-y-4 pt-8">
    <Skeleton class="h-8 w-48" />
    <Skeleton class="h-48" />
  </div>
{:else if loadError}
  <div class="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
    <p class="text-sm text-red-600">{loadError}</p>
    <button class="mt-3 text-sm font-medium text-red-700 underline" onclick={loadProfile}>Try again</button>
  </div>
{:else if !profile}
  <Card class="mt-8">
    <CardHeader>
      <CardTitle>Theobase</CardTitle>
      <CardDescription>You are not signed in.</CardDescription>
    </CardHeader>
    <CardContent>
      <a href="/"><Button>Sign in</Button></a>
    </CardContent>
  </Card>
{:else}
  <div class="space-y-6">
    <a href="/dashboard" class="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-100 no-underline">
      <ArrowLeft class="size-4" /> Dashboard
    </a>

    <Card>
      <CardHeader>
        <CardTitle>Welcome, {profile.firstName || profile.email}</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        {#if !editMode}
          <div class="space-y-4">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</p>
              <p class="text-slate-900">{profile.email}</p>
            </div>

            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</p>
              <p class="text-slate-900">{profile.phone || 'Not set'}</p>
            </div>

            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Address</p>
              <p class="text-slate-900">{profile.address || 'Not set'}</p>
            </div>

            {#if profile.congregationId}
              <div>
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Congregation</p>
                <p class="text-slate-900">{profile.congregationId}</p>
              </div>
            {/if}

            <Button onclick={startEdit}>
              <Pencil class="size-4" /> Edit Profile
            </Button>

            {#if saved}
              <p class="text-sm text-green-600">Profile updated.</p>
            {/if}
          </div>
        {:else}
          <div class="space-y-2">
            <Label for="me-phone">Phone</Label>
            <Input id="me-phone" type="tel" bind:value={phone} placeholder="+679 1234567" />
          </div>

          <div class="space-y-2">
            <Label for="me-address">Address</Label>
            <Input id="me-address" bind:value={address} placeholder="123 Church St" />
          </div>

          <div class="flex gap-2">
            <Button onclick={save} disabled={submitting}>
              {submitting ? "Saving..." : "Save Profile"}
            </Button>
            <Button variant="outline" onclick={() => editMode = false}>Cancel</Button>
          </div>
        {/if}
      </CardContent>
    </Card>
  </div>
{/if}
