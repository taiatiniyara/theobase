<script lang="ts">
  import { api, getMe } from '$lib/api';
  import { requireRole } from "$lib/guard";
  import { onMount } from 'svelte';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import { Download, FileSpreadsheet } from '@lucide/svelte';

  let stats = $state<any>(null);
  let loading = $state(true);
  let congId = $state('');
  let exportText = $state('');
  let quarterStart = $state('');
  let quarterEnd = $state('');

  function setCurrentQuarter() {
    const now = new Date();
    const q = Math.floor(now.getMonth() / 3);
    quarterStart = `${now.getFullYear()}-${String(q * 3 + 1).padStart(2, '0')}-01`;
    const endMonth = q * 3 + 3;
    quarterEnd = `${now.getFullYear()}-${String(endMonth).padStart(2, '0')}-${new Date(now.getFullYear(), endMonth, 0).getDate()}`;
  }

  function inRange(date: string) {
    if (!quarterStart || !quarterEnd) return true;
    return date >= quarterStart && date <= quarterEnd;
  }

  async function loadStats() {
    loading = true;
    try {
      const [receipts, expenses, transfers, meetings] = await Promise.all([
        api('/receipts').then(r => r.json()),
        api('/treasury/expenses').then(r => r.json()),
        api('/transfers').then(r => r.json()),
        api('/board/meetings').then(r => r.json()),
      ]);

      const receiptsArr: any[] = Array.isArray(receipts) ? receipts : [];
      const expensesArr: any[] = Array.isArray(expenses) ? expenses : [];
      const transfersArr: any[] = Array.isArray(transfers) ? transfers : [];
      const meetingsArr: any[] = Array.isArray(meetings) ? meetings : [];

      const filteredReceipts = receiptsArr.filter((r: any) => inRange(r.createdAt));
      const filteredExpenses = expensesArr.filter((e: any) => inRange(e.createdAt));
      const filteredTransfers = transfersArr.filter((t: any) => inRange(t.createdAt));
      const filteredMeetings = meetingsArr.filter((m: any) => inRange(m.date || m.createdAt));

      const totalIncome = filteredReceipts.reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
      const totalExpenses = filteredExpenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

      stats = {
        congregationId: congId,
        receipts: filteredReceipts.length,
        approvedReceipts: filteredReceipts.filter((r: any) => r.status === 'approved').length,
        totalIncome,
        totalExpenses,
        transfers: filteredTransfers.length,
        meetings: filteredMeetings.length,
        quarterStart,
        quarterEnd,
        generatedAt: new Date().toISOString(),
      };
    } catch { stats = null; }
    loading = false;
  }

  function generateExport() {
    if (!stats) return;
    const header = quarterStart ? `Q${Math.floor((parseInt(quarterStart.slice(5,7)) - 1) / 3) + 1} ${quarterStart.slice(0,4)}` : 'All Time';
    const csv = [
      `Theobase Quarterly Report — ${header}`,
      `Congregation: ${stats.congregationId}`,
      `Period: ${quarterStart || 'All'} to ${quarterEnd || 'All'}`,
      '',
      'Metric,Value',
      `Total Receipts,${stats.receipts}`,
      `Approved Receipts,${stats.approvedReceipts}`,
      `Total Income (cents),${stats.totalIncome}`,
      `Total Expenses (cents),${stats.totalExpenses}`,
      `Net Balance (cents),${stats.totalIncome - stats.totalExpenses}`,
      `Transfers,${stats.transfers}`,
      `Board Meetings,${stats.meetings}`,
      `Generated,${stats.generatedAt}`,
    ].join('\n');
    exportText = csv;
  }

  onMount(async () => {
    const authorized = await requireRole("clerk", "treasurer");
    if (!authorized) return;
    setCurrentQuarter();
    try {
      const me = await getMe();
      if (me?.congregationId) {
        congId = me.congregationId;
        await loadStats();
      } else {
        loading = false;
      }
    } catch { loading = false; }
  });
</script>

<svelte:head><title>Conference Report — Theobase</title></svelte:head>

<div class="space-y-6">
  <h1 class="text-2xl font-bold text-slate-900">Conference Report</h1>

  <Card>
    <CardHeader>
      <CardTitle>Date Range</CardTitle>
      <CardDescription>Filter statistics by quarter</CardDescription>
    </CardHeader>
    <CardContent>
      <div class="flex gap-4">
        <div class="flex-1 space-y-2">
          <Label for="date-from">From</Label>
          <Input id="date-from" type="date" bind:value={quarterStart} onchange={() => loadStats()} />
        </div>
        <div class="flex-1 space-y-2">
          <Label for="date-to">To</Label>
          <Input id="date-to" type="date" bind:value={quarterEnd} onchange={() => loadStats()} />
        </div>
      </div>
    </CardContent>
  </Card>

  {#if loading}
    <div class="space-y-4">
      <Skeleton class="h-40 w-full" />
      <Skeleton class="h-20 w-full" />
    </div>
  {:else if !congId}
    <div class="flex flex-col items-center gap-3 py-12">
      <FileSpreadsheet class="size-8 text-slate-300" />
      <p class="text-sm text-slate-500">No congregation associated.</p>
    </div>
  {:else if stats}
    <Card>
      <CardHeader>
        <CardTitle>Statistics</CardTitle>
        <CardDescription>
          {quarterStart && quarterEnd
            ? `Q${Math.floor((parseInt(quarterStart.slice(5,7)) - 1) / 3) + 1} ${quarterStart.slice(0,4)}`
            : 'All Time'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-xs uppercase text-slate-500">Total Receipts</p>
            <p class="text-xl font-semibold text-slate-900">{stats.receipts}</p>
          </div>
          <div>
            <p class="text-xs uppercase text-slate-500">Approved</p>
            <p class="text-xl font-semibold text-slate-900">{stats.approvedReceipts}</p>
          </div>
          <div>
            <p class="text-xs uppercase text-slate-500">Income</p>
            <p class="text-xl font-semibold text-green-600">${(stats.totalIncome / 100).toFixed(2)}</p>
          </div>
          <div>
            <p class="text-xs uppercase text-slate-500">Expenses</p>
            <p class="text-xl font-semibold text-red-600">${(stats.totalExpenses / 100).toFixed(2)}</p>
          </div>
          <div>
            <p class="text-xs uppercase text-slate-500">Board Meetings</p>
            <p class="text-xl font-semibold text-slate-900">{stats.meetings}</p>
          </div>
          <div>
            <p class="text-xs uppercase text-slate-500">Transfers</p>
            <p class="text-xl font-semibold text-slate-900">{stats.transfers}</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Button onclick={generateExport}>
      <Download class="size-4" />
      Generate CSV Export
    </Button>

    {#if exportText}
      <Card>
        <CardHeader>
          <CardTitle>CSV Export</CardTitle>
          <CardDescription>Copy and send to your conference secretary</CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            value={exportText}
            rows="14"
            readonly
            class="w-full rounded-lg border border-input bg-muted px-3 py-2 font-mono text-xs"
          ></textarea>
        </CardContent>
      </Card>
    {/if}
  {:else}
    <Card>
      <CardContent class="py-4">
        <p class="text-sm text-red-600">Failed to load statistics.</p>
      </CardContent>
    </Card>
  {/if}
</div>
