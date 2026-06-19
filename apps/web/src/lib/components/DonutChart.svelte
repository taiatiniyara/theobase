<script lang="ts">
  interface Props {
    data: { label: string; value: number; color: string }[];
    size?: number;
  }

  let { data, size = 160 }: Props = $props();

  const total = $derived(data.reduce((sum, d) => sum + d.value, 0) || 1);
  const radius = $derived(size / 2 - 12);
  const circumference = $derived(2 * Math.PI * radius);
  const center = $derived(size / 2);

  let cumulative = 0;
  function offset(value: number): number {
    const result = cumulative;
    cumulative = result + value;
    return result;
  }
  // Reset cumulative before each render
  cumulative = 0;
</script>

<div class="flex flex-col items-center gap-4">
  <svg width={size} height={size} viewBox="0 0 {size} {size}">
    {#if data.length === 0}
      <circle cx={center} cy={center} r={radius} fill="none" stroke="#e2e8f0" stroke-width="24" />
    {:else}
      {#each data as d}
        {@const dashArray = (d.value / total) * circumference}
        {@const dashOffset = offset(dashArray)}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={d.color}
          stroke-width="24"
          stroke-dasharray="{dashArray} {circumference - dashArray}"
          stroke-dashoffset={-dashOffset}
          transform="rotate(-90 {center} {center})"
        />
      {/each}
    {/if}
    <text x={center} y={center} text-anchor="middle" dominant-baseline="central" class="text-lg font-bold fill-slate-900 dark:fill-slate-100">
      {data.length ? data.length : "—"}
    </text>
    <text x={center} y={center + 18} text-anchor="middle" class="text-[10px] fill-slate-500">
      funds
    </text>
  </svg>
  <div class="flex flex-wrap justify-center gap-3">
    {#each data as d}
      <div class="flex items-center gap-1.5 text-xs">
        <span class="size-2.5 rounded-full shrink-0" style="background: {d.color}"></span>
        <span class="text-slate-600 dark:text-slate-400 truncate max-w-[100px]">{d.label}</span>
        <span class="font-medium text-slate-900 dark:text-slate-200">${(d.value / 100).toFixed(0)}</span>
      </div>
    {/each}
  </div>
</div>
