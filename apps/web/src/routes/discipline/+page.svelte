<script lang="ts">
  import { api, API_URL } from '$lib/api';
  import { requireRole } from "$lib/guard";
  import { onMount } from 'svelte';
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Badge } from "$lib/components/ui/badge";
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "$lib/components/ui/select";
  import { Skeleton } from "$lib/components/ui/skeleton";
  import { Scale, Plus } from "@lucide/svelte";
  import { formatDate } from "$lib/format";
  import DataToolbar from "$lib/components/DataToolbar.svelte";

  let cases = $state<any[]>([]);
  let loading = $state(true);
  let search = $state('');
  let showForm = $state(false);
  let formPersonId = $state(''); let formType = $state('counseling');
  let formDesc = $state(''); let formMeetingId = $state('');
  let submitting = $state(false);

  async function load() {
    loading = true;
    try {
      const res = await fetch(`${API_URL}/discipline/cases`, { credentials: "include" });
      cases = await res.json();
    } catch { cases = []; }
    loading = false;
  }

  async function createCase() {
    if (!formPersonId || !formDesc) return;
    submitting = true;
    try {
      await fetch(`${API_URL}/discipline/cases`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: "include",
        body: JSON.stringify({ personId: formPersonId, caseType: formType, description: formDesc, boardMeetingId: formMeetingId || undefined }),
      });
      showForm = false; formPersonId = ''; formDesc = ''; formMeetingId = '';
      await load();
    } catch {}
    submitting = false;
  }

  async function resolveCase(id: string, status: string, resolution: string) {
    try {
      await fetch(`${API_URL}/discipline/cases/${id}/resolve`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: "include",
        body: JSON.stringify({ status, resolution }),
      });
      await load();
    } catch {}
  }

  onMount(async () => { if (!await requireRole("clerk", "elder")) return; load(); });

  const filtered = $derived(search ? cases.filter((c: any) =>
    c.caseType?.includes(search) || c.description?.toLowerCase().includes(search.toLowerCase())
  ) : cases);
</script>

<svelte:head><title>Discipline — Theobase</title></svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-bold text-slate-900">Church Discipline</h1>
    <Button size="sm" onclick={() => showForm = !showForm}><Plus class="size-4" /> {showForm ? 'Cancel' : 'New Case'}</Button>
  </div>

  {#if showForm}
    <Card>
      <CardHeader><CardTitle>Open Case</CardTitle></CardHeader>
      <CardContent class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div><label class="text-sm font-medium">Person ID</label><Input bind:value={formPersonId} /></div>
          <div><label class="text-sm font-medium">Case Type</label>
            <Select value={formType} onValueChange={(v) => formType = v || 'counseling'}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="counseling">Counseling</SelectItem>
                <SelectItem value="censure">Censure</SelectItem>
                <SelectItem value="removal">Removal</SelectItem>
                <SelectItem value="reinstatement">Reinstatement</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div><label class="text-sm font-medium">Description</label><Input bind:value={formDesc} placeholder="Case description" /></div>
        <div><label class="text-sm font-medium">Board Meeting ID (optional)</label><Input bind:value={formMeetingId} /></div>
        <Button onclick={createCase} disabled={submitting || !formPersonId}>{submitting ? 'Creating...' : 'Open Case'}</Button>
      </CardContent>
    </Card>
  {/if}

  {#if loading}
    <div class="space-y-3"><Skeleton class="h-16" /><Skeleton class="h-16" /></div>
  {:else if filtered.length === 0}
    <div class="flex flex-col items-center gap-3 py-12">
      <Scale class="size-8 text-slate-300" />
      <p class="text-sm text-slate-500">No discipline cases.</p>
    </div>
  {:else}
    <DataToolbar searchPlaceholder="Search cases..." onsearch={(q) => search = q} resultCount={filtered.length} totalCount={cases.length} />
    {#each filtered as c (c.id)}
      <Card>
        <CardContent class="flex items-center justify-between p-4">
          <div>
            <div class="flex items-center gap-2">
              <Badge>{c.caseType?.replace(/_/g, ' ')}</Badge>
              <Badge variant={c.status === 'active' ? 'default' : c.status === 'resolved' ? 'default' : 'destructive'}>{c.status}</Badge>
            </div>
            <p class="text-sm mt-1">{c.description}</p>
            {#if c.resolution}<p class="text-xs text-green-600 mt-1">Resolution: {c.resolution}</p>{/if}
            <p class="text-xs text-slate-400 mt-1">{formatDate(c.createdAt)}</p>
          </div>
          {#if c.status === 'active'}
            <div class="flex gap-1">
              <Button size="sm" class="h-7 text-xs" onclick={() => resolveCase(c.id, 'resolved', 'Resolved by board action')}>Resolve</Button>
              <Button size="sm" variant="outline" class="h-7 text-xs" onclick={() => resolveCase(c.id, 'appealed', 'Appealed')}>Appeal</Button>
            </div>
          {/if}
        </CardContent>
      </Card>
    {/each}
  {/if}
</div>
