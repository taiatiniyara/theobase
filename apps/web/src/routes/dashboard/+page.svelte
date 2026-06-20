<script lang="ts">
  import { getMe, getTreasuryBalance, getReceipts } from "$lib/api";
  import { requireRole } from "$lib/guard";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  import { Skeleton } from "$lib/components/ui/skeleton";
  import { DollarSign, Receipt, Clock, Gavel, CalendarCheck, Sparkles, RefreshCw, Pause, ArrowRight, Check, ClipboardCheck, Rocket } from "@lucide/svelte";
  import { formatCents } from "$lib/format";
  import AnimatedCounter from "$lib/components/AnimatedCounter.svelte";
  import DonutChart from "$lib/components/DonutChart.svelte";
  import BarChart from "$lib/components/BarChart.svelte";
  import StaggerList from "$lib/components/StaggerList.svelte";
  import Celebration from "$lib/components/Celebration.svelte";

  let profile = $state<any>(null);
  let balance = $state<any>(null);
  let receipts = $state<any[]>([]);
  let loading = $state(true);
  let autoRefresh = $state(true);
  let lastRefresh = $state<Date | null>(null);
  let refreshTimer: ReturnType<typeof setInterval>;
  let showCelebration = $state(false);
  let celebrationMessage = $state("");
  let checklistDone = $state(checklistHidden());

  function checklistHidden(): boolean {
    if (localStorage.getItem("theobase_checklist_done") === "true") return true;
    const snoozed = localStorage.getItem("theobase_checklist_snoozed");
    if (snoozed) {
      const snoozeTime = parseInt(snoozed, 10);
      const now = Date.now();
      if (now - snoozeTime < 86400000) return true; // 24 hours
      localStorage.removeItem("theobase_checklist_snoozed");
    }
    return false;
  }

  const CHART_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];

  function fundLabel(fund: string): string {
    return fund.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  async function loadData() {
    try {
      profile = await getMe();
      if (!profile || profile.error) { goto("/"); return; }
      const results = await Promise.allSettled([getTreasuryBalance(), getReceipts()]);
      if (results[0].status === "fulfilled") balance = results[0].value;
      if (results[1].status === "fulfilled") receipts = results[1].value || [];
      lastRefresh = new Date();
    } catch {
      goto("/");
    }
    loading = false;
  }

  onMount(async () => {
    const authorized = await requireRole("clerk", "treasurer", "elder");
    if (!authorized) return;
    loadData();
    refreshTimer = setInterval(() => {
      if (autoRefresh) loadData();
    }, 30000);

    if (!localStorage.getItem("theobase_celebrated") && profile?.firstName) {
      setTimeout(() => {
        celebrationMessage = `Welcome aboard, ${profile.firstName}! Your account is ready.`;
        showCelebration = true;
        localStorage.setItem("theobase_celebrated", "true");
      }, 500);
    }

    return () => clearInterval(refreshTimer);
  });

  function isClerk() { return profile?.roles?.includes("clerk"); }
  function isTreasurer() { return profile?.roles?.includes("treasurer"); }

  const fundChart = $derived(
    balance && !balance.error
      ? Object.entries(balance)
          .filter(([, v]) => typeof v === "number" && v !== 0)
          .map(([k, v], i) => ({ label: fundLabel(k), value: v as number, color: CHART_COLORS[i % CHART_COLORS.length] }))
      : [],
  );

  const givingChart = $derived(
    receipts.length > 0
      ? receipts.slice(0, 10).map((r: any, i: number) => ({
          label: `#${(r.id || "").slice(0, 6)}`,
          value: r.amount || 0,
          color: r.status === "approved" ? "#22c55e" : r.status === "rejected" ? "#ef4444" : "#f59e0b",
        }))
      : [],
  );
</script>

<svelte:head>
  <title>Dashboard — Theobase</title>
</svelte:head>

{#if loading}
  <div class="space-y-6 pt-4">
    <Skeleton class="h-8 w-48" />
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Skeleton class="h-32" /><Skeleton class="h-32" /><Skeleton class="h-32" />
    </div>
    <Skeleton class="h-64" />
  </div>
{:else}
  <div class="space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Welcome, {profile?.firstName || profile?.email}
        </h1>
        <div class="mt-2 flex flex-wrap items-center gap-2">
          {#if profile?.roles?.length}
            {#each profile.roles as role}
              <Badge variant="secondary" class="capitalize">{role}</Badge>
            {/each}
          {/if}
          <div class="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onclick={() => autoRefresh = !autoRefresh}
              aria-label={autoRefresh ? "Pause auto-refresh" : "Resume auto-refresh"}
            >
              {#if autoRefresh}
                <Pause class="size-3.5" />
              {:else}
                <RefreshCw class="size-3.5" />
              {/if}
              <span class="text-xs ml-1">{autoRefresh ? "Live" : "Paused"}</span>
            </Button>
            {#if lastRefresh}
              <span class="text-[11px] text-slate-400">
                Updated {lastRefresh.toLocaleTimeString()}
              </span>
            {/if}
          </div>
        </div>
      </div>
    </div>

    {#if (isClerk() || isTreasurer()) && !checklistDone}
      <Card class="border-brand-100 dark:border-brand-900 bg-gradient-to-br from-brand-50/50 to-white dark:from-brand-950/20 dark:to-slate-900">
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <ClipboardCheck class="size-5 text-brand-600" />
            Getting Started
          </CardTitle>
          <CardDescription>The essential steps to set up your congregation.</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-2">
            {#if isClerk()}
              <a href="/setup" class="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                <div class="flex size-6 items-center justify-center rounded-full border-2 border-brand-500 bg-brand-500 text-xs font-medium text-white">1</div>
                <div class="flex-1">
                  <p class="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100">Set up your congregation</p>
                  <p class="text-xs text-slate-400">Guided wizard for church details, members, and officers</p>
                </div>
                <ArrowRight class="size-4 text-slate-300 group-hover:text-brand-500 transition-colors" />
              </a>
              <a href="/congregation" class="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                <div class="flex size-6 items-center justify-center rounded-full border-2 border-slate-300 text-xs font-medium text-slate-400">2</div>
                <div class="flex-1">
                  <p class="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100">Import your member roll</p>
                  <p class="text-xs text-slate-400">Upload a CSV of your congregation members</p>
                </div>
                <ArrowRight class="size-4 text-slate-300 group-hover:text-brand-500 transition-colors" />
              </a>
              <a href="/boardroom" class="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                <div class="flex size-6 items-center justify-center rounded-full border-2 border-slate-300 text-xs font-medium text-slate-400">3</div>
                <div class="flex-1">
                  <p class="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100">Schedule your first board meeting</p>
                  <p class="text-xs text-slate-400">Create an agenda and record decisions</p>
                </div>
                <ArrowRight class="size-4 text-slate-300 group-hover:text-brand-500 transition-colors" />
              </a>
              <a href="/rota" class="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                <div class="flex size-6 items-center justify-center rounded-full border-2 border-slate-300 text-xs font-medium text-slate-400">4</div>
                <div class="flex-1">
                  <p class="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100">Publish the duty rota</p>
                  <p class="text-xs text-slate-400">Assign weekly service duties to members</p>
                </div>
                <ArrowRight class="size-4 text-slate-300 group-hover:text-brand-500 transition-colors" />
              </a>
            {/if}
            {#if isTreasurer()}
              <a href="/treasury" class="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                <div class="flex size-6 items-center justify-center rounded-full border-2 border-slate-300 text-xs font-medium text-slate-400">{isClerk() ? 5 : 1}</div>
                <div class="flex-1">
                  <p class="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100">Review treasury balances</p>
                  <p class="text-xs text-slate-400">Check fund distribution and record expenses</p>
                </div>
                <ArrowRight class="size-4 text-slate-300 group-hover:text-brand-500 transition-colors" />
              </a>
            {/if}
          </div>
          <div class="mt-4 flex items-center justify-between">
            <p class="text-xs text-slate-400">Skip for now, or dismiss when you're all set.</p>
            <div class="flex gap-2">
              <Button variant="ghost" size="sm" onclick={() => { checklistDone = true; localStorage.setItem("theobase_checklist_snoozed", Date.now().toString()); }}>
                <Clock class="size-3.5" />
                Remind tomorrow
              </Button>
              <Button variant="outline" size="sm" onclick={() => { checklistDone = true; localStorage.setItem("theobase_checklist_done", "true"); }}>
                <Check class="size-3.5" />
                Dismiss
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    {/if}

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#if profile?.giving}
        <Card>
          <CardHeader class="pb-2">
            <CardTitle class="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
              <DollarSign class="size-4" />
              Total Given
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-2xl font-bold text-slate-900 dark:text-slate-100">
              <AnimatedCounter value={profile.giving.totalAmount / 100} prefix="$" duration={800} decimals={2} />
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="pb-2">
            <CardTitle class="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
              <Receipt class="size-4" />
              Receipts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-2xl font-bold text-slate-900 dark:text-slate-100">
              <AnimatedCounter value={profile.giving.totalReceipts} duration={500} />
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="pb-2">
            <CardTitle class="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
              <Clock class="size-4" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-2xl font-bold text-amber-600">
              <AnimatedCounter value={profile.giving.pendingCount} duration={500} />
            </p>
          </CardContent>
        </Card>
      {:else}
        <Card class="sm:col-span-2 lg:col-span-3 border-dashed">
          <CardContent class="flex flex-col items-center gap-4 py-8">
            <div class="rounded-full bg-brand-50 dark:bg-brand-950 p-3">
              <Sparkles class="size-6 text-brand-600 dark:text-brand-400" />
            </div>
            <div class="text-center">
              <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Welcome to Theobase</h2>
              <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Start by submitting your first giving receipt. Upload a screenshot of your bank transfer and tell us how to split the funds.
              </p>
            </div>
            <a href="/receipts">
              <Button>
                <Receipt class="size-4" />
                Submit your first receipt
              </Button>
            </a>
            {#if isClerk() || isTreasurer()}
              <p class="text-xs text-slate-400">or</p>
              <a href="/setup">
                <Button variant="outline">
                  <Rocket class="size-4" />
                  Set up your congregation
                </Button>
              </a>
            {/if}
          </CardContent>
        </Card>
      {/if}
    </div>

    {#if isTreasurer() && fundChart.length > 0}
      <div class="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Fund Distribution</CardTitle>
            <CardDescription>Current balance by fund</CardDescription>
          </CardHeader>
          <CardContent class="flex items-center justify-center pb-8">
            <DonutChart data={fundChart} />
          </CardContent>
        </Card>

        {#if givingChart.length > 0}
          <Card>
            <CardHeader>
              <CardTitle>Recent Giving</CardTitle>
              <CardDescription>Latest 10 receipts</CardDescription>
            </CardHeader>
            <CardContent class="pb-8">
              <BarChart data={givingChart} />
            </CardContent>
          </Card>
        {/if}
      </div>
    {:else if isTreasurer()}
      <Card>
        <CardHeader>
          <CardTitle>Treasury Balances</CardTitle>
          <CardDescription>Current fund balances</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="divide-y">
            <StaggerList each={Object.entries(balance || {}).filter(([k]) => k !== "error").filter(([, v]) => typeof v === "number") as [string, number][]}>
              {#snippet children([fund, amount], index)}
                <div class="flex items-center justify-between py-2.5">
                  <span class="text-sm capitalize text-slate-600 dark:text-slate-400">
                    {fundLabel(fund)}
                  </span>
                  <span class="text-sm font-semibold {amount >= 0 ? 'text-green-600' : 'text-red-600'}">
                    ${formatCents(amount)}
                  </span>
                </div>
              {/snippet}
            </StaggerList>
          </div>
        </CardContent>
      </Card>
    {/if}

    {#if isClerk() || isTreasurer()}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent class="flex flex-wrap gap-3">
          <a href="/boardroom">
            <Button variant="default">
              <Gavel class="size-4" />
              Boardroom
            </Button>
          </a>
          {#if isClerk()}
            <a href="/rota">
              <Button variant="outline">
                <CalendarCheck class="size-4" />
                Duty Rota
              </Button>
            </a>
          {/if}
        </CardContent>
      </Card>
    {/if}
  </div>
  <Celebration trigger={showCelebration} message={celebrationMessage} />
{/if}
