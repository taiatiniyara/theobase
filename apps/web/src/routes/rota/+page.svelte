<script lang="ts">
  import { getRota } from '$lib/api';
  import { requireRole } from "$lib/guard";
  import { onMount } from 'svelte';
  import { goto } from "$app/navigation";
  import { Card, CardContent } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Badge } from "$lib/components/ui/badge";
  import { Skeleton } from "$lib/components/ui/skeleton";
  import { ChevronLeft, ChevronRight, CalendarCheck, HelpCircle } from "@lucide/svelte";
  import StaggerList from "$lib/components/StaggerList.svelte";

  let date = $state(new Date().toISOString().slice(0, 10));
  let slots = $state<any[]>([]);
  let loading = $state(false);
  let loadError = $state("");

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
  });

  function prevWeek() {
    const d = new Date(date);
    d.setDate(d.getDate() - 7);
    date = d.toISOString().slice(0, 10);
    loadRota();
  }

  function nextWeek() {
    const d = new Date(date);
    d.setDate(d.getDate() + 7);
    date = d.toISOString().slice(0, 10);
    loadRota();
  }

  const roleLabels: Record<string, string> = {
    elder: 'Elder of the Day',
    preacher: 'Preacher',
    deacon: 'Deacon',
    deaconess: 'Deaconess',
    musician: 'Musician',
    av_operator: 'AV Operator',
    youth_leader: 'Youth Leader',
    sabbath_school_superintendent: 'Sabbath School Supt.',
  };
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
  </div>

  {#if loading}
    <div class="space-y-3">
      <Skeleton class="h-16" />
      <Skeleton class="h-16" />
      <Skeleton class="h-16" />
    </div>
  {:else if loadError}
    <div class="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <p class="text-sm text-red-600">{loadError}</p>
      <button class="mt-3 text-sm font-medium text-red-700 underline" onclick={loadRota}>Try again</button>
    </div>
  {:else if slots.length === 0}
    <div class="flex flex-col items-center gap-3 py-12">
      <CalendarCheck class="size-8 text-slate-300" />
      <p class="text-sm text-slate-500">No duty assignments for this Sabbath. Ask your clerk to set up the rota.</p>
      <div class="flex gap-2">
        <Button variant="outline" size="sm" onclick={() => goto('/congregation')}>Configure rota settings</Button>
        <Button size="sm" onclick={() => goto('/congregation')}>Set up the duty rota</Button>
      </div>
    </div>
  {:else}
    <div class="space-y-3">
      <StaggerList each={slots}>
        {#snippet children(slot, index)}
          <Card>
            <CardContent class="flex items-center justify-between p-4">
              <div>
                <p class="font-semibold capitalize text-slate-900">
                  {roleLabels[slot.role] || slot.role?.replace(/_/g, ' ')}
                </p>
                {#if slot.volunteerName}
                  <p class="text-sm text-slate-500">{slot.volunteerName}</p>
                {/if}
              </div>
              <Badge variant={slot.status === 'assigned' ? 'default' : 'secondary'}>
                {slot.status}
              </Badge>
            </CardContent>
          </Card>
        {/snippet}
      </StaggerList>
    </div>
  {/if}
</div>
