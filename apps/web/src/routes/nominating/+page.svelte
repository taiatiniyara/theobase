<script lang="ts">
  import { createNominatingSession, createNominatingRole } from '$lib/api';
  import { requireRole } from "$lib/guard";
  import { onMount } from 'svelte';
  import { toast } from '$lib/toast';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Badge } from '$lib/components/ui/badge';
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import { Vote, Plus, Calendar } from '@lucide/svelte';

  let year = $state(new Date().getFullYear());
  let session = $state<any>(null);
  let roles = $state<any[]>([]);
  let loading = $state(false);
  let submittingSession = $state(false);
  let submittingRole = $state(false);

  let roleType = $state('elder');

  const roleTypes = ['elder', 'clerk', 'treasurer', 'deacon', 'deaconess', 'head_deacon', 'head_deaconess', 'sabbath_school_superintendent', 'pathfinder_director', 'adventurer_director', 'dorcas_coordinator', 'health_ministries_leader', 'youth_leader', 'music_coordinator'];

  async function openSession() {
    submittingSession = true;
    try {
      const result = await createNominatingSession({ year });
      session = result;
      toast.success("Session opened.");
    } catch { toast.error("Failed to open session."); }
    finally { submittingSession = false; }
  }

  async function addRole() {
    if (!session || !roleType || submittingRole) return;
    submittingRole = true;
    try {
      const result = await createNominatingRole({ sessionId: session.id, roleType });
      roles = [...roles, result];
      toast.success("Role added.");
    } catch { toast.error("Failed to add role."); }
    finally { submittingRole = false; }
  }

  function roleLabel(r: string) {
    return r.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  onMount(async () => {
    const authorized = await requireRole("clerk");
    if (!authorized) return;
  });
</script>

<svelte:head><title>Nominating — Theobase</title></svelte:head>

<div class="space-y-6">
  <h1 class="text-2xl font-bold text-slate-900">Nominating Committee</h1>

  {#if loading || submittingSession}
    <Card>
      <CardHeader>
        <CardTitle>Opening Session...</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <Skeleton class="h-10 w-full" />
        <div class="space-y-3">
          <Skeleton class="h-16" />
          <Skeleton class="h-16" />
        </div>
      </CardContent>
    </Card>
  {:else if !session}
    <Card>
      <CardHeader>
        <CardTitle>Open Session</CardTitle>
        <CardDescription>Start a new nominating committee session</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="space-y-2">
          <Label for="session-year">Year</Label>
          <Input id="session-year" type="number" bind:value={year} placeholder="2025" />
        </div>
        <Button onclick={openSession} disabled={submittingSession}>
          <Calendar class="size-4" />
          {submittingSession ? "Opening..." : "Open Nominating Session"}
        </Button>
      </CardContent>
    </Card>
  {:else}
    <Card>
      <CardHeader>
        <CardTitle>Session Active — {session.year}</CardTitle>
        <CardDescription>Opened: {session.id?.slice(0, 8)}</CardDescription>
      </CardHeader>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Add Role to Ballot</CardTitle>
        <CardDescription>Add an office to be filled by the committee</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="space-y-2">
          <Label for="role-type">Role</Label>
          <Select type="single" bind:value={roleType}>
            <SelectTrigger id="role-type" class="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {#each roleTypes as r}
                <SelectItem value={r}>{roleLabel(r)}</SelectItem>
              {/each}
            </SelectContent>
          </Select>
        </div>
        <Button onclick={addRole} disabled={submittingRole}>
          <Plus class="size-4" />
          {submittingRole ? "Adding..." : "Add Role"}
        </Button>
      </CardContent>
    </Card>

    {#if roles.length > 0}
      <Card>
        <CardHeader>
          <CardTitle>Ballot ({roles.length} roles)</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="flex flex-wrap gap-2">
            {#each roles as role}
              <Badge variant="secondary" class="capitalize">
                {role.roleType?.replace(/_/g, ' ')}
              </Badge>
            {/each}
          </div>
        </CardContent>
      </Card>
    {:else}
      <div class="flex flex-col items-center gap-3 rounded-lg border border-dashed border-slate-200 bg-white dark:bg-slate-900 py-12">
        <Vote class="size-8 text-slate-300" />
        <p class="text-sm text-slate-500">No roles on the ballot yet.</p>
        <Button variant="outline" size="sm" onclick={() => document.querySelector('#role-type')?.focus()}>Add your first role</Button>
      </div>
    {/if}
  {/if}
</div>
