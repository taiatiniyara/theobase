<script lang="ts">
  import { getReceipts, createReceipt, API_URL } from "$lib/api";
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
  import { Plus, Receipt, X, Square, CheckSquare } from "@lucide/svelte";
  import { formatCents } from "$lib/format";
  import DataToolbar from "$lib/components/DataToolbar.svelte";
  import DateRangeFilter from "$lib/components/DateRangeFilter.svelte";
  import StaggerList from "$lib/components/StaggerList.svelte";
  import Celebration from "$lib/components/Celebration.svelte";

  let receiptSearch = $state("");
  let receiptSortKey = $state("amount");
  let receiptSortDir = $state<"asc" | "desc">("desc");
  let selectedIds = $state<Set<string>>(new Set());
  let dateRange = $state<{ from: string; to: string } | null>(null);

  let receipts = $state<any[]>([]);
  const PAGE_SIZE = 20;
  let loading = $state(true);
  let loadError = $state("");
  let hasMore = $state(true);
  let loadingMore = $state(false);
  let submitting = $state(false);
  let showForm = $state(false);
  let formError = $state("");
  let showCelebration = $state(false);
  let celebrationMessage = $state("");

  let amountCents = $state(0);
  let file = $state<File | null>(null);
  let filePreview = $state("");
  let fundSplits = $state([{ name: "tithe", value: 0 }, { name: "church_budget", value: 0 }]);

  const fundOptions = ["tithe", "church_budget", "pathfinders", "sabbath_school", "adra", "local_church"];

  function addFund() {
    fundSplits = [...fundSplits, { name: "", value: 0 }];
  }

  function handleFile(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) {
      file = f;
      filePreview = URL.createObjectURL(f);
    }
  }

  function removeFund(index: number) {
    const removed = fundSplits[index];
    fundSplits = fundSplits.filter((_, i) => i !== index);
    toast("Fund removed", {
      action: {
        label: "Undo",
        onClick: () => {
          fundSplits = [...fundSplits.slice(0, index), removed, ...fundSplits.slice(index)];
        },
      },
    });
  }

  function updateFundName(index: number, name: string) {
    fundSplits = fundSplits.map((f, i) => i === index ? { ...f, name } : f);
  }

  function updateFundValue(index: number, value: number) {
    fundSplits = fundSplits.map((f, i) => i === index ? { ...f, value } : f);
  }

  async function submit() {
    formError = "";
    const split: Record<string, number> = {};
    let total = 0;
    for (const f of fundSplits) {
      if (!f.name) { formError = "All fund categories must be selected."; return; }
      split[f.name] = f.value;
      total += f.value;
    }
    if (total !== amountCents) {
      formError = `Fund splits ($${(total / 100).toFixed(2)}) don't match total ($${(amountCents / 100).toFixed(2)}).`;
      return;
    }
    submitting = true;
    try {
      const result = await createReceipt({ amount: amountCents, fundSplit: split });
      if (result.error) { formError = result.error; return; }
      showForm = false;
      receipts = [result, ...receipts];
      if (file && result.id) {
        const formData = new FormData();
        formData.append("file", file);
        await fetch(`${API_URL}/receipts/${result.id}/upload`, {
          method: "POST",
          credentials: "include",
          body: formData,
        });
        file = null;
        filePreview = "";
      }
      toast.success("Receipt submitted.");
      if (receipts.length === 1) {
        celebrationMessage = "Your first receipt! Thank you for giving.";
        showCelebration = true;
      }
    } catch { formError = "Failed to submit receipt."; }
    finally { submitting = false; }
  }

  async function loadReceipts() {
    loading = true;
    loadError = "";
    try { receipts = await getReceipts(PAGE_SIZE, 0); } catch { loadError = "Failed to load receipts."; }
    hasMore = receipts.length >= PAGE_SIZE;
    loading = false;
  }

  async function loadMore() {
    loadingMore = true;
    try {
      const more = await getReceipts(PAGE_SIZE, receipts.length);
      receipts = [...receipts, ...more];
      hasMore = more.length >= PAGE_SIZE;
    } catch { loadError = "Failed to load more receipts."; }
    loadingMore = false;
  }

  onMount(async () => {
    const authorized = await requireRole("clerk", "treasurer", "member");
    if (!authorized) return;
    loadReceipts();
  });

  const filteredReceipts = $derived(
    receipts
      .filter(r => !receiptSearch || r.id?.includes(receiptSearch) || r.status?.includes(receiptSearch.toLowerCase()))
      .filter(r => {
        if (!dateRange) return true;
        const d = r.createdAt || "";
        if (dateRange.from && d < dateRange.from) return false;
        if (dateRange.to && d > dateRange.to) return false;
        return true;
      })
      .sort((a, b) => {
        const aVal = receiptSortKey === "amount" ? (a.amount || 0) : (a.status || "");
        const bVal = receiptSortKey === "amount" ? (b.amount || 0) : (b.status || "");
        const cmp = typeof aVal === "string" ? aVal.localeCompare(bVal) : aVal - bVal;
        return receiptSortDir === "asc" ? cmp : -cmp;
      })
  );

  function statusBadge(s: string) {
    if (s === "approved") return "bg-green-100 text-green-700";
    if (s === "rejected") return "bg-red-100 text-red-700";
    return "bg-amber-100 text-amber-700";
  }
