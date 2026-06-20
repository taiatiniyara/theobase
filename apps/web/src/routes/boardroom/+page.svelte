<script lang="ts">
  import { getBoardMeetings, createBoardMeeting, getBoardMeeting, createBoardDecision } from "$lib/api";
  import { requireRole } from "$lib/guard";
  import { onMount } from "svelte";
  import { toast } from "$lib/toast";
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Badge } from "$lib/components/ui/badge";
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "$lib/components/ui/select";
  import { Skeleton } from "$lib/components/ui/skeleton";
  import { Plus, ChevronRight, ArrowLeft, Gavel } from "@lucide/svelte";
  import { formatDate } from "$lib/format";
  import DataToolbar from "$lib/components/DataToolbar.svelte";
  import DateRangeFilter from "$lib/components/DateRangeFilter.svelte";
  import StaggerList from "$lib/components/StaggerList.svelte";

  let searchQuery = $state("");
  let sortKey = $state("date");
  let sortDir = $state<"asc" | "desc">("desc");
  let meetingDateRange = $state<{ from: string; to: string } | null>(null);

  let meetings = $state<any[]>([]);
  const PAGE_SIZE = 20;
  let loading = $state(true);
  let hasMore = $state(true);
  let loadingMore = $state(false);
  let showCreate = $state(false);
  let selectedMeeting = $state<any>(null);

  let meetingDate = $state("");
  let agendaItems = $state([{ title: "" }]);
  let createError = $state("");
  let loadError = $state("");
  let submittingMeeting = $state(false);
  let submittingDecision = $state(false);

  let decisionTitle = $state("");
  let decisionDesc = $state("");
  let decisionVote = $state("approved");
  let decisionError = $state("");

  function addAgendaItem() {
    agendaItems = [...agendaItems, { title: "" }];
  }

  async function createMeeting() {
    createError = "";
    const agenda = agendaItems.filter((a) => a.title.trim());
    if (!meetingDate || agenda.length === 0) {
      createError = "Date and at least one agenda item required.";
      return;
    }
    submittingMeeting = true;
    try {
      const result = await createBoardMeeting({ date: meetingDate, agenda });
      if (result.error) { createError = result.error; return; }
      meetings = [result, ...meetings];
      showCreate = false;
      meetingDate = "";
      agendaItems = [{ title: "" }];
      toast.success("Meeting scheduled.");
    } catch { createError = "Failed to create meeting."; }
    finally { submittingMeeting = false; }
  }

  async function viewMeeting(id: string) {
    try {
      selectedMeeting = await getBoardMeeting(id);
    } catch { loadError = "Failed to load meeting details."; }
  }

  async function addDecision() {
    if (!decisionTitle.trim()) return;
    decisionError = "";
    submittingDecision = true;
    try {
      const result = await createBoardDecision(selectedMeeting.id, {
        title: decisionTitle,
        description: decisionDesc,
        voteOutcome: decisionVote,
      });
      if (result.error) { decisionError = result.error; return; }
      selectedMeeting.decisions = [...(selectedMeeting.decisions || []), result];
      decisionTitle = "";
      decisionDesc = "";
      toast.success("Decision recorded.");
    } catch { decisionError = "Failed to record decision."; }
    finally { submittingDecision = false; }
  }

  function statusBadge(status: string) {
    const map: Record<string, string> = {
      draft: "bg-slate-100 text-slate-700",
      open: "bg-blue-100 text-blue-700",
      in_progress: "bg-amber-100 text-amber-700",
      closed: "bg-green-100 text-green-700",
    };
    return map[status] || "bg-slate-100 text-slate-700";
  }

  function voteBadge(outcome: string) {
    const map: Record<string, string> = {
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
      tabled: "bg-slate-100 text-slate-600",
    };
    return map[outcome] || "bg-slate-100 text-slate-600";
  }

  async function loadMeetings() {
    loading = true;
    loadError = "";
    try { meetings = await getBoardMeetings(PAGE_SIZE, 0); } catch { loadError = "Failed to load meetings."; }
    hasMore = meetings.length >= PAGE_SIZE;
    loading = false;
  }

  async function loadMore() {
    loadingMore = true;
    try {
      const more = await getBoardMeetings(PAGE_SIZE, meetings.length);
      meetings = [...meetings, ...more];
      hasMore = more.length >= PAGE_SIZE;
    } catch {}
    loadingMore = false;
  }

  onMount(async () => {
    const authorized = await requireRole("clerk", "treasurer", "elder");
    if (!authorized) return;
    loadMeetings();
  });

  const filteredMeetings = $derived(
    meetings
      .filter(m => !searchQuery || m.date.includes(searchQuery) || m.status?.includes(searchQuery.toLowerCase()))
      .filter(m => {
        if (!meetingDateRange) return true;
        const d = m.date || "";
        if (meetingDateRange.from && d < meetingDateRange.from) return false;
        if (meetingDateRange.to && d > meetingDateRange.to) return false;
        return true;
      })
      .sort((a, b) => {
        const aVal = sortKey === "date" ? a.date : a.status;
        const bVal = sortKey === "date" ? b.date : b.status;
        const cmp = String(aVal).localeCompare(String(bVal));
        return sortDir === "asc" ? cmp : -cmp;
      })
  );
