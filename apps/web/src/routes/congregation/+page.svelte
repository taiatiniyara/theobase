<script lang="ts">
  import { api } from '$lib/api';
  import { onMount } from 'svelte';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Textarea } from "$lib/components/ui/textarea";
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "$lib/components/ui/select";
  import { Skeleton } from "$lib/components/ui/skeleton";
  import { Building2, Mail, Upload, Send } from "@lucide/svelte";

  let congregation = $state<any>(null);
  let loading = $state(true);
  let loadError = $state("");
  let inviteEmail = $state('');
  let inviteRole = $state('elder');
  let inviteStatus = $state('');
  let csvText = $state('');
  let csvResult = $state<any>(null);
  let csvError = $state('');

  const roleOptions = ['elder', 'clerk', 'treasurer', 'deacon', 'deaconess', 'musician', 'av_operator', 'youth_leader', 'sabbath_school_superintendent', 'pathfinder_director', 'adventurer_director', 'dorcas_coordinator', 'health_ministries_leader'];

  async function loadCongregation(id: string) {
    try {
      const res = await api(`/congregations/${id}`);
      congregation = await res.json();
    } catch { loadError = "Failed to load congregation."; }
    loading = false;
  }

  async function sendInvite() {
    if (!inviteEmail) return;
    inviteStatus = '';
    try {
      const res = await api(`/congregations/${congregation.id}/invite`, {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      inviteStatus = data.ok ? 'Invitation sent!' : (data.error || 'Failed');
      if (data.ok) inviteEmail = '';
    } catch { inviteStatus = 'Failed to send.'; }
  }

  async function importCSV() {
    if (!csvText.trim()) return;
    csvError = '';
    csvResult = null;
    try {
      const res = await api(`/congregations/${congregation.id}/members/import`, {
        method: 'POST',
        body: JSON.stringify({ csv: csvText }),
      });
      const data = await res.json();
      if (res.status === 201 || res.status === 200) {
        csvResult = data;
        csvText = '';
      } else {
        csvError = data.error || 'Import failed.';
      }
    } catch { csvError = 'Import failed.'; }
  }

  async function fetchData() {
    loading = true;
    loadError = "";
    try {
      const meRes = await api('/me');
      const me = await meRes.json();
      if (me?.congregationId) {
        await loadCongregation(me.congregationId);
      } else {
        loading = false;
      }
    } catch { loadError = "Failed to load congregation."; loading = false; }
  }

  onMount(fetchData);

  function formatRole(role: string) {
    return role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
</script>

<svelte:head>
  <title>Congregation — Theobase</title>
</svelte:head>

<div class="space-y-6">
  <h1 class="text-2xl font-bold text-slate-900">Congregation</h1>

  {#if loading}
    <Skeleton class="h-32" />
    <Skeleton class="h-64" />
  {:else if loadError}
    <div class="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <p class="text-sm text-red-600">{loadError}</p>
      <button class="mt-3 text-sm font-medium text-red-700 underline hover:text-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 rounded" onclick={fetchData}>Try again</button>
    </div>
  {:else if !congregation}
    <div class="flex flex-col items-center gap-3 py-12">
      <Building2 class="size-8 text-slate-300" />
      <p class="text-sm text-slate-500">You are not associated with a congregation yet. Contact your conference office.</p>
    </div>
  {:else}
    <Card>
      <CardHeader>
        <CardTitle>{congregation.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Type</p>
          <p class="capitalize text-slate-900">{congregation.type}</p>
        </div>
        <div class="mt-4">
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Timezone</p>
          <p class="text-slate-900">{congregation.timezone}</p>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Mail class="size-5" /> Invite Officer
        </CardTitle>
        <CardDescription>Send an invitation to add an officer to your congregation</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="space-y-2">
          <Label for="invite-email">Email</Label>
          <Input
            id="invite-email"
            type="email"
            bind:value={inviteEmail}
            placeholder="officer@mychurch.org"
          />
        </div>

        <div class="space-y-2">
          <Label for="invite-role">Role</Label>
          <Select bind:value={inviteRole}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {#each roleOptions as role}
                <SelectItem value={role}>{formatRole(role)}</SelectItem>
              {/each}
            </SelectContent>
          </Select>
        </div>

        <Button onclick={sendInvite} disabled={!inviteEmail}>
          <Send class="size-4" /> Send Invitation
        </Button>

        {#if inviteStatus}
          <p class="text-sm {inviteStatus.includes('sent') ? 'text-green-600' : 'text-red-600'}">{inviteStatus}</p>
        {/if}
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Upload class="size-5" /> Import Members (CSV)
        </CardTitle>
        <CardDescription>Paste CSV data to bulk-import members</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="space-y-2">
          <Label for="csv-input">Paste CSV</Label>
          <Textarea
            id="csv-input"
            bind:value={csvText}
            rows={5}
            placeholder="firstName,lastName,email,phone,isMember&#10;Alice,Smith,alice@test.com,+679 111,true&#10;Bob,Jones,bob@test.com,+679 222,false"
            class="font-mono"
          />
        </div>

        <Button onclick={importCSV} disabled={!csvText.trim()}>Import Members</Button>

        {#if csvResult}
          <div class="space-y-1">
            <p class="text-sm text-green-600">{csvResult.imported} members imported.</p>
            {#if csvResult.errors?.length}
              <p class="text-sm text-red-600">{csvResult.errors.length} rows had errors.</p>
            {/if}
          </div>
        {/if}
        {#if csvError}
          <p class="text-sm text-red-600">{csvError}</p>
        {/if}
      </CardContent>
    </Card>
  {/if}
</div>
