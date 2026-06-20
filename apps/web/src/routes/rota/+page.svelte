<script lang="ts">
  import { getRota, createRotaSlot, updateRotaSlot, deleteRotaSlot } from '$lib/api';
  import { requireRole } from "$lib/guard";
  import { onMount } from 'svelte';
  import { onDestroy } from 'svelte';
  import { Card, CardContent } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Badge } from "$lib/components/ui/badge";
  import { Skeleton } from "$lib/components/ui/skeleton";
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "$lib/components/ui/select";
  import { Separator } from "$lib/components/ui/separator";
  import ConfirmDialog from "$lib/components/ConfirmDialog.svelte";
  import { ChevronLeft, ChevronRight, CalendarCheck, Plus, Trash2, HelpCircle, X, Check } from "@lucide/svelte";
  import StaggerList from "$lib/components/StaggerList.svelte";
  import { realtimeEvents } from "$lib/rtstore";

  let date = $state(new Date().toISOString().slice(0, 10));
  let slots = $state<any[]>([]);
  let loading = $state(false);
  let loadError = $state("");
  let showForm = $state(false);
  let formRole = $state("elder");
  let formVolunteerId = $state("");
  let submitting = $state(false);
  let deleteTarget = $state<any>(null);
  let toastMessage = $state("");

  const ROLES = [
    { value: "elder", label: "Elder of the Day" },
    { value: "preacher", label: "Preacher" },
    { value: "deacon", label: "Deacon" },
    { value: "deaconess", label: "Deaconess" },
    { value: "musician", label: "Musician" },
    { value: "av_operator", label: "AV Operator" },
    { value: "youth_leader", label: "Youth Leader" },
  ];

  const statusVariant: Record<string, string> = {
    open: 'secondary',
    assigned: 'default',
    declined: 'destructive',
    confirmed: 'default',
  };

  async function loadRota() {
    loading = true;
    loadError = "";
    try {
      const data = await getRota(date);
      slots = Array.isArray(data) ? data : [];
    } catch { loadError = "Failed to load rota."; }
    loading = false;
  }

  onMount(async () => {
    const authorized = await requireRole("clerk");
    if (!authorized) return;
    loadRota();

    const unsub = realtimeEvents.subscribe((event) => {
      if (!event) return;
      if (event.type === "rota_updated" || event.type === "slot_assigned" || event.type === "duty_reminder") {
        loadRota();
      }
    });

    onDestroy(() => unsub());
  });

  function prevWeek() { const d = new Date(date); d.setDate(d.getDate() - 7); date = d.toISOString().slice(0, 10); loadRota(); }
  function nextWeek() { const d = new Date(date); d.setDate(d.getDate() + 7); date = d.toISOString().slice(0, 10); loadRota(); }

  async function addSlot() {
    submitting = true;
    try {
      await createRotaSlot({ date, role: formRole, volunteerId: formVolunteerId || undefined });
      showForm = false;
      formVolunteerId = "";
      toastMessage = "Slot added";
      await loadRota();
    } catch { toastMessage = "Failed to create slot"; }
    submitting = false;
    setTimeout(() => toastMessage = "", 3000);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteRotaSlot(deleteTarget.id);
      toastMessage = "Slot removed";
      await loadRota();
    } catch { toastMessage = "Failed to remove slot"; }
    deleteTarget = null;
    setTimeout(() => toastMessage = "", 3000);
  }

  async function toggleSlot(slot: any) {
    const newStatus = slot.status === "assigned" ? "declined" : "assigned";
    try {
      await updateRotaSlot(slot.id, { status: newStatus });
      await loadRota();
    } catch { toastMessage = "Failed to update slot"; }
  }
</script>