</script>

<svelte:head>
  <title>Boardroom — Theobase</title>
</svelte:head>

<div class="space-y-6">
  <h1 class="text-2xl font-bold text-slate-900">Boardroom</h1>

  {#if loading}
    <div class="space-y-3">
      <Skeleton class="h-10 w-40" />
      <Skeleton class="h-20" /><Skeleton class="h-20" />
    </div>
  {:else if loadError}
    <div class="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <p class="text-sm text-red-600">{loadError}</p>
      <button class="mt-3 text-sm font-medium text-red-700 underline" onclick={loadMeetings}>Try again</button>
    </div>
  {:else if showCreate}
    <Card>
      <CardHeader>
        <CardTitle>New Board Meeting</CardTitle>
        <CardDescription>Schedule a board meeting with agenda items</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="space-y-2">
          <Label for="date">Date</Label>
          <Input id="date" type="date" bind:value={meetingDate} />
        </div>

        <div class="space-y-2">
          <Label>Agenda Items</Label>
          {#each agendaItems as item, i}
            <Input
              placeholder="Agenda item {i + 1}"
              value={item.title}
              oninput={(e) => agendaItems = agendaItems.map((a, j) => j === i ? { title: (e.target as HTMLInputElement).value } : a)}
            />
          {/each}
          <Button type="button" variant="outline" size="sm" onclick={addAgendaItem}>
            <Plus class="size-3.5" /> Add item
          </Button>
        </div>

        {#if createError}
          <p class="text-sm text-red-600">{createError}</p>
        {/if}

        <div class="flex gap-2">
          <Button onclick={createMeeting} disabled={submittingMeeting}>
            {submittingMeeting ? "Creating..." : "Create Meeting"}
          </Button>
          <Button variant="outline" onclick={() => showCreate = false}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  {:else if selectedMeeting}
    <div class="space-y-6">
      <Button variant="ghost" onclick={() => selectedMeeting = null}>
        <ArrowLeft class="size-4" /> Back to meetings
      </Button>

      <Card>
        <CardHeader>
          <div class="flex items-start justify-between">
            <div>
              <CardTitle>Meeting — {formatDate(selectedMeeting.date)}</CardTitle>
              <CardDescription>
                <Badge class={statusBadge(selectedMeeting.status)}>
                  {(selectedMeeting.status || "").replace(/_/g, " ")}
                </Badge>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        {#if selectedMeeting.agenda?.length}
          <CardContent>
            <h3 class="mb-2 text-sm font-medium text-slate-500">AGENDA</h3>
            <ul class="space-y-1">
              {#each selectedMeeting.agenda as item}
                <li class="text-sm text-slate-700">{item.title}</li>
              {/each}
            </ul>
          </CardContent>
        {/if}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Decisions</CardTitle>
          <CardDescription>
            {selectedMeeting.decisions?.length
              ? `${selectedMeeting.decisions.length} recorded`
              : "No decisions recorded yet"}
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          {#if selectedMeeting.decisions?.length}
            {#each selectedMeeting.decisions as dec}
              <div class="rounded-lg border p-3">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <p class="font-medium text-sm">#{dec.number} — {dec.title}</p>
                    {#if dec.description}
                      <p class="mt-1 text-sm text-slate-500">{dec.description}</p>
                    {/if}
                  </div>
                  <Badge class={voteBadge(dec.voteOutcome)}>{dec.voteOutcome}</Badge>
                </div>
              </div>
            {/each}
          {/if}

          <div class="space-y-3 border-t pt-4">
            <h3 class="text-sm font-medium">Record new decision</h3>
            <div class="space-y-2">
              <Label for="dec-title">Decision Title</Label>
              <Input id="dec-title" bind:value={decisionTitle} placeholder="Decision title" />
            </div>
            <div class="space-y-2">
              <Label for="dec-desc">Description (optional)</Label>
              <Input id="dec-desc" bind:value={decisionDesc} placeholder="Description" />
            </div>
            <div class="space-y-2">
              <Label for="dec-vote">Vote Outcome</Label>
              <Select bind:value={decisionVote}>
                <SelectTrigger>
                  <SelectValue placeholder="Select outcome" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="tabled">Tabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {#if decisionError}
              <p class="text-sm text-red-600">{decisionError}</p>
            {/if}
            <Button onclick={addDecision} disabled={submittingDecision}>
              {submittingDecision ? "Recording..." : "Record Decision"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  {:else}
    <div class="space-y-3">
      <Button onclick={() => showCreate = true}>
        <Plus class="size-4" /> New Meeting
      </Button>

      <DataToolbar
        searchPlaceholder="Search meetings..."
        sortOptions={[
          { label: "Date", key: "date" },
          { label: "Status", key: "status" },
        ]}
        sortKey={sortKey}
        sortDir={sortDir}
        onsearch={(q) => searchQuery = q}
        onsort={(key, dir) => { sortKey = key; sortDir = dir; }}
        resultCount={filteredMeetings.length}
        totalCount={meetings.length}
      />

      <DateRangeFilter onchange={(r) => meetingDateRange = r} />

      {#if meetings.length === 0}
        <Card>
          <CardContent class="flex flex-col items-center gap-3 py-8">
            <Gavel class="size-8 text-slate-300" />
            <p class="text-sm text-slate-500">No board meetings yet.</p>
            <p class="text-xs text-slate-400 mt-1">Schedule meetings, build agendas, and record board decisions.</p>
            <Button variant="outline" onclick={() => showCreate = true}>Schedule your first meeting</Button>
          </CardContent>
        </Card>
      {:else}
        <StaggerList each={filteredMeetings}>
          {#snippet children(meeting, index)}
            <button
              class="flex w-full items-center justify-between rounded-lg border bg-white dark:bg-slate-900 p-4 text-left shadow-sm transition-colors hover:bg-slate-50"
              onclick={() => viewMeeting(meeting.id)}
            >
              <div>
                <p class="font-medium text-slate-900">{formatDate(meeting.date)}</p>
                <Badge class={statusBadge(meeting.status)}>
                  {(meeting.status || "").replace(/_/g, " ")}
                </Badge>
              </div>
              <ChevronRight class="size-5 text-slate-400" />
            </button>
          {/snippet}
        </StaggerList>
        {#if hasMore}
          <div class="flex justify-center pt-2">
            <Button variant="outline" onclick={loadMore} disabled={loadingMore}>
              {loadingMore ? "Loading..." : "Load more"}
            </Button>
          </div>
        {/if}
      {/if}
    </div>
  {/if}
</div>
