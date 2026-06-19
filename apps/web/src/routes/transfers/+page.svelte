<script lang="ts">
  import { getTransfers, createTransfer, updateTransferStatus } from '$lib/api';
  import { onMount } from 'svelte';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Badge } from '$lib/components/ui/badge';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import { ArrowRightLeft } from '@lucide/svelte';
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
  import DataToolbar from "$lib/components/DataToolbar.svelte";

  let transfers = $state<any[]>([]);
  let rejectId = $state<string | null>(null);
  let loading = $state(true);
  let loadError = $state("");
  let actionError = $state("");
  let submitting = $state(false);

  let searchQuery = $state("");
  let sortKey = $state("status");
  let sortDir = $state<"asc" | "desc">("asc");

  const filteredTransfers = $derived(
    transfers
      .filter(t => !searchQuery ||
        Object.values(t).some(v => String(v).toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .sort((a, b) => {
        const aVal = a[sortKey] ?? "";
        const bVal = b[sortKey] ?? "";
        const cmp = String(aVal).localeCompare(String(bVal));
        return sortDir === "asc" ? cmp : -cmp;
      })
  );

  let tfMemberId = $state('');
  let tfToCongregation = $state('');

  const statusLabels: Record<string, string> = {
    requested: 'Requested',
    approved_by_sending: 'Approved (Sending)',
    received_by_destination: 'Received',
    completed: 'Completed',
    rejected: 'Rejected',
  };

  const nextActions: Record<string, { label: string; status: string }[]> = {
    requested: [
      { label: 'Approve', status: 'approved_by_sending' },
      { label: 'Reject', status: 'rejected' },
    ],
    approved_by_sending: [
      { label: 'Receive', status: 'received_by_destination' },
      { label: 'Reject', status: 'rejected' },
    ],
    received_by_destination: [
      { label: 'Complete', status: 'completed' },
    ],
  };

  async function loadTransfers() {
    try { transfers = await getTransfers(); } catch { 
      loadError = "Failed to load. Please try again.";
    }
    loading = false;
  }

  async function addTransfer() {
    if (!tfMemberId || !tfToCongregation) return;
    actionError = "";
    submitting = true;
    try {
      const result = await createTransfer({ memberId: tfMemberId, toCongregationId: tfToCongregation });
      transfers = [result, ...transfers];
      tfMemberId = ''; tfToCongregation = '';
    } catch { 
      actionError = "Failed to create transfer. Please try again.";
    }
    submitting = false;
  }

  async function transition(id: string, status: string) {
    actionError = "";
    submitting = true;
    try {
      const updated = await updateTransferStatus(id, status);
      transfers = transfers.map(t => t.id === id ? updated : t);
    } catch { 
      actionError = "Failed to update transfer. Please try again.";
    }
    submitting = false;
  }

  async function confirmReject() {
    if (rejectId) {
      await transition(rejectId, 'rejected');
      rejectId = null;
    }
  }

  onMount(loadTransfers);
</script>

<svelte:head><title>Transfers — Theobase</title></svelte:head>

<div class="space-y-6">
  <h1 class="text-2xl font-bold text-slate-900">Membership Transfers</h1>

  <Card>
    <CardHeader>
      <CardTitle>Request Transfer</CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="space-y-2">
        <Label for="tf-member">Member ID</Label>
        <Input id="tf-member" bind:value={tfMemberId} placeholder="person-1" />
      </div>
      <div class="space-y-2">
        <Label for="tf-cong">To Congregation ID</Label>
        <Input id="tf-cong" bind:value={tfToCongregation} placeholder="church-2" />
      </div>
      <Button onclick={addTransfer} disabled={!tfMemberId || !tfToCongregation || submitting}>Request Transfer</Button>
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
        onclick={() => { loadError = ""; loadTransfers(); }}
      >
        Try again
      </button>
    </div>
  {:else if loading}
    <div class="space-y-3">
      <Skeleton class="h-24" />
      <Skeleton class="h-24" />
    </div>
  {:else if transfers.length === 0}
    <div class="flex flex-col items-center gap-3 rounded-lg border border-dashed border-slate-200 bg-white dark:bg-slate-900 py-12">
      <ArrowRightLeft class="size-8 text-slate-300" />
      <p class="text-sm text-slate-500">No transfer requests.</p>
      <Button variant="outline" size="sm" onclick={() => document.getElementById('tf-member')?.focus()}>Request your first transfer</Button>
    </div>
  {:else}
    <DataToolbar
      searchPlaceholder="Search transfers..."
      sortOptions={[{ label: "Status", key: "status" }, { label: "Member ID", key: "memberId" }]}
      sortKey={sortKey}
      sortDir={sortDir}
      onsearch={(q) => searchQuery = q}
      onsort={(k, d) => { sortKey = k; sortDir = d; }}
      resultCount={filteredTransfers.length}
      totalCount={transfers.length}
    />
    {#each filteredTransfers as t}
      <div class="border rounded-lg bg-white dark:bg-slate-900 p-4">
        <div class="flex justify-between items-start">
          <div>
            <div class="font-semibold text-slate-900">Transfer #{t.id?.slice(0, 8)}</div>
            <div class="text-sm text-slate-500">
              Member: {t.memberId} → {t.toCongregationId}
            </div>
          </div>
          <Badge variant="secondary" class={t.status === 'completed' ? 'bg-green-100 text-green-700' : t.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}>
            {statusLabels[t.status] || t.status}
          </Badge>
        </div>
        {#if nextActions[t.status]}
          <div class="mt-3 flex gap-2">
            {#each nextActions[t.status] as action}
              <Button
                variant={action.status === 'rejected' ? 'destructive' : 'outline'}
                size="sm"
                onclick={() => action.status === 'rejected' ? rejectId = t.id : transition(t.id, action.status)}
              >
                {action.label}
              </Button>
            {/each}
          </div>
        {/if}
      </div>
    {/each}
  {/if}

  <ConfirmDialog
    open={rejectId !== null}
    onOpenChange={(o) => { if (!o) rejectId = null; }}
    title="Reject transfer"
    description="Are you sure you want to reject this membership transfer? This cannot be undone."
    confirmLabel="Reject"
    variant="destructive"
    onconfirm={confirmReject}
  />
</div>
