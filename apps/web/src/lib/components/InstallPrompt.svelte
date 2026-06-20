<script lang="ts">
  import { onMount } from "svelte";
  import { Button } from "$lib/components/ui/button";
  import { Download, X, Share } from "@lucide/svelte";

  let deferredPrompt = $state<Event | null>(null);
  let showPrompt = $state(false);
  let dismissed = $state(false);
  let isIOS = $state(false);

  onMount(() => {
    if (dismissed || typeof window === "undefined") return;

    isIOS = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase()) && !window.matchMedia("(display-mode: standalone)").matches;

    const bpHandler = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e;
      showPrompt = true;
    };

    const aiHandler = () => {
      showPrompt = false;
      deferredPrompt = null;
    };

    window.addEventListener("beforeinstallprompt", bpHandler);
    window.addEventListener("appinstalled", aiHandler);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      showPrompt = false;
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", bpHandler);
      window.removeEventListener("appinstalled", aiHandler);
    };
  });

  async function install() {
    if (!deferredPrompt) return;
    const prompt = deferredPrompt as any;
    await prompt.prompt();
    deferredPrompt = null;
    showPrompt = false;
  }

  function dismiss() {
    showPrompt = false;
    dismissed = true;
  }
</script>

{#if showPrompt}
  <div class="fixed left-4 right-4 z-50 pb-safe sm:left-auto sm:right-4 sm:w-80" style="bottom: calc(1rem + var(--safe-area-inset-bottom))">
    <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Download class="size-5" />
          </div>
          <div>
            <p class="text-sm font-medium text-slate-900 dark:text-slate-100">Install Theobase</p>
            <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {isIOS
                ? "Tap Share then 'Add to Home Screen'"
                : "Add to your home screen for quick access"}
            </p>
          </div>
        </div>
        <button class="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" onclick={dismiss} aria-label="Dismiss">
          <X class="size-4" />
        </button>
      </div>
      {#if isIOS}
        <p class="mt-3 text-xs text-slate-400 dark:text-slate-500">
          Look for <Share class="inline size-3" /> in Safari's toolbar, then tap "Add to Home Screen".
        </p>
      {:else}
        <Button class="mt-3 w-full" size="sm" onclick={install}>
          <Download class="size-4" />
          Install
        </Button>
      {/if}
    </div>
  </div>
{/if}