</script>

<svelte:head>
  <title>Giving — Theobase</title>
</svelte:head>

<div class="space-y-6">
  <h1 class="text-2xl font-bold text-slate-900">Giving</h1>

  {#if loading}
    <Skeleton class="h-10 w-36" />
    <Skeleton class="h-24" />
  {:else if loadError}
    <div class="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <p class="text-sm text-red-600">{loadError}</p>
      <button class="mt-3 text-sm font-medium text-red-700 underline" onclick={loadReceipts}>Try again</button>
    </div>
  {:else}
    {#if !showForm}
      <Button onclick={() => showForm = true}>
        <Plus class="size-4" /> New Receipt
      </Button>
    {:else}
      <Card>
        <CardHeader>
          <CardTitle>Submit Receipt</CardTitle>
          <CardDescription>Record your giving with fund allocation</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <Label for="amount">Amount ($)</Label>
            <p class="text-xs text-slate-400">Enter the total amount in dollars (e.g. 50.00).</p>
            <Input
              id="amount"
              type="text"
              placeholder="0.00"
              value={amountCents ? formatCents(amountCents) : ""}
              oninput={(e) => {
                const v = parseFloat((e.target as HTMLInputElement).value) || 0;
                amountCents = Math.round(v * 100);
              }}
            />
          </div>

          <div class="space-y-2">
            <Label for="receipt-file">Receipt Image</Label>
            <p class="text-xs text-slate-400">Upload a screenshot or photo of your bank transfer confirmation.</p>
            <Input id="receipt-file" type="file" accept="image/*" onchange={handleFile} />
            {#if filePreview}
              <img src={filePreview} alt="Preview" class="max-h-40 rounded-lg border object-cover" />
            {/if}
          </div>

          <div class="space-y-2">
            <Label>Fund Split</Label>
            <p class="text-xs text-slate-400">Split your donation across church funds. The total should equal your transfer amount.</p>
            {#each fundSplits as fund, i}
              <div class="flex gap-2">
                <Select value={fund.name} onValueChange={(v) => updateFundName(i, v ?? "")}>
                  <SelectTrigger class="flex-1 h-10">
                    <SelectValue placeholder="Select fund..." />
                  </SelectTrigger>
                  <SelectContent>
                    {#each fundOptions as opt}
                      <SelectItem value={opt} disabled={fundSplits.some((f, j) => f.name === opt && j !== i)}>
                        {opt.replace(/_/g, " ")}
                      </SelectItem>
                    {/each}
                  </SelectContent>
                </Select>
                <Input
                  type="text"
                  placeholder="0.00"
                  class="w-28 shrink-0"
                  value={fund.value ? (fund.value / 100).toFixed(2) : ""}
                  oninput={(e) => {
                    const v = parseFloat((e.target as HTMLInputElement).value) || 0;
                    updateFundValue(i, Math.round(v * 100));
                  }}
                  onkeydown={(e) => {
                    if (e.key === "Tab" && !e.shiftKey && i === fundSplits.length - 1 && fundSplits.length < fundOptions.length) {
                      e.preventDefault();
                      addFund();
                    }
                  }}
                />
                {#if fundSplits.length > 1}
                  <Button variant="ghost" size="icon" class="shrink-0" onclick={() => removeFund(i)} aria-label="Remove fund split">
                    <X class="size-4 text-slate-400" />
                  </Button>
                {/if}
              </div>
            {/each}
            {#if fundSplits.length < fundOptions.length}
              <Button type="button" variant="outline" size="sm" onclick={addFund}>
                <Plus class="size-3.5" /> Add fund
              </Button>
            {/if}
          </div>

          {#if formError}
            <p class="text-sm text-red-600">{formError}</p>
          {/if}

          <div class="flex gap-2">
            <Button onclick={submit} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Receipt"}
            </Button>
            <Button variant="outline" onclick={() => showForm = false}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    {/if}

    <DataToolbar
      searchPlaceholder="Search receipts..."
      sortOptions={[
        { label: "Amount", key: "amount" },
        { label: "Status", key: "status" },
      ]}
      sortKey={receiptSortKey}
      sortDir={receiptSortDir}
      onsearch={(q) => receiptSearch = q}
      onsort={(key, dir) => { receiptSortKey = key; receiptSortDir = dir; }}
      resultCount={filteredReceipts.length}
      totalCount={receipts.length}
    />

    <DateRangeFilter onchange={(r) => dateRange = r} />

    {#if receipts.length > 0}
      <div class="flex items-center gap-3">
        <button
          class="flex items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors hover:bg-slate-100"
          onclick={() => {
            if (selectedIds.size === filteredReceipts.length) {
              selectedIds = new Set();
            } else {
              selectedIds = new Set(filteredReceipts.map(r => r.id));
            }
          }}
          aria-label={selectedIds.size === filteredReceipts.length ? "Deselect all" : "Select all"}
        >
          {#if selectedIds.size === filteredReceipts.length && filteredReceipts.length > 0}
            <CheckSquare class="size-5 text-brand-600" />
          {:else}
            <Square class="size-5 text-slate-300" />
          {/if}
          <span class="text-xs text-slate-500">Select all</span>
        </button>
      </div>
    {/if}

    {#if selectedIds.size > 0}
      <div class="flex items-center gap-3 rounded-lg bg-brand-50 dark:bg-brand-950 px-4 py-2">
        <span class="text-sm font-medium text-brand-900 dark:text-brand-200">{selectedIds.size} selected</span>
        <Button variant="outline" size="sm" onclick={() => selectedIds = new Set()}>Clear</Button>
      </div>
    {/if}

    {#if receipts.length === 0}
      <Card>
        <CardContent class="flex flex-col items-center gap-3 py-8">
          <Receipt class="size-8 text-slate-300" />
          <div class="text-center">
            <p class="text-sm font-medium text-slate-700 dark:text-slate-300">No receipts yet</p>
            <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Submit your first giving receipt above. Upload a bank transfer screenshot and split the amount across church funds.
            </p>
          </div>
        </CardContent>
      </Card>
    {:else}
      <div class="space-y-3">
        <StaggerList each={filteredReceipts}>
          {#snippet children(receipt, index)}
            <Card>
              <CardContent class="pt-6">
                <div class="flex items-start gap-3">
                  <button
                    class="shrink-0 mt-1"
                    onclick={() => {
                      const next = new Set(selectedIds);
                      if (next.has(receipt.id)) next.delete(receipt.id); else next.add(receipt.id);
                      selectedIds = next;
                    }}
                    aria-label={selectedIds.has(receipt.id) ? "Deselect" : "Select"}
                  >
                    {#if selectedIds.has(receipt.id)}
                      <CheckSquare class="size-5 text-brand-600" />
                    {:else}
                      <Square class="size-5 text-slate-300" />
                    {/if}
                  </button>
                  <div class="flex-1">
                    <div class="flex items-start justify-between">
                      <div>
                        <p class="text-xs text-slate-400">Receipt #{receipt.id?.slice(0, 8)}</p>
                        <p class="text-xl font-bold text-slate-900">${formatCents(receipt.amount)}</p>
                      </div>
                      <Badge class={statusBadge(receipt.status)}>{receipt.status}</Badge>
                    </div>
                  {#if receipt.fundSplit}
                    <div class="mt-3 space-y-1 border-t pt-3">
                      {#each Object.entries(receipt.fundSplit) as [fund, val]}
                        <div class="flex justify-between text-sm">
                          <span class="capitalize text-slate-500">{fund.replace(/_/g, " ")}</span>
                          <span class="font-medium">${formatCents(val as number)}</span>
                        </div>
                      {/each}
                    </div>
                  {/if}
                  </div>
                </div>
              </CardContent>
            </Card>
          {/snippet}
        </StaggerList>
      </div>
      {#if hasMore}
        <div class="flex justify-center pt-2">
          <Button variant="outline" onclick={loadMore} disabled={loadingMore}>
            {loadingMore ? "Loading..." : "Load more"}
          </Button>
        </div>
      {/if}
    {/if}
  {/if}
  <Celebration trigger={showCelebration} message={celebrationMessage} />
</div>
