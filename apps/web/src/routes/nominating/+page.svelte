<script lang="ts">
  import { getNominatingSessions, getNominatingRoles, getNominatingCandidates, createNominatingSession, createNominatingRole, createNominatingCandidate, updateNominatingCandidate, deleteNominatingSession, deleteNominatingRole, deleteNominatingCandidate } from '$lib/api';
  import { requireRole } from "$lib/guard";
  import { onMount } from 'svelte';
  import { toast as showToast } from '$lib/toast';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Badge } from '$lib/components/ui/badge';
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import ConfirmDialog from "$lib/components/ConfirmDialog.svelte";
  import { Vote, Plus, Calendar, Trash2, UserPlus } from '@lucide/svelte';

  let sessions = $state<any[]>([]);
  let selectedSessionId = $state<string | null>(null);
  let roles = $state<any[]>([]);
  let candidatesMap = $state<Record<string, any[]>>({});
  let loading = $state(true);
  let submittingSession = $state(false);
  let submittingRole = $state(false);
  let year = $state(new Date().getFullYear());
  let roleType = $state('elder');
  let candidatePersonId = $state('');
  let activeRoleId = $state<string | null>(null);
  let deleteTarget = $state<{ type: string; id: string; label: string } | null>(null);

  const ROLE_TYPES = ['elder', 'clerk', 'treasurer', 'deacon', 'deaconess', 'head_deacon', 'head_deaconess', 'sabbath_school_superintendent', 'pathfinder_director', 'adventurer_director', 'dorcas_coordinator', 'health_ministries_leader', 'youth_leader', 'music_coordinator'];

  function roleLabel(r: string) { return r.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }

  async function loadSessions() {
    loading = true;
    try {
      sessions = await getNominatingSessions();
      if (sessions.length > 0 && !selectedSessionId) {
        selectedSessionId = sessions[0].id;
        await loadRoles(sessions[0].id);
      }
    } catch { sessions = []; }
    loading = false;
  }

  async function loadRoles(sessionId: string) {
    try {
      roles = await getNominatingRoles(sessionId);
      candidatesMap = {};
      for (const role of roles) {
        try {
          candidatesMap[role.id] = await getNominatingCandidates(role.id);
        } catch { candidatesMap[role.id] = []; }
      }
    } catch { roles = []; }
  }

  async function openSession() {
    submittingSession = true;
    try {
      const result = await createNominatingSession({ year });
      sessions = [result, ...sessions];
      selectedSessionId = result.id;
      roles = [];
      candidatesMap = {};
      showToast.success("Session opened.");
    } catch { showToast.error("Failed to open session."); }
    finally { submittingSession = false; }
  }

  async function addRole() {
    if (!selectedSessionId || submittingRole) return;
    submittingRole = true;
    try {
      const result = await createNominatingRole({ sessionId: selectedSessionId, roleType });
      roles = [...roles, result];
      showToast.success("Role added.");
    } catch { showToast.error("Failed to add role."); }
    finally { submittingRole = false; }
  }

  async function addCandidate(roleId: string) {
    if (!candidatePersonId) return;
    try {
      const result = await createNominatingCandidate({ roleId, personId: candidatePersonId });
      if (!candidatesMap[roleId]) candidatesMap[roleId] = [];
      candidatesMap[roleId] = [...candidatesMap[roleId], result];
      candidatePersonId = '';
      activeRoleId = null;
      showToast.success("Candidate nominated.");
    } catch { showToast.error("Failed to nominate candidate."); }
  }

  async function updateCandidateStatus(candidateId: string, roleId: string, status: string) {
    try {
      await updateNominatingCandidate(candidateId, status);
      await loadRoles(selectedSessionId!);
    } catch { showToast.error("Failed to update candidate."); }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'session') await deleteNominatingSession(deleteTarget.id);
      else if (deleteTarget.type === 'role') await deleteNominatingRole(deleteTarget.id);
      else if (deleteTarget.type === 'candidate') await deleteNominatingCandidate(deleteTarget.id);
      if (selectedSessionId) await loadRoles(selectedSessionId);
      else await loadSessions();
      showToast.success("Deleted.");
    } catch { showToast.error("Failed to delete."); }
    deleteTarget = null;
  }

  async function selectSession(id: string) {
    selectedSessionId = id;
    await loadRoles(id);
  }

  onMount(async () => {
    if (!await requireRole("clerk")) return;
    loadSessions();
  });
</script>

<svelte:head><title>Nominating — Theobase</title></svelte:head>

