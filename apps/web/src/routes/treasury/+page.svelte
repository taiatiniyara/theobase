<script lang="ts">
  import { getTreasuryBalance, getExpenses, createExpense, getReceipts, getBoardMeetings } from "$lib/api";
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
  import { Landmark, Plus, DollarSign } from "@lucide/svelte";
  import { formatDate, formatCents } from "$lib/format";
  import DataToolbar from "$lib/components/DataToolbar.svelte";
  import DateRangeFilter from "$lib/components/DateRangeFilter.svelte";

  let expenseSearch = $state("");
  let expenseSortKey = $state("description");
  let expenseSortDir = $state<"asc" | "desc">("asc");
  let expenseDateRange = $state<{ from: string; to: string } | null>(null);

  let balance = $state<Record<string, number>>({});
  let expenses = $state<any[]>([]);
  let receipts = $state<any[]>([]);
  let meetings = $state<any[]>([]);
  const PAGE_SIZE = 20;
  let loading = $state(true);
  let loadError = $state("");
  let hasMore = $state(true);
  let loadingMore = $state(false);
  let submitting = $state(false);
  let showForm = $state(false);
  let formError = $state("");

  let expAmount = $state(0);
  let expDesc = $state("");
  let expCategory = $state("church_budget");
  let expReceiptId = $state("");
  let expDecisionId = $state("");

  const categories = ["church_budget", "pathfinders", "sabbath_school", "adra", "local_church", "dorcas", "health"];

  async function submitExpense() {
    formError = "";
    if (!expAmount || !expDesc) { formError = "Amount and description required."; return; }
    submitting = true;
    try {
      const result = await createExpense({
        amount: expAmount,
        description: expDesc,
        category: expCategory,
        receiptId: expReceiptId || undefined,
        boardDecisionId: expDecisionId || undefined,
      });
      if (result.error) { formError = result.error; return; }
      expenses = [...expenses, result];
      showForm = false;
      expAmount = 0; expDesc = ""; expReceiptId = ""; expDecisionId = "";
      balance = await getTreasuryBalance();
      toast.success("Expense recorded.");
    } catch { formError = "Failed to create expense."; }
    finally { submitting = false; }
  }

  async function loadData() {
    loading = true;
    loadError = "";
    try {
      const [b, e, r, m] = await Promise.all([
        getTreasuryBalance(), getExpenses(PAGE_SIZE, 0), getReceipts(), getBoardMeetings(),
      ]);
      balance = b;
      expenses = e;
      hasMore = e.length >= PAGE_SIZE;
      receipts = r.filter((rec: any) => rec.status === "approved");
      meetings = m;
    } catch { loadError = "Failed to load treasury data."; }
    loading = false;
  }

  async function loadMore() {
    loadingMore = true;
    try {
      const more = await getExpenses(PAGE_SIZE, expenses.length);
      expenses = [...expenses, ...more];
      hasMore = more.length >= PAGE_SIZE;
    } catch {}
    loadingMore = false;
  }

  onMount(async () => {
    const authorized = await requireRole("clerk", "treasurer");
    if (!authorized) return;
    loadData();
  });

  const filteredExpenses = $derived(
    expenses
      .filter(e => !expenseSearch || e.description?.toLowerCase().includes(expenseSearch.toLowerCase()) || e.category?.toLowerCase().includes(expenseSearch.toLowerCase()))
      .filter(e => {
        if (!expenseDateRange) return true;
        const d = e.createdAt || "";
        if (expenseDateRange.from && d < expenseDateRange.from) return false;
        if (expenseDateRange.to && d > expenseDateRange.to) return false;
        return true;
      })
      .sort((a, b) => {
        const aVal = expenseSortKey === "description" ? (a.description || "") : (a.amount || 0);
        const bVal = expenseSortKey === "description" ? (b.description || "") : (b.amount || 0);
        const cmp = typeof aVal === "string" ? aVal.localeCompare(bVal) : aVal - bVal;
        return expenseSortDir === "asc" ? cmp : -cmp;
      })
  );

  function formatFund(fund: string) { return fund.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()); }
</script>

<svelte:head>
  <title>Treasury — Theobase</title>
</svelte:head>

