<script lang="ts">
  import { getCongregation, inviteOfficer, importMembers, getMe, getCongregationMembers, createPerson, updatePerson, assignRole, removeRole, getInviteCode, regenerateInviteCode } from '$lib/api';
  import { requireRole } from "$lib/guard";
  import { onMount } from 'svelte';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Textarea } from "$lib/components/ui/textarea";
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "$lib/components/ui/select";
  import { Skeleton } from "$lib/components/ui/skeleton";
  import { Building2, Mail, Upload, Send, Users, Plus, Edit3, Trash2, X } from "@lucide/svelte";

  let congregation = $state<any>(null);
  let inviteCode = $state("");
  let loading = $state(true);
  let loadError = $state("");
  let inviteEmail = $state('');
  let inviteRole = $state('elder');
  let inviteStatus = $state('');
  let csvText = $state('');
  let csvResult = $state<any>(null);
  let csvError = $state('');
  let memberList = $state<any[]>([]);
  let roleList = $state<any[]>([]);
  let loadingMembers = $state(false);
  let viewingMembers = $state(false);
  let showAddPerson = $state(false);
  let newFirstName = $state(''); let newLastName = $state(''); let newEmail = $state(''); let newMember = $state(true);
  let editingPersonId = $state<string | null>(null);
  let editFirstName = $state(''); let editLastName = $state(''); let editEmail = $state(''); let editPhone = $state(''); let editIsMember = $state(false);
  let toastMsg = $state('');

  async function addPerson() {
    if (!newFirstName.trim() || !newLastName.trim()) return;
    try {
      await createPerson({ firstName: newFirstName, lastName: newLastName, email: newEmail || undefined, isMember: newMember });
      newFirstName = ''; newLastName = ''; newEmail = ''; showAddPerson = false;
      toastMsg = 'Person added'; await loadMemberList();
    } catch { toastMsg = 'Failed to add person'; }
    setTimeout(() => toastMsg = '', 3000);
  }

  async function savePerson(id: string) {
    try {
      await updatePerson(id, { firstName: editFirstName, lastName: editLastName, email: editEmail, phone: editPhone, isMember: editIsMember });
      editingPersonId = null; toastMsg = 'Updated'; await loadMemberList();
    } catch { toastMsg = 'Failed to update'; }
  }

  function startEdit(p: any) {
    editingPersonId = p.id; editFirstName = p.firstName; editLastName = p.lastName;
    editEmail = p.email || ''; editPhone = p.phone || ''; editIsMember = !!p.isMember;
  }

  async function assignNewRole(personId: string, roleType: string) {
    if (!congregation || !personId) return;
    try { await assignRole({ personId, congregationId: congregation.id, roleType }); toastMsg = 'Role assigned'; await loadMemberList(); }
    catch { toastMsg = 'Failed to assign role'; }
    setTimeout(() => toastMsg = '', 3000);
  }

  async function removeExistingRole(roleId: string) {
    try { await removeRole(roleId); toastMsg = 'Role removed'; await loadMemberList(); }
    catch { toastMsg = 'Failed to remove role'; }
    setTimeout(() => toastMsg = '', 3000);
  }

  const roleOptions = ['elder', 'clerk', 'treasurer', 'deacon', 'deaconess', 'musician', 'av_operator', 'youth_leader', 'sabbath_school_superintendent', 'pathfinder_director', 'adventurer_director', 'dorcas_coordinator', 'health_ministries_leader'];

  async function loadCongregation(id: string) {
    try {
      congregation = await getCongregation(id);
      try {
        const codeData = await getInviteCode(id);
        inviteCode = codeData?.inviteCode || "";
      } catch { inviteCode = ""; }
    } catch { loadError = "Failed to load congregation."; }
    loading = false;
  }

  async function regenerateCode() {
    if (!congregation) return;
    try {
      const data = await regenerateInviteCode(congregation.id);
      inviteCode = data?.inviteCode || "";
    } catch {}
  }

  async function sendInvite() {
    if (!inviteEmail) return;
    inviteStatus = '';
    try {
      const data = await inviteOfficer(congregation.id, { email: inviteEmail, role: inviteRole });
      inviteStatus = data.ok ? 'Invitation sent!' : (data.error || 'Failed');
      if (data.ok) inviteEmail = '';
    } catch { inviteStatus = 'Failed to send.'; }
  }

  async function importCSV() {
    if (!csvText.trim()) return;
    csvError = '';
    csvResult = null;
    try {
      const data = await importMembers(congregation.id, csvText);
      csvResult = data;
      csvText = '';
    } catch { csvError = 'Import failed.'; }
  }

  async function loadMemberList() {
    if (!congregation) return;
    loadingMembers = true;
    viewingMembers = true;
    try {
      const data = await getCongregationMembers(congregation.id);
      memberList = data?.persons || [];
      roleList = data?.roles || [];
    } catch { memberList = []; roleList = []; }
    loadingMembers = false;
  }

  async function fetchData() {
    loading = true;
    loadError = "";
    try {
      const me = await getMe();
      if (me?.congregationId) {
        await loadCongregation(me.congregationId);
      } else {
        loading = false;
      }
    } catch { loadError = "Failed to load congregation."; loading = false; }
  }

  onMount(async () => {
    const authorized = await requireRole("clerk");
    if (!authorized) return;
    fetchData();
  });

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
          <Building2 class="size-5" /> Invite Code
        </CardTitle>
        <CardDescription>Share this 8-digit code so members can join</CardDescription>
      </CardHeader>
      <CardContent class="space-y-3">
        <div class="flex items-center gap-3">
          <code class="flex-1 rounded-lg bg-slate-100 px-4 py-3 text-center text-2xl font-mono tracking-[0.3em] text-slate-900 dark:bg-slate-800 dark:text-slate-100">
            {inviteCode || "—"}
          </code>
        </div>
        <Button variant="outline" size="sm" onclick={regenerateCode}>
          Regenerate Code
        </Button>
        <p class="text-xs text-muted-foreground">Regenerating the code invalidates the previous one.</p>
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

    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Users class="size-5" /> Members
        </CardTitle>
        <CardDescription>
          {#if loadingMembers}
            Loading...
          {:else if viewingMembers}
            {memberList.length} members, {roleList.length} roles assigned
          {:else}
            <Button variant="link" class="h-auto p-0 text-sm" onclick={loadMemberList}>View member list</Button>
          {/if}
        </CardDescription>
      </CardHeader>
      {#if viewingMembers && !loadingMembers}
        <CardContent class="space-y-2">
          {#if toastMsg}<div class="text-sm font-medium text-brand-900 bg-brand-50 rounded px-3 py-1">{toastMsg}</div>{/if}

          {#each memberList as person}
            {#if editingPersonId === person.id}
              <div class="rounded bg-blue-50 px-3 py-2 space-y-2">
                <div class="grid grid-cols-2 gap-2">
                  <Input class="h-8 text-xs" placeholder="First name" bind:value={editFirstName} />
                  <Input class="h-8 text-xs" placeholder="Last name" bind:value={editLastName} />
                  <Input class="h-8 text-xs" placeholder="Email" bind:value={editEmail} />
                  <Input class="h-8 text-xs" placeholder="Phone" bind:value={editPhone} />
                </div>
                <label class="flex items-center gap-2 text-xs"><input type="checkbox" bind:checked={editIsMember} /> Member</label>
                <div class="flex gap-2">
                  <Button size="sm" class="h-7 text-xs" onclick={() => savePerson(person.id)}>Save</Button>
                  <Button variant="ghost" size="sm" class="h-7 text-xs" onclick={() => editingPersonId = null}>Cancel</Button>
                </div>
              </div>
            {:else}
              <div class="flex items-center justify-between rounded bg-slate-50 px-3 py-2">
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <p class="text-sm font-medium">{person.firstName} {person.lastName}</p>
                    <Badge variant={person.isMember ? 'default' : 'secondary'} class="text-[10px]">{person.isMember ? 'Member' : 'Non-member'}</Badge>
                  </div>
                  <p class="text-xs text-slate-500">{person.email || 'No email'}</p>
                </div>
                <div class="flex items-center gap-1">
                  {#each roleList.filter((r: any) => r.personId === person.id) as r}
                    <button class="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 hover:bg-red-200 transition-colors"
                      onclick={() => removeExistingRole(r.id)} title="Remove role">
                      {r.roleType.replace(/_/g, ' ')}
                    </button>
                  {/each}
                  <select class="h-6 text-[10px] rounded border px-1 bg-white" onchange={(e: any) => { assignNewRole(person.id, e.target.value); e.target.value = ''; }}>
                    <option value="">+ Role</option>
                    {#each roleOptions as ro}
                      {#if !roleList.some((pr: any) => pr.personId === person.id && pr.roleType === ro)}
                        <option value={ro}>{ro.replace(/_/g, ' ')}</option>
                      {/if}
                    {/each}
                  </select>
                  <Button variant="ghost" size="icon" class="size-7" onclick={() => startEdit(person)}>
                    <Edit3 class="size-3" />
                  </Button>
                </div>
              </div>
            {/if}
          {/each}

          {#if showAddPerson}
            <div class="rounded bg-green-50 px-3 py-2 space-y-2 mt-3 border-t pt-3">
              <div class="grid grid-cols-2 gap-2">
                <Input class="h-8 text-xs" placeholder="First name" bind:value={newFirstName} />
                <Input class="h-8 text-xs" placeholder="Last name" bind:value={newLastName} />
                <Input class="h-8 text-xs" placeholder="Email" bind:value={newEmail} />
              </div>
              <label class="flex items-center gap-2 text-xs"><input type="checkbox" bind:checked={newMember} /> Member</label>
              <div class="flex gap-2">
                <Button size="sm" class="h-7 text-xs" onclick={addPerson} disabled={!newFirstName.trim()}>Add</Button>
                <Button variant="ghost" size="sm" class="h-7 text-xs" onclick={() => showAddPerson = false}><X class="size-3" /></Button>
              </div>
            </div>
          {:else}
            <Button variant="outline" size="sm" class="mt-2" onclick={() => showAddPerson = true}>
              <Plus class="size-3" /> Add Person
            </Button>
          {/if}
        </CardContent>
      {/if}
    </Card>
  {/if}
</div>