<div class="space-y-6">
  <h1 class="text-2xl font-bold text-slate-900">Nominating Committee</h1>

  {#if loading}
    <div class="space-y-3"><Skeleton class="h-20" /><Skeleton class="h-32" /></div>
  {:else}
    {#if sessions.length > 0}
      <Card>
        <CardHeader>
          <CardTitle>Sessions</CardTitle>
        </CardHeader>
        <CardContent class="flex flex-wrap gap-2">
          {#each sessions as s}
            <Button
              variant={selectedSessionId === s.id ? 'default' : 'outline'}
              size="sm"
              onclick={() => selectSession(s.id)}
            >
              {s.year}
              {#if s.status !== 'open'}<Badge variant="secondary" class="ml-1 text-[10px]">{s.status}</Badge>{/if}
            </Button>
          {/each}
        </CardContent>
      </Card>
    {/if}

    <Card>
      <CardHeader>
        <CardTitle>Open New Session</CardTitle>
        <CardDescription>Start a new nominating committee session</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="flex items-end gap-3">
          <div class="space-y-2">
            <Label for="session-year">Year</Label>
            <Input id="session-year" type="number" bind:value={year} placeholder="2025" class="w-32" />
          </div>
          <Button onclick={openSession} disabled={submittingSession}>
            <Calendar class="size-4" />
            {submittingSession ? "Opening..." : "Open Session"}
          </Button>
        </div>
      </CardContent>
    </Card>

    {#if selectedSessionId}
      <Card>
        <CardHeader class="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Ballot Roles</CardTitle>
            <CardDescription>Add offices to be filled</CardDescription>
          </div>
          <Button variant="outline" size="sm" onclick={() => deleteTarget = { type: 'session', id: selectedSessionId!, label: `Session ${sessions.find(s => s.id === selectedSessionId)?.year}` }}>
            <Trash2 class="size-3.5 text-red-500" />
          </Button>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="flex items-end gap-3">
            <div class="space-y-2 flex-1">
              <Label for="role-type">Role</Label>
              <Select type="single" value={roleType} onValueChange={(v) => roleType = v || 'elder'}>
                <SelectTrigger id="role-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {#each ROLE_TYPES as r}<SelectItem value={r}>{roleLabel(r)}</SelectItem>{/each}
                </SelectContent>
              </Select>
            </div>
            <Button onclick={addRole} disabled={submittingRole}>
              <Plus class="size-4" /> Add
            </Button>
          </div>

          {#if roles.length === 0}
            <p class="text-sm text-slate-400 text-center py-4">No roles on ballot yet</p>
          {:else}
            <div class="space-y-3">
              {#each roles as role (role.id)}
                <div class="rounded-lg border p-3">
                  <div class="flex items-center justify-between mb-2">
                    <span class="font-medium text-sm">{roleLabel(role.roleType)}</span>
                    <div class="flex items-center gap-1">
                      <Badge variant="secondary" class="text-[10px]">{role.status}</Badge>
                      <Button variant="ghost" size="icon" class="size-7" onclick={() => deleteTarget = { type: 'role', id: role.id, label: roleLabel(role.roleType) }}>
                        <Trash2 class="size-3 text-red-400" />
                      </Button>
                    </div>
                  </div>
                  {#each candidatesMap[role.id] || [] as candidate (candidate.id)}
                    <div class="flex items-center justify-between ml-3 py-1 border-t border-slate-100">
                      <span class="text-xs text-slate-600">ID: {candidate.personId?.slice?.(0, 8) || candidate.personId}</span>
                      <div class="flex items-center gap-1">
                        <Badge variant={candidate.status === 'accepted' ? 'default' : candidate.status === 'declined' ? 'destructive' : 'secondary'} class="text-[10px]">{candidate.status}</Badge>
                        {#if candidate.status === 'nominated'}
                          <Button variant="ghost" size="icon" class="size-6" onclick={() => updateCandidateStatus(candidate.id, role.id, 'accepted')} title="Accept">✓</Button>
                          <Button variant="ghost" size="icon" class="size-6" onclick={() => updateCandidateStatus(candidate.id, role.id, 'declined')} title="Decline">✗</Button>
                        {/if}
                        <Button variant="ghost" size="icon" class="size-6" onclick={() => deleteTarget = { type: 'candidate', id: candidate.id, label: `candidate ${candidate.personId?.slice?.(0, 8)}` }}>
                          <Trash2 class="size-2.5 text-red-400" />
                        </Button>
                      </div>
                    </div>
                  {/each}
                  {#if activeRoleId === role.id}
                    <div class="flex items-center gap-2 ml-3 mt-2">
                      <Input placeholder="Person ID" class="h-7 text-xs" bind:value={candidatePersonId} />
                      <Button size="sm" class="h-7 text-xs" onclick={() => addCandidate(role.id)}>Add</Button>
                      <Button variant="ghost" size="sm" class="h-7 text-xs" onclick={() => { activeRoleId = null; candidatePersonId = ''; }}>Cancel</Button>
                    </div>
                  {:else}
                    <button class="ml-3 mt-1 flex items-center gap-1 text-xs text-brand-600 hover:underline" onclick={() => { activeRoleId = role.id; candidatePersonId = ''; }}>
                      <UserPlus class="size-3" /> Nominate
                    </button>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
        </CardContent>
      </Card>
    {:else if sessions.length === 0}
      <div class="flex flex-col items-center gap-3 rounded-lg border border-dashed border-slate-200 bg-white dark:bg-slate-900 py-12">
        <Vote class="size-8 text-slate-300" />
        <p class="text-sm text-slate-500">No nominating sessions yet.</p>
        <p class="text-xs text-slate-400">Open a session above to begin the nominating process.</p>
      </div>
    {/if}
  {/if}
</div>

<ConfirmDialog
  open={deleteTarget !== null}
  onOpenChange={() => deleteTarget = null}
  title="Confirm delete"
  description={deleteTarget ? `Delete ${deleteTarget.type}: ${deleteTarget.label}?` : ''}
  confirmLabel="Delete"
  variant="destructive"
  onconfirm={confirmDelete}
/>
