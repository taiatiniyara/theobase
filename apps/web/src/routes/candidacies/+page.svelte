<script lang="ts">
  import { getCandidacies, createCandidacy } from '$lib/api';
  import { onMount } from 'svelte';
  import { toast } from '$lib/toast';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Badge } from '$lib/components/ui/badge';
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import { ClipboardList, Plus } from '@lucide/svelte';
  import { formatDate } from '$lib/format';
  import DataToolbar from "$lib/components/DataToolbar.svelte";

  let candidacies = $state<any[]>([]);
  let loading = $state(true);
  let loadError = $state("");
  let submitting = $state(false);

  let searchQuery = $state("");
  let sortKey = $state("stage");
  let sortDir = $state<"asc" | "desc">("asc");

  const filteredCandidacies = $derived(
    candidacies
      .filter(c => !searchQuery ||
        Object.values(c).some(v => String(v).toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .sort((a, b) => {
        const aVal = a[sortKey] ?? "";
        const bVal = b[sortKey] ?? "";
        const cmp = String(aVal).localeCompare(String(bVal));
        return sortDir === "asc" ? cmp : -cmp;
      })
  );

  let cdPersonId = $state('');
  let cdStage = $state('interest');
  let cdStartDate = $state(new Date().toISOString().slice(0, 10));

  const stages = ['interest', 'bible_study', 'baptismal_class', 'decision', 'baptized'];

  async function loadCandidacies() {
    loading = true;
    loadError = "";
    try { candidacies = await getCandidacies(); } catch { loadError = "Failed to load candidacies."; }
    loading = false;
  }

  onMount(loadCandidacies);

  async function addCandidacy() {
    if (!cdPersonId || submitting) return;
    submitting = true;
    try {
      const result = await createCandidacy({ personId: cdPersonId, stage: cdStage, startDate: cdStartDate });
      candidacies = [...candidacies, result];
      cdPersonId = '';
      toast.success("Candidacy added.");
    } catch { toast.error("Failed to add candidacy."); }
    finally { submitting = false; }
  }

  function stageLabel(s: string) {
    return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
</script>

<svelte:head><title>Candidacy Pipeline — Theobase</title></svelte:head>

<div class="space-y-6">
  <h1 class="text-2xl font-bold text-slate-900">Candidacy Pipeline</h1>

  <Card>
    <CardHeader>
      <CardTitle>Add Candidacy</CardTitle>
      <CardDescription>Start a new baptismal candidacy journey</CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="space-y-2">
        <Label for="cd-person-id">Person ID</Label>
        <Input id="cd-person-id" bind:value={cdPersonId} placeholder="person-1" />
      </div>
      <div class="space-y-2">
        <Label for="cd-stage">Stage</Label>
        <Select type="single" bind:value={cdStage}>
          <SelectTrigger id="cd-stage" class="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {#each stages as s}
              <SelectItem value={s}>{stageLabel(s)}</SelectItem>
            {/each}
          </SelectContent>
        </Select>
      </div>
      <div class="space-y-2">
        <Label for="cd-start-date">Start Date</Label>
        <Input id="cd-start-date" type="date" bind:value={cdStartDate} />
      </div>
      <Button onclick={addCandidacy} disabled={!cdPersonId || submitting}>
        <Plus class="size-4" />
        {submitting ? "Adding..." : "Add Candidacy"}
      </Button>
    </CardContent>
  </Card>

  {#if loadError}
    <div class="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <p class="text-sm text-red-600">{loadError}</p>
      <button class="mt-3 text-sm font-medium text-red-700 underline" onclick={loadCandidacies}>Try again</button>
    </div>
  {:else if loading}
    <div class="space-y-4">
      <Skeleton class="h-16 w-full" />
      <Skeleton class="h-16 w-full" />
      <Skeleton class="h-16 w-full" />
    </div>
  {:else if candidacies.length === 0}
    <div class="flex flex-col items-center gap-3 rounded-lg border border-dashed border-slate-200 bg-white dark:bg-slate-900 py-12">
      <ClipboardList class="size-8 text-slate-300" />
      <p class="text-sm text-slate-500">No candidacies registered.</p>
      <Button variant="outline" size="sm" onclick={() => document.getElementById('cd-person-id')?.focus()}>Create your first candidacy</Button>
    </div>
  {:else}
    <DataToolbar
      searchPlaceholder="Search candidacies..."
      sortOptions={[{ label: "Stage", key: "stage" }, { label: "Start Date", key: "startDate" }]}
      sortKey={sortKey}
      sortDir={sortDir}
      onsearch={(q) => searchQuery = q}
      onsort={(k, d) => { sortKey = k; sortDir = d; }}
      resultCount={filteredCandidacies.length}
      totalCount={candidacies.length}
    />
    {#each filteredCandidacies as c}
      <Card>
        <CardContent class="py-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="font-semibold text-slate-900">{c.personId?.slice(0, 8)}</p>
              <p class="text-sm text-slate-500">Started: {formatDate(c.startDate)}</p>
            </div>
            <Badge variant="secondary">{stageLabel(c.stage)}</Badge>
          </div>
        </CardContent>
      </Card>
    {/each}
  {/if}
</div>
