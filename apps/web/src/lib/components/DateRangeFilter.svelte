<script lang="ts">
  import { Input } from "$lib/components/ui/input";
  import { Button } from "$lib/components/ui/button";
  import { Calendar, X } from "@lucide/svelte";

  interface Props {
    onchange?: (range: { from: string; to: string } | null) => void;
  }

  let { onchange }: Props = $props();

  let from = $state("");
  let to = $state("");
  let active = $state(false);

  function apply() {
    if (from || to) {
      active = true;
      onchange?.({ from, to });
    } else {
      clear();
    }
  }

  function clear() {
    from = "";
    to = "";
    active = false;
    onchange?.(null);
  }
</script>

<div class="flex items-center gap-2">
  <div class="flex items-center gap-1.5">
    <Calendar class="size-4 text-slate-400 shrink-0" />
    <Input
      type="date"
      class="w-[140px] h-8 text-xs"
      bind:value={from}
      onchange={apply}
    />
    <span class="text-xs text-slate-400">to</span>
    <Input
      type="date"
      class="w-[140px] h-8 text-xs"
      bind:value={to}
      onchange={apply}
    />
  </div>
  {#if active}
    <Button variant="ghost" size="sm" onclick={clear} aria-label="Clear date filter">
      <X class="size-3.5" />
    </Button>
  {/if}
</div>
