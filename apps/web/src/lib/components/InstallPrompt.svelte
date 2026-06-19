<script lang="ts">
  import { onMount } from "svelte";
  import { Button } from "$lib/components/ui/button";
  import { Download, X } from "@lucide/svelte";

  let deferredPrompt = $state<Event | null>(null);
  let showPrompt = $state(false);
  let dismissed = $state(false);

  onMount(() => {
    if (dismissed || typeof window === "undefined") return;

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e;
      showPrompt = true;
    };

    window.addEventListener("beforeinstallprompt", handler);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      showPrompt = false;
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  });

  async function install() {
    if (!deferredPrompt) return;
    const prompt = deferredPrompt as any;
    await prompt.prompt();
    const result = await prompt.userChoice;
    if (result.outcome === "accepted") {
      showPrompt = false;
    }
    deferredPrompt = null;
  }

  function dismiss() {
    showPrompt = false;
    dismissed = true;
  }
</script>

{#if showPrompt}
  <div class="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-80">
    <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Download class="size-5" />
          </div>
          <div>
            <p class="text-sm font-medium text-slate-900 dark:text-slate-100">Install Theobase</p>
            <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Add to your home screen for quick access</p>
          </div>
        </div>
        <button class="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" onclick={dismiss} aria-label="Dismiss">
          <X class="size-4" />
        </button>
      </div>
      <Button class="mt-3 w-full" size="sm" onclick={install}>
        <Download class="size-4" />
        Install
      </Button>
    </div>
  </div>
{/if}
