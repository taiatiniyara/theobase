<script lang="ts">
  import { onMount } from "svelte";
  import RefreshCw from "@lucide/svelte/icons/refresh-cw";

  interface Props {
    onrefresh?: () => Promise<void> | void;
  }

  let { onrefresh, children }: Props = $props();

  let pulling = $state(false);
  let refreshing = $state(false);
  let pullDistance = $state(0);
  let startY = $state(0);
  let el: HTMLElement | undefined;
  let disabled = $state(false);

  function getScrollParent(node: HTMLElement): HTMLElement {
    let parent = node.parentElement;
    while (parent) {
      const style = window.getComputedStyle(parent);
      if (/(auto|scroll)/.test(style.overflowY)) return parent;
      parent = parent.parentElement;
    }
    return document.scrollingElement as HTMLElement || document.documentElement;
  }

  let scrollParent: HTMLElement | null = null;

  function handleTouchStart(e: TouchEvent) {
    if (disabled || refreshing) return;
    if (!scrollParent) scrollParent = getScrollParent(el!);
    if (scrollParent.scrollTop > 0) return;
    startY = e.touches[0].clientY;
  }

  function handleTouchMove(e: TouchEvent) {
    if (disabled || refreshing || !scrollParent) return;
    if (scrollParent.scrollTop > 0) return;
    const dist = e.touches[0].clientY - startY;
    if (dist > 0) {
      pullDistance = Math.min(dist * 0.4, 80);
      pulling = true;
    }
  }

  async function handleTouchEnd() {
    if (disabled || refreshing) return;
    if (pullDistance > 50) {
      refreshing = true;
      try {
        await onrefresh?.();
      } finally {
        refreshing = false;
      }
    }
    pullDistance = 0;
    pulling = false;
  }

  onMount(() => {
    if (!el) return;

    if (window.matchMedia("(display-mode: standalone)").matches) {
      disabled = true;
      return;
    }

    scrollParent = getScrollParent(el);
    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: true });
    el.addEventListener("touchend", handleTouchEnd);
    return () => {
      el!.removeEventListener("touchstart", handleTouchStart);
      el!.removeEventListener("touchmove", handleTouchMove);
      el!.removeEventListener("touchend", handleTouchEnd);
    };
  });
</script>

<div bind:this={el}>
  {#if pulling || refreshing}
    <div
      class="flex items-center justify-center overflow-hidden transition-[height] duration-200"
      style="height: {pullDistance}px"
    >
      <RefreshCw
        class="size-5 text-slate-400 dark:text-slate-300 {refreshing ? 'animate-spin' : ''}"
        style="transform: rotate({Math.min(pullDistance * 3, 360)}deg)"
      />
    </div>
  {/if}
  {@render children?.()}
</div>
