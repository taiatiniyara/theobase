<script lang="ts">
  import { goto } from "$app/navigation";
  import { visibleSections } from "$lib/nav";
  import { cn } from "$lib/utils";
  import Search from "@lucide/svelte/icons/search";

  interface Props {
    roles?: string[];
    open: boolean;
    onOpenChange?: (open: boolean) => void;
  }

  let { roles = [], open = false, onOpenChange }: Props = $props();

  let query = $state("");
  let selectedIndex = $state(0);
  let inputEl = $state<HTMLInputElement>();

  const sections = $derived(visibleSections(roles));
  const allItems = $derived(
    sections.flatMap((s) =>
      s.items.map((item) => ({ ...item, section: s.label })),
    ),
  );

  const filtered = $derived(
    query.trim()
      ? allItems.filter(
          (item) =>
            item.label.toLowerCase().includes(query.toLowerCase()) ||
            item.section.toLowerCase().includes(query.toLowerCase()),
        )
      : allItems.slice(0, 8),
  );

  $effect(() => {
    selectedIndex = 0;
    if (open) {
      query = "";
      setTimeout(() => inputEl?.focus(), 50);
    }
  });

  function navigate(href: string) {
    onOpenChange?.(false);
    goto(href);
  }

  function close() {
    onOpenChange?.(false);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, filtered.length - 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      e.preventDefault();
      navigate(filtered[selectedIndex].href);
    } else if (e.key === "Escape") {
      close();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <div class="fixed inset-0 z-50">
    <button
      class="fixed inset-0 bg-black/40 backdrop-blur-sm cursor-default"
      onclick={close}
      aria-label="Close command palette"
    ></button>
    <div
      class="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2 overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div class="flex items-center border-b border-slate-200 dark:border-slate-700 px-4">
        <Search class="size-4 shrink-0 text-slate-400" />
        <input
          type="text"
          placeholder="Search pages..."
          class="flex-1 border-0 bg-transparent px-3 py-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
          bind:value={query}
          bind:this={inputEl}
          autofocus
        />
        <kbd class="hidden rounded border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-400 dark:border-slate-700 sm:inline-block">esc</kbd>
      </div>
      <div class="max-h-80 overflow-y-auto p-2">
        {#if filtered.length === 0}
          <p class="px-3 py-6 text-center text-sm text-slate-400">No pages found.</p>
        {:else}
          {#each filtered as item, i}
            {@const Icon = item.icon}
            <button
              class={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                i === selectedIndex
                  ? "bg-brand-50 text-brand-900 dark:bg-brand-950 dark:text-brand-200"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800",
              )}
              onclick={() => navigate(item.href)}
            >
              <Icon class="size-4 shrink-0" />
              <span class="flex-1 text-left">{item.label}</span>
              <span class="text-xs text-slate-400 dark:text-slate-500">{item.section}</span>
            </button>
          {/each}
        {/if}
      </div>
    </div>
  </div>
{/if}
