<script lang="ts">
  import { getSafetyClearances, createSafetyClearance, deleteSafetyClearance } from '$lib/api';
  import { requireRole } from "$lib/guard";
  import { onMount } from 'svelte';
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Badge } from "$lib/components/ui/badge";
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "$lib/components/ui/select";
  import { Skeleton } from "$lib/components/ui/skeleton";
  import { Separator } from "$lib/components/ui/separator";
  import ConfirmDialog from "$lib/components/ConfirmDialog.svelte";
  import { ShieldCheck, ShieldAlert, Plus, Trash2 } from "@lucide/svelte";
  import DataToolbar from "$lib/components/DataToolbar.svelte";

  let clearances = $state<any[]>([]);
  let loading = $state(true);
  let search = $state('');
  let showForm = $state(false);
  let formVolunteerId = $state('');
  let formType = $state('background_check');
  let formIssued = $state(new Date().toISOString().slice(0, 10));
  let formExpiry = $state('');
  let submitting = $state(false);
  let deleteTarget = $state<any>(null);
  let toast = $state('');

  const filtered = $derived(search ? clearances.filter((c: any) =>
    c.volunteerId?.includes(search) || c.type?.includes(search)
  ) : clearances);

  async function load() {
    loading = true;
    try { clearances = await getSafetyClearances(); }
    catch { clearances = []; }
    loading = false;
  }

  async function addClearance() {
    if (!formVolunteerId || !formExpiry) return;
    submitting = true;
    try {
      await createSafetyClearance({ volunteerId: formVolunteerId, type: formType, issuedDate: formIssued, expiryDate: formExpiry });
      showForm = false; formVolunteerId = ''; formExpiry = '';
      toast = 'Clearance recorded'; await load();
    } catch { toast = 'Failed to create clearance'; }
    submitting = false;
    setTimeout(() => toast = '', 3000);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try { await deleteSafetyClearance(deleteTarget.id); toast = 'Cleared'; await load(); }
    catch { toast = 'Failed to delete'; }
    deleteTarget = null;
  }

  onMount(async () => { if (!await requireRole("clerk")) return; load(); });

  function expiryStatus(date: string) {
    if (!date) return 'unknown';
    return new Date(date) < new Date() ? 'expired' : 'valid';
  }
</script>

<svelte:head><title>Safety Clearances — Theobase</title></svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-bold text-slate-900">Safety Clearances</h1>
    <Button size="sm" onclick={() => showForm = !showForm}>
      <Plus class="size-4" /> {showForm ? 'Cancel' : 'Record Clearance'}
    </Button>
  </div>

  {#if toast}
    <div class="rounded-lg bg-brand-50 px-4 py-2 text-sm font-medium text-brand-900">{toast}</div>
  {/if}

  {#if showForm}
    <Card>
      <CardHeader><CardTitle>Record Clearance</CardTitle></CardHeader>
      <CardContent class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-sm font-medium">Volunteer Person ID</label>
            <Input placeholder="Person ID" bind:value={formVolunteerId} />
          </div>
          <div>
            <label class="text-sm font-medium">Clearance Type</label>
            <Select value={formType} onValueChange={(v) => formType = v || 'background_check'}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="background_check">Background Check</SelectItem>
                <SelectItem value="child_protection">Child Protection</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label class="text-sm font-medium">Issued Date</label>
            <Input type="date" bind:value={formIssued} />
          </div>
          <div>
            <label class="text-sm font-medium">Expiry Date</label>
            <Input type="date" bind:value={formExpiry} />
          </div>
        </div>
        <Button onclick={addClearance} disabled={submitting}>{submitting ? 'Saving...' : 'Save Clearance'}</Button>
      </CardContent>
    </Card>
  {/if}

  {#if loading}
    <div class="space-y-3"><Skeleton class="h-16" /><Skeleton class="h-16" /></div>
  {:else if filtered.length === 0}
    <div class="flex flex-col items-center gap-3 py-12">
      <ShieldCheck class="size-8 text-slate-300" />
      <p class="text-sm text-slate-500">No safety clearances recorded.</p>
    </div>
  {:else}
    <DataToolbar bind:search />
    <div class="space-y-2">
      {#each filtered as c (c.id)}
        <Card>
          <CardContent class="flex items-center justify-between p-4">
            <div class="flex items-center gap-3">
              {#if expiryStatus(c.expiryDate) === 'expired'}
                <ShieldAlert class="size-5 text-red-500" />
              {:else}
                <ShieldCheck class="size-5 text-green-500" />
              {/if}
              <div>
                <p class="font-medium text-sm">{c.type?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</p>
                <p class="text-xs text-slate-500">Volunteer: {c.volunteerId?.slice(0, 8)} — Issued: {c.issuedDate} — Expires: {c.expiryDate}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <Badge variant={expiryStatus(c.expiryDate) === 'expired' ? 'destructive' : 'default'}>
                {expiryStatus(c.expiryDate)}
              </Badge>
              <Button variant="ghost" size="icon" class="size-8 text-red-500" onclick={() => deleteTarget = c}>
                <Trash2 class="size-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      {/each}
    </div>
  {/if}
</div>

<ConfirmDialog open={deleteTarget !== null} onOpenChange={() => deleteTarget = null} title="Delete clearance"
  description="Remove this safety clearance record?" confirmLabel="Delete" variant="destructive" onconfirm={confirmDelete} />
