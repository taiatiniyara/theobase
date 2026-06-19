<script lang="ts">
  import { Input } from "$lib/components/ui/input";
  import { Button } from "$lib/components/ui/button";
  import { Search, ArrowUpDown, ArrowUp, ArrowDown } from "@lucide/svelte";
  import { cn } from "$lib/utils";

  interface SortOption {
    label: string;
    key: string;
  }

  interface Props {
    searchPlaceholder?: string;
    sortOptions?: SortOption[];
    sortKey?: string;
    sortDir?: "asc" | "desc";
    onsearch?: (query: string) => void;
    onsort?: (key: string, dir: "asc" | "desc") => void;
    resultCount?: number;
    totalCount?: number;
  }

  let {
    searchPlaceholder = "Search...",
    sortOptions = [],
    sortKey = "",
    sortDir = "asc",
    onsearch,
    onsort,
    resultCount = 0,
    totalCount = 0,
  }: Props = $props();

  let query = $state("");
  let debounceTimer: ReturnType<typeof setTimeout>;

  function handleInput(e: Event) {
    query = (e.target as HTMLInputElement).value;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      onsearch?.(query);
    }, 200);
  }

  function toggleSort(key: string) {
    if (sortKey === key) {
      const newDir = sortDir === "asc" ? "desc" : "asc";
      onsort?.(key, newDir);
    } else {
      onsort?.(key, "asc");
    }
  }

  function clearSearch() {
    query = "";
    onsearch?.("");
  }
</script>

<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
  <div class="relative flex-1 max-w-sm">
    <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
    <Input
      type="text"
      placeholder={searchPlaceholder}
      value={query}
      oninput={handleInput}
      class="pl-9"
    />
    {#if query}
      <button
        class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        onclick={clearSearch}
        aria-label="Clear search"
      >
        esc
      </button>
    {/if}
  </div>

  <div class="flex items-center gap-2">
    {#if totalCount > 0 && query}
      <span class="text-xs text-slate-500 dark:text-slate-400">
        {resultCount} of {totalCount}
      </span>
    {/if}
    {#each sortOptions as opt}
      <Button
        variant={sortKey === opt.key ? "default" : "outline"}
        size="sm"
        onclick={() => toggleSort(opt.key)}
        aria-label="Sort by {opt.label}"
      >
        {opt.label}
        {#if sortKey === opt.key}
          {#if sortDir === "asc"}
            <ArrowUp class="ml-1 size-3" />
          {:else}
            <ArrowDown class="ml-1 size-3" />
          {/if}
        {:else}
          <ArrowUpDown class="ml-1 size-3 opacity-50" />
        {/if}
      </Button>
    {/each}
  </div>
</div>
