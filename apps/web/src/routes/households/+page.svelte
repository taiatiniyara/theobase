<script lang="ts">
  import { getHouseholds, createHousehold, getHouseholdMembers, addHouseholdMember, removeHouseholdMember } from '$lib/api';
  import { requireRole } from "$lib/guard";
  import { onMount } from 'svelte';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Badge } from '$lib/components/ui/badge';
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import { Users, Plus, Trash2, ChevronDown, ChevronRight } from '@lucide/svelte';
  import DataToolbar from "$lib/components/DataToolbar.svelte";

  let households = $state<any[]>([]);
  let loading = $state(true);
  let actionError = $state("");
  let submitting = $state(false);
  let searchQuery = $state("");
  let sortKey = $state("name");
  let sortDir = $state<"asc" | "desc">("asc");
  let expandedId = $state<string | null>(null);
  let members = $state<any[]>([]);
  let loadingMembers = $state(false);
  let newPersonId = $state("");
  let newRelationship = $state("head");
  let toast = $state("");

  const filteredHouseholds = $derived(
    households.filter(h => !searchQuery || Object.values(h).some(v => String(v).toLowerCase().includes(searchQuery.toLowerCase())))
      .sort((a, b) => { const cmp = String(a[sortKey] ?? "").localeCompare(String(b[sortKey] ?? "")); return sortDir === "asc" ? cmp : -cmp; })
  );

  let hhName = $state('');

  async function addHousehold() {
    if (!hhName.trim()) return;
    actionError = ""; submitting = true;
    try { households = [...households, await createHousehold({ name: hhName.trim() })]; hhName = ''; }
    catch { actionError = "Failed to add household."; }
    submitting = false;
  }

  async function toggleHousehold(id: string) {
    if (expandedId === id) { expandedId = null; members = []; return; }
    expandedId = id; loadingMembers = true;
    try { members = await getHouseholdMembers(id); }
    catch { members = []; }
    loadingMembers = false;
  }

  async function addMember() {
    if (!expandedId || !newPersonId) return;
    try {
      const result = await addHouseholdMember(expandedId, { personId: newPersonId, relationship: newRelationship });
      members = [...members, result];
      newPersonId = '';
      toast = 'Member added';
    } catch { toast = 'Failed to add member'; }
    setTimeout(() => toast = '', 3000);
  }

  async function removeMember(memberId: string) {
    try { await removeHouseholdMember(memberId); members = members.filter(m => m.id !== memberId); }
    catch { toast = 'Failed to remove'; }
  }

  onMount(async () => {
    if (!await requireRole("clerk")) return;
    try { households = await getHouseholds(); } catch { actionError = "Failed to load."; }
    loading = false;
  });

  function relLabel(r: string) { return r.charAt(0).toUpperCase() + r.slice(1); }
</script>

<svelte:head><title>Households — Theobase</title></svelte:head>

<div class="space-y-6">
  <h1 class="text-2xl font-bold text-slate-900">Households</h1>

  {#if toast}<div class="rounded-lg bg-brand-50 px-4 py-2 text-sm font-medium text-brand-900">{toast}</div>{/if}

  <Card>
    <CardHeader><CardTitle>Add Household</CardTitle><CardDescription>Register a new household</CardDescription></CardHeader>
    <CardContent class="space-y-4">
      <div class="flex gap-3 items-end">
        <div class="space-y-2 flex-1">
          <Label for="hh-name">Household Name</Label>
          <Input id="hh-name" bind:value={hhName} placeholder="Smith Family" />
        </div>
        <Button onclick={addHousehold} disabled={!hhName.trim() || submitting}><Plus class="size-4" /> Add</Button>
      </div>
      {#if actionError}<p class="text-sm text-red-600">{actionError}</p>{/if}
    </CardContent>
  </Card>

  {#if loading}
    <div class="space-y-3"><Skeleton class="h-16" /><Skeleton class="h-16" /></div>
  {:else if households.length === 0}
    <div class="flex flex-col items-center gap-3 py-12">
      <Users class="size-8 text-slate-300" />
      <p class="text-sm text-slate-500">No households registered.</p>
    </div>
  {:else}
    <DataToolbar searchPlaceholder="Search households..." sortOptions={[{ label: "Name", key: "name" }]}
      sortKey={sortKey} sortDir={sortDir} onsearch={(q) => searchQuery = q} onsort={(k, d) => { sortKey = k; sortDir = d; }}
      resultCount={filteredHouseholds.length} totalCount={households.length} />
    {#each filteredHouseholds as h}
      <Card>
        <CardHeader class="cursor-pointer" onclick={() => toggleHousehold(h.id)}>
          <div class="flex items-center justify-between">
            <div>
              <CardTitle>{h.name}</CardTitle>
              <CardDescription>ID: {h.id?.slice(0, 8)}</CardDescription>
            </div>
              <Button variant="ghost" size="icon">
                {#if expandedId === h.id}<ChevronDown class="size-4" />{:else}<ChevronRight class="size-4" />{/if}
              </Button>
          </div>
        </CardHeader>
        {#if expandedId === h.id}
          <CardContent class="space-y-3">
            {#if loadingMembers}
              <Skeleton class="h-10" />
            {:else if members.length === 0}
              <p class="text-sm text-slate-400">No members in this household</p>
            {:else}
              {#each members as m (m.id)}
                <div class="flex items-center justify-between rounded bg-slate-50 px-3 py-2">
                  <div class="flex items-center gap-2">
                    <Badge variant="outline" class="text-[10px]">{relLabel(m.relationship)}</Badge>
                    <span class="text-sm text-slate-700">Person: {m.personId?.slice(0, 8)}</span>
                  </div>
                  <Button variant="ghost" size="icon" class="size-7 text-red-400" onclick={() => removeMember(m.id)}>
                    <Trash2 class="size-3" />
                  </Button>
                </div>
              {/each}
            {/if}
            <div class="flex items-end gap-2 border-t pt-3">
              <div class="flex-1">
                <Label class="text-xs">Person ID</Label>
                <Input class="h-8 text-xs" placeholder="Person ID" bind:value={newPersonId} />
              </div>
              <div>
                <Label class="text-xs">Relationship</Label>
                <Select value={newRelationship} onValueChange={(v) => newRelationship = v || 'head'}>
                  <SelectTrigger class="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="head">Head</SelectItem>
                    <SelectItem value="spouse">Spouse</SelectItem>
                    <SelectItem value="child">Child</SelectItem>
                    <SelectItem value="dependant">Dependant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button size="sm" class="h-8" onclick={addMember} disabled={!newPersonId}>Add</Button>
            </div>
          </CardContent>
        {/if}
      </Card>
    {/each}
  {/if}
</div>
