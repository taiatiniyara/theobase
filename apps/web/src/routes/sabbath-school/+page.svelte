<script lang="ts">
  import { getSabbathSchoolClasses, createSabbathSchoolClass, recordAttendance } from '$lib/api';
  import { requireRole } from "$lib/guard";
  import { onMount } from 'svelte';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import { toast } from "$lib/toast";
  import { GraduationCap, X } from '@lucide/svelte';
  import DataToolbar from "$lib/components/DataToolbar.svelte";
  import ConfirmDialog from "$lib/components/ConfirmDialog.svelte";

  let classes = $state<any[]>([]);
  let loading = $state(true);
  let loadError = $state("");
  let actionError = $state("");
  let submitting = $state(false);
  let tab = $state<'classes' | 'attendance'>('classes');

  let searchQuery = $state("");
  let sortKey = $state("name");
  let sortDir = $state<"asc" | "desc">("asc");

  const filteredClasses = $derived(
    classes
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

  let division = $state('adult');
  let className = $state('');

  let attClassId = $state('');
  let attDate = $state(new Date().toISOString().slice(0, 10));
  let attRecords = $state<{ memberId: string; present: boolean }[]>([]);
  let attSaved = $state(false);
  let removeAttendeeTarget = $state<number | null>(null);
  let removedAttendeeRecord = $state<{ index: number; data: any } | null>(null);

  const divisions = ['beginners', 'kindergarten', 'primary', 'juniors', 'earliteen', 'youth', 'adult'];

  async function addClass() {
    if (!className) return;
    actionError = "";
    submitting = true;
    try {
      const result = await createSabbathSchoolClass({ division, name: className });
      classes = [...classes, result];
      className = '';
    } catch { 
      actionError = "Failed to add class. Please try again.";
    }
    submitting = false;
  }

  function addAttendee() { attRecords = [...attRecords, { memberId: '', present: true }]; }
  function removeAttendee(i: number) {
    removeAttendeeTarget = i;
  }

  function confirmRemoveAttendee() {
    if (removeAttendeeTarget === null) return;
    const i = removeAttendeeTarget;
    removedAttendeeRecord = { index: i, data: { ...attRecords[i] } };
    attRecords = attRecords.filter((_, j) => j !== i);
    toast("Attendee removed", {
      action: {
        label: "Undo",
        onClick: undoRemoveAttendee,
      },
    });
    removeAttendeeTarget = null;
  }

  function undoRemoveAttendee() {
    if (removedAttendeeRecord) {
      const { index, data } = removedAttendeeRecord;
      attRecords = [...attRecords.slice(0, index), data, ...attRecords.slice(index)];
      removedAttendeeRecord = null;
    }
  }

  async function submitAttendance() {
    if (!attClassId || !attDate || attRecords.length === 0) return;
    actionError = "";
    submitting = true;
    try {
      await recordAttendance({
        attendance: attRecords.filter(a => a.memberId).map(a => ({
          classId: attClassId, date: attDate, memberId: a.memberId, present: a.present,
        })),
      });
      attSaved = true;
      attRecords = [];
    } catch { 
      actionError = "Failed to record attendance. Please try again.";
    }
    submitting = false;
  }

  onMount(async () => {
    const authorized = await requireRole("clerk", "sabbath_school_superintendent");
    if (!authorized) return;
    try { classes = await getSabbathSchoolClasses(); } catch { 
      loadError = "Failed to load. Please try again.";
    }
    loading = false;
  });
</script>

<svelte:head><title>Sabbath School — Theobase</title></svelte:head>

<div class="space-y-6">
  <h1 class="text-2xl font-bold text-slate-900">Sabbath School</h1>

  <div class="flex gap-2">
    <Button variant={tab === 'classes' ? 'default' : 'ghost'} onclick={() => tab = 'classes'}>Classes</Button>
    <Button variant={tab === 'attendance' ? 'default' : 'ghost'} onclick={() => tab = 'attendance'}>Attendance</Button>
  </div>

  {#if tab === 'attendance'}
    <Card>
      <CardHeader>
        <CardTitle>Record Attendance</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="space-y-2">
          <Label for="att-class">Class</Label>
          <Select bind:value={attClassId}>
            <SelectTrigger>
              <SelectValue placeholder="Select class..." />
            </SelectTrigger>
            <SelectContent>
              {#each classes as c}
                <SelectItem value={c.id}>{c.name} ({c.division})</SelectItem>
              {/each}
            </SelectContent>
          </Select>
        </div>
        <div class="space-y-2">
          <Label for="att-date">Date</Label>
          <Input id="att-date" type="date" bind:value={attDate} />
        </div>

        {#each attRecords as att, i}
          <div class="flex gap-2 items-end">
            <div class="space-y-2 flex-1">
              {#if i === 0}<Label for="att-member-{i}">Member ID</Label>{/if}
              <Input id="att-member-{i}" bind:value={attRecords[i].memberId} placeholder="person-1" />
            </div>
            <div class="flex items-center gap-1.5 pb-2">
              <input type="checkbox" id="att-present-{i}" bind:checked={attRecords[i].present} class="rounded border-slate-300" />
              {#if i === 0}<Label for="att-present-{i}" class="text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold">Present</Label>{/if}
            </div>
            <Button variant="destructive" size="icon" class="size-7 shrink-0" onclick={() => removeAttendee(i)} aria-label="Remove attendee"><X class="size-4" /></Button>
          </div>
        {/each}
        <Button variant="outline" size="sm" onclick={addAttendee}>+ Add Attendee</Button>
        <div>
          <Button onclick={submitAttendance} disabled={!attClassId || attRecords.length === 0 || submitting}>Record Attendance</Button>
        </div>
        {#if actionError}
          <div class="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p class="text-sm text-red-600">{actionError}</p>
            <button class="mt-3 text-sm font-medium text-red-700 underline hover:text-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 rounded" onclick={() => { actionError = ""; }}>Dismiss</button>
          </div>
        {/if}
        {#if attSaved}
          <div class="rounded-lg bg-green-50 p-4 text-sm text-green-800">Attendance recorded for {attDate}.</div>
        {/if}
      </CardContent>
    </Card>
  {:else}
    <Card>
      <CardHeader>
        <CardTitle>Add Class</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="space-y-2">
          <Label for="cls-division">Division</Label>
          <Select bind:value={division}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {#each divisions as d}
                <SelectItem value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</SelectItem>
              {/each}
            </SelectContent>
          </Select>
        </div>
        <div class="space-y-2">
          <Label for="cls-name">Class Name</Label>
          <Input id="cls-name" bind:value={className} placeholder="Adult Class A" />
        </div>
        <Button onclick={addClass} disabled={!className || submitting}>Add Class</Button>
        {#if actionError}
          <div class="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p class="text-sm text-red-600">{actionError}</p>
            <button class="mt-3 text-sm font-medium text-red-700 underline hover:text-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 rounded" onclick={() => { actionError = ""; }}>Dismiss</button>
          </div>
        {/if}
      </CardContent>
    </Card>

    {#if loadError}
      <div class="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p class="text-sm text-red-600">{loadError}</p>
        <button 
          class="mt-3 text-sm font-medium text-red-700 underline hover:text-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 rounded"
          onclick={() => { loadError = ""; onMount(async () => { try { classes = await getSabbathSchoolClasses(); } catch { loadError = "Failed to load. Please try again."; } loading = false; }); }}
        >
          Try again
        </button>
      </div>
    {:else if loading}
      <div class="space-y-3">
        <Skeleton class="h-16" />
        <Skeleton class="h-16" />
      </div>
    {:else if classes.length === 0}
      <div class="flex flex-col items-center gap-3 rounded-lg border border-dashed border-slate-200 bg-white dark:bg-slate-900 py-12">
        <GraduationCap class="size-8 text-slate-300" />
        <p class="text-sm text-slate-500">No classes yet.</p>
        <Button variant="outline" size="sm" onclick={() => document.getElementById('cls-name')?.focus()}>Create your first class</Button>
      </div>
    {:else}
      <DataToolbar
        searchPlaceholder="Search classes..."
        sortOptions={[{ label: "Name", key: "name" }, { label: "Division", key: "division" }]}
        sortKey={sortKey}
        sortDir={sortDir}
        onsearch={(q) => searchQuery = q}
        onsort={(k, d) => { sortKey = k; sortDir = d; }}
        resultCount={filteredClasses.length}
        totalCount={classes.length}
      />
      {#each filteredClasses as c}
        <div class="border rounded-lg bg-white dark:bg-slate-900 p-4">
          <div class="font-semibold text-slate-900">{c.name}</div>
          <div class="text-sm text-slate-500 dark:text-slate-400 capitalize">{c.division} Division</div>
        </div>
      {/each}
    {/if}
  {/if}

  <ConfirmDialog
    open={removeAttendeeTarget !== null}
    onOpenChange={(o) => { if (!o) removeAttendeeTarget = null; }}
    title="Remove Attendee"
    description="This action cannot be undone."
    confirmLabel="Remove"
    variant="destructive"
    onconfirm={confirmRemoveAttendee}
  />
</div>
