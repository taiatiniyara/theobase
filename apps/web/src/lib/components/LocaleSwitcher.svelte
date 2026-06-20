<script lang="ts">
  import { locale as localeStore, setLocale, locales } from "$lib/i18n";
  import type { Locale } from "$lib/i18n";
  import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "$lib/components/ui/dropdown-menu";
  import { Button } from "$lib/components/ui/button";
  import Languages from "@lucide/svelte/icons/languages";
  import Check from "@lucide/svelte/icons/check";

  let open = $state(false);
  const currentLocale = $derived($localeStore);
</script>

<DropdownMenu open={open} onOpenChange={(o) => open = o}>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon" class="rounded-full" aria-label="Change language">
      <Languages class="size-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" class="w-44">
    {#each Object.values(locales) as loc}
      <DropdownMenuItem
        onclick={() => setLocale(loc.code as Locale)}
        class="flex items-center justify-between"
      >
        <span>{loc.nativeName}</span>
        {#if currentLocale === loc.code}
          <Check class="size-4 text-brand-600" />
        {/if}
      </DropdownMenuItem>
    {/each}
  </DropdownMenuContent>
</DropdownMenu>