<svelte:head>
  <title>Duty Rota — Theobase</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center gap-3">
    <h1 class="text-2xl font-bold text-slate-900">Duty Rota</h1>
    <a href="/help" class="rounded-full p-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Learn more about Duty Rota">
      <HelpCircle class="size-4 text-slate-400" />
    </a>
  </div>

  <div class="flex items-center gap-3">
    <Button variant="ghost" size="icon" onclick={prevWeek} aria-label="Previous week">
      <ChevronLeft class="size-4" />
    </Button>
    <Input type="date" bind:value={date} onchange={loadRota} class="flex-1" />
    <Button variant="ghost" size="icon" onclick={nextWeek} aria-label="Next week">
      <ChevronRight class="size-4" />
    </Button>
    <Button size="sm" onclick={() => showForm = !showForm}>
      {#if showForm}<X class="size-4" />{:else}<Plus class="size-4" />{/if}
      Add Slot
    </Button>
  </div>

  {#if toastMessage}
    <div class="rounded-lg bg-brand-50 px-4 py-2 text-sm font-medium text-brand-900">{toastMessage}</div>
  {/if}

  {#if showForm}
    <Card>
      <CardContent class="space-y-3 p-4">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-sm font-medium text-slate-700">Role</label>
            <Select bind:selected={formRole}>
              <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
              <SelectContent>
                {#each ROLES as r}
                  <SelectItem value={r.value}>{r.label}</SelectItem>
                {/each}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label class="text-sm font-medium text-slate-700">Volunteer ID (optional)</label>
            <Input placeholder="Person ID" bind:value={formVolunteerId} />
          </div>
        </div>
        <div class="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onclick={() => showForm = false}>Cancel</Button>
          <Button size="sm" onclick={addSlot} disabled={submitting}>
            {submitting ? 'Adding...' : 'Add Slot'}
          </Button>
        </div>
      </CardContent>
    </Card>
  {/if}

  {#if loading}
    <div class="space-y-3">
      <Skeleton class="h-16" /><Skeleton class="h-16" /><Skeleton class="h-16" />
    </div>
  {:else if loadError}
    <div class="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <p class="text-sm text-red-600">{loadError}</p>
      <button class="mt-3 text-sm font-medium text-red-700 underline" onclick={loadRota}>Try again</button>
    </div>
  {:else if slots.length === 0}
    <div class="flex flex-col items-center gap-3 py-12">
      <CalendarCheck class="size-8 text-slate-300" />
      <p class="text-sm text-slate-500">No duty assignments for this date. Click "Add Slot" to build the rota.</p>
    </div>
  {:else}
    <div class="space-y-3">
      <StaggerList each={slots}>
        {#snippet children(slot, index)}
          <Card>
            <CardContent class="flex items-center justify-between p-4">
              <div>
                <p class="font-semibold capitalize text-slate-900">
                  {ROLES.find(r => r.value === slot.role)?.label || slot.role?.replace(/_/g, ' ')}
                </p>
                {#if slot.volunteerName}
                  <p class="text-sm text-slate-500">{slot.volunteerName}</p>
                {/if}
              </div>
              <div class="flex items-center gap-2">
                <Badge variant={statusVariant[slot.status] || 'secondary'}>
                  {slot.status}
                </Badge>
                <Button variant="ghost" size="icon" class="size-8" onclick={() => toggleSlot(slot)} title={slot.status === "assigned" ? "Decline" : "Assign"}>
                  {#if slot.status === "assigned"}<X class="size-3.5" />{:else}<Check class="size-3.5" />{/if}
                </Button>
                <Button variant="ghost" size="icon" class="size-8 text-red-500 hover:bg-red-50" onclick={() => { deleteTarget = slot; }} title="Delete slot">
                  <Trash2 class="size-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        {/snippet}
      </StaggerList>
    </div>
  {/if}
</div>

<ConfirmDialog
  open={deleteTarget !== null}
  onOpenChange={() => deleteTarget = null}
  title="Remove slot"
  description="Remove this duty slot from the rota?"
  confirmLabel="Remove"
  variant="destructive"
  onconfirm={confirmDelete}
/>
