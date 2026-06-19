<script lang="ts">
  interface Props {
    data: { label: string; value: number; color?: string }[];
    height?: number;
  }

  let { data, height = 120 }: Props = $props();

  const max = $derived(Math.max(...data.map((d) => d.value), 1));
  const barWidth = $derived(Math.max(8, Math.min(40, (data.length > 0 ? 280 / data.length : 40))));
</script>

<div class="w-full">
  {#if data.length === 0}
    <div class="flex items-center justify-center text-sm text-slate-400" style="height: {height}px">
      No data
    </div>
  {:else}
    <div class="flex items-end justify-center gap-1.5" style="height: {height}px">
      {#each data as d, i}
        {@const h = Math.max(4, (d.value / max) * height)}
        <div class="flex flex-col items-center gap-1" style="width: {barWidth}px">
          <span class="text-[10px] font-medium text-slate-500">{d.value ? `$${(d.value / 100).toFixed(0)}` : ""}</span>
          <div
            class="w-full rounded-t-sm transition-all duration-500"
            style="height: {h}px; background: {d.color || `hsl(${(i * 50) % 360}, 60%, 55%)`}"
          ></div>
          <span class="text-[10px] text-slate-400 truncate w-full text-center">{d.label}</span>
        </div>
      {/each}
    </div>
  {/if}
</div>
