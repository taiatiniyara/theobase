<script lang="ts">
  import { cn } from "$lib/utils";
  import Check from "@lucide/svelte/icons/check";

  interface Props {
    steps: string[];
    current: number;
    completed: number[];
  }

  let { steps, current, completed }: Props = $props();

  let completedSet = $derived(new Set(completed));
</script>

<div class="flex flex-wrap items-start justify-center gap-y-4">
  {#each steps as step, i}
    <div class="flex items-center">
      <div class="flex flex-col items-center">
        <div
          class={cn(
            "flex size-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors",
            completedSet.has(i) && "border-green-500 bg-green-500 text-white",
            !completedSet.has(i) && i === current && "border-brand-600 bg-brand-600 text-white",
            !completedSet.has(i) && i !== current && "border-slate-300 bg-white text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400"
          )}
        >
          {#if completedSet.has(i)}
            <Check class="size-4" />
          {:else}
            {i + 1}
          {/if}
        </div>
        <span
          class={cn(
            "mt-1.5 max-w-24 text-center text-xs",
            i === current && !completedSet.has(i) && "font-semibold text-brand-600 dark:text-brand-400",
            completedSet.has(i) && "text-green-600 dark:text-green-400",
            !completedSet.has(i) && i !== current && "text-slate-500 dark:text-slate-400"
          )}
        >
          {step}
        </span>
      </div>
      {#if i < steps.length - 1}
        <div
          class={cn(
            "mx-1 h-0.5 w-6 sm:w-10 md:w-12",
            completedSet.has(i) ? "bg-green-500" : "bg-slate-300 dark:bg-slate-600"
          )}
        ></div>
      {/if}
    </div>
  {/each}
</div>
