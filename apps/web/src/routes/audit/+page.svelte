<script lang="ts">
  import { getAuditLog } from '$lib/api';
  import { requireRole } from "$lib/guard";
  import { onMount } from 'svelte';
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  import { Skeleton } from "$lib/components/ui/skeleton";
  import { History, Loader } from "@lucide/svelte";
  import { formatDate } from "$lib/format";

  let entries = $state<any[]>([]);
  let loading = $state(true);
  let offset = $state(0);
  let hasMore = $state(true);

  async function load() {
    loading = true;
    try {
      const data = await getAuditLog(50, offset);
      entries = offset === 0 ? data : [...entries, ...data];
      hasMore = data.length === 50;
    } catch { entries = []; }
    loading = false;
  }

  onMount(async () => {
    if (!await requireRole("clerk", "treasurer")) return;
    load();
  });
</script>

<svelte:head><title>Audit Log — Theobase</title></svelte:head>

<div class="space-y-6">
  <h1 class="text-2xl font-bold text-slate-900">Audit Log</h1>

  {#if loading && entries.length === 0}
    <div class="space-y-3"><Skeleton class="h-12" /><Skeleton class="h-12" /><Skeleton class="h-12" /></div>
  {:else if entries.length === 0}
    <div class="flex flex-col items-center gap-3 py-12">
      <History class="size-8 text-slate-300" />
      <p class="text-sm text-slate-500">No audit entries yet.</p>
    </div>
  {:else}
    <div class="space-y-2">
      {#each entries as entry (entry.id)}
        <div class="rounded-lg border bg-white p-3 flex items-center justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <Badge variant="outline" class="text-[10px] font-mono">{entry.action}</Badge>
              <span class="text-xs text-slate-400">{entry.resource_type}</span>
              {#if entry.resource_id}
                <span class="text-[10px] text-slate-300 font-mono">{entry.resource_id.slice(0, 8)}</span>
              {/if}
            </div>
            <p class="text-xs text-slate-500 mt-1">
              By {entry.actor_name || 'Unknown'} — {formatDate(entry.created_at)}
            </p>
          </div>
          {#if entry.details}
            <span class="text-[10px] text-slate-400 ml-2 truncate max-w-40">{entry.details.slice(0, 60)}</span>
          {/if}
        </div>
      {/each}
    </div>
    {#if hasMore}
      <div class="text-center">
        <Button variant="outline" size="sm" onclick={() => { offset += 50; load(); }} disabled={loading}>
          {#if loading}<Loader class="size-3.5 animate-spin" />{/if}
          Load more
        </Button>
      </div>
    {/if}
  {/if}
</div>
