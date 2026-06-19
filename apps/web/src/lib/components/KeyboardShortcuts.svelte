<script lang="ts">
  import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "$lib/components/ui/dialog";
  import Keyboard from "@lucide/svelte/icons/keyboard";

  interface Props {
    open: boolean;
    onOpenChange?: (open: boolean) => void;
  }

  let { open = false, onOpenChange }: Props = $props();

  const shortcuts = [
    { keys: ["Cmd", "K"], description: "Command palette — search and navigate" },
    { keys: ["?"], description: "Show keyboard shortcuts" },
    { keys: ["Esc"], description: "Close dialogs and menus" },
    { keys: ["↑", "↓"], description: "Navigate command palette results" },
    { keys: ["Enter"], description: "Select command palette result" },
  ];
</script>

<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent class="sm:max-w-md">
    <DialogHeader>
      <DialogTitle class="flex items-center gap-2">
        <Keyboard class="size-5" />
        Keyboard Shortcuts
      </DialogTitle>
      <DialogDescription>
        Press <kbd class="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">?</kbd> at any time to see this dialog.
      </DialogDescription>
    </DialogHeader>
    <div class="space-y-2">
      {#each shortcuts as shortcut}
        <div class="flex items-center justify-between rounded-lg px-3 py-2 text-sm">
          <span class="text-slate-600 dark:text-slate-400">{shortcut.description}</span>
          <div class="flex items-center gap-1">
            {#each shortcut.keys as key}
              <kbd class="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">{key}</kbd>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </DialogContent>
</Dialog>