<div class="space-y-6">
  <h1 class="text-2xl font-bold text-slate-900">Treasury</h1>

  {#if loading}
    <Skeleton class="h-40" />
    <Skeleton class="h-10 w-36" />
  {:else if loadError}
    <div class="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <p class="text-sm text-red-600">{loadError}</p>
      <button class="mt-3 text-sm font-medium text-red-700 underline" onclick={loadData}>Try again</button>
    </div>
  {:else}
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Landmark class="size-5" /> Fund Balances
        </CardTitle>
        <CardDescription>Current balance per fund</CardDescription>
      </CardHeader>
      <CardContent>
        {#if Object.keys(balance).length === 0}
          <div class="flex flex-col items-center gap-3 py-6">
            <Landmark class="size-8 text-slate-300" />
            <p class="text-sm text-slate-500">No fund activity yet.</p>
            <Button variant="outline" size="sm" onclick={() => showForm = true}>Record an expense</Button>
          </div>
        {:else}
          <div class="divide-y">
            {#each Object.entries(balance) as [fund, amount]}
              <div class="flex items-center justify-between py-2.5">
                <span class="text-sm capitalize text-slate-600">{formatFund(fund)}</span>
                <span class="text-sm font-semibold {amount >= 0 ? 'text-green-600' : 'text-red-600'}">
                  ${formatCents(amount)}
                </span>
              </div>
            {/each}
          </div>
        {/if}
      </CardContent>
    </Card>

    {#if !showForm}
      <Button onclick={() => showForm = true}>
        <Plus class="size-4" /> New Expense
      </Button>
    {:else}
      <Card>
        <CardHeader>
          <CardTitle>Record Expense</CardTitle>
          <CardDescription>Log a new expense with linked receipt or board decision</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <Label for="exp-amount">Amount ($)</Label>
            <Input
              id="exp-amount"
              type="text"
              placeholder="0.00"
              value={expAmount ? (expAmount / 100).toFixed(2) : ""}
              oninput={(e) => {
                const v = parseFloat((e.target as HTMLInputElement).value) || 0;
                expAmount = Math.round(v * 100);
              }}
            />
          </div>

          <div class="space-y-2">
            <Label for="exp-desc">Description</Label>
            <Input id="exp-desc" bind:value={expDesc} placeholder="Electricity bill" />
          </div>

          <div class="space-y-2">
            <Label for="exp-cat">Category</Label>
            <Select bind:value={expCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {#each categories as cat}
                  <SelectItem value={cat}>{formatFund(cat)}</SelectItem>
                {/each}
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label for="exp-receipt">Linked Receipt (optional)</Label>
            <Select bind:value={expReceiptId}>
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {#each receipts as r}
                  <SelectItem value={r.id}>#{r.id?.slice(0, 8)} — ${formatCents(r.amount)}</SelectItem>
                {/each}
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label for="exp-decision">Board Decision (optional)</Label>
            <Select bind:value={expDecisionId}>
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {#each meetings as m}
                  <SelectItem value={m.id}>{formatDate(m.date)}</SelectItem>
                {/each}
              </SelectContent>
            </Select>
          </div>

          {#if formError}
            <p class="text-sm text-red-600">{formError}</p>
          {/if}

          <div class="flex gap-2">
            <Button onclick={submitExpense} disabled={submitting}>
              {submitting ? "Recording..." : "Record Expense"}
            </Button>
            <Button variant="outline" onclick={() => showForm = false}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    {/if}

    <DataToolbar
      searchPlaceholder="Search expenses..."
      sortOptions={[
        { label: "Description", key: "description" },
        { label: "Amount", key: "amount" },
      ]}
      sortKey={expenseSortKey}
      sortDir={expenseSortDir}
      onsearch={(q) => expenseSearch = q}
      onsort={(key, dir) => { expenseSortKey = key; expenseSortDir = dir; }}
      resultCount={filteredExpenses.length}
      totalCount={expenses.length}
    />

    <DateRangeFilter onchange={(r) => expenseDateRange = r} />

    <Card>
      <CardHeader>
        <CardTitle>Expenses ({expenses.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {#if expenses.length === 0}
          <div class="flex flex-col items-center gap-3 rounded-lg border border-dashed border-slate-200 bg-white dark:bg-slate-900 py-12">
            <DollarSign class="size-8 text-slate-300" />
            <p class="text-sm text-slate-500">No expenses recorded yet.</p>
            <Button variant="outline" size="sm" onclick={() => showForm = true}>Record your first expense</Button>
          </div>
        {:else}
          <div class="divide-y">
            {#each filteredExpenses as exp}
              <div class="flex items-center justify-between py-2.5">
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium">{exp.description}</p>
                  <div class="flex gap-2">
                    <Badge variant="secondary" class="text-xs">{formatFund(exp.category)}</Badge>
                    {#if exp.receiptId}
                      <span class="text-xs text-slate-400">Receipt #{exp.receiptId?.slice(0, 8)}</span>
                    {/if}
                  </div>
                </div>
                <span class="ml-3 shrink-0 text-sm font-semibold text-red-600">-${formatCents(exp.amount)}</span>
              </div>
            {/each}
          </div>
        {/if}
        {#if hasMore}
          <div class="flex justify-center pt-2">
            <Button variant="outline" onclick={loadMore} disabled={loadingMore}>
              {loadingMore ? "Loading..." : "Load more"}
            </Button>
          </div>
        {/if}
      </CardContent>
    </Card>
  {/if}
</div>
