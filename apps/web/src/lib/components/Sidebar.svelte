<script lang="ts">
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { cn } from "$lib/utils";
  import { locale, getT } from "$lib/i18n";
  import { visibleSections, type NavSection } from "$lib/nav";
  import { ScrollArea } from "$lib/components/ui/scroll-area";
  import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "$lib/components/ui/collapsible";
  import { Separator } from "$lib/components/ui/separator";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import HelpCircle from "@lucide/svelte/icons/help-circle";

  interface Props {
    roles?: string[];
    onNavigate?: () => void;
  }

  let { roles = [], onNavigate }: Props = $props();

  const t = $derived(getT($locale));
  const sections = $derived(visibleSections(roles));

  function isActive(href: string): boolean {
    if (href === "/dashboard") return $page.url.pathname === "/dashboard";
    return $page.url.pathname.startsWith(href);
  }

  function navigate(href: string) {
    goto(href);
    onNavigate?.();
  }
</script>

<nav class="flex flex-col h-full">
  <div class="flex items-center gap-2 px-4 py-4 pt-safe">
    <a href="/dashboard" class="text-xl font-bold text-brand-900 hover:text-brand-700 dark:text-brand-200 dark:hover:text-brand-100 transition-colors">
      {t("common.app_name")}
    </a>
  </div>

  <Separator />

  <ScrollArea class="flex-1 px-3 py-2">
    {#each sections as section}
      {#if section.items.length === 1 && section.items[0].href === "/dashboard"}
        {@const DashIcon = section.items[0].icon}
        <button
          onclick={() => navigate(section.items[0].href)}
          class={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            isActive(section.items[0].href)
              ? "bg-brand-50 text-brand-900 dark:bg-brand-950 dark:text-brand-200"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200",
          )}
        >
          <DashIcon class="size-4 shrink-0" />
          {t(section.items[0].labelKey)}
        </button>
      {:else}
        {@const SectionIcon = section.icon}
        <Collapsible class="mb-1" defaultOpen={section.items.some((item) => isActive(item.href))}>
          <CollapsibleTrigger
            class={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200",
              "[&[data-state=open]>svg.chevron]:rotate-180",
            )}
          >
            <SectionIcon class="size-4 shrink-0" />
            <span class="flex-1 text-left">{t(section.labelKey)}</span>
            <ChevronDown class="chevron size-4 shrink-0 transition-transform duration-200" />
          </CollapsibleTrigger>
          <CollapsibleContent class="pt-1 pb-1">
            {#each section.items as item}
              {@const ItemIcon = item.icon}
              <button
                onclick={() => navigate(item.href)}
                class={cn(
                  "flex w-full items-center gap-3 rounded-lg py-2 pl-10 pr-3 text-sm transition-colors",
                  isActive(item.href)
                    ? "bg-brand-50 text-brand-900 font-medium dark:bg-brand-950 dark:text-brand-200"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200",
                )}
              >
                <ItemIcon class="size-3.5 shrink-0" />
                {t(item.labelKey)}
              </button>
            {/each}
          </CollapsibleContent>
        </Collapsible>
      {/if}
    {/each}
  </ScrollArea>

  <Separator />

  <div class="p-3">
    <div class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
      <div class="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-medium text-brand-900 dark:bg-brand-800 dark:text-brand-200">
        {roles.includes("clerk") ? "C" : roles.includes("treasurer") ? "T" : "M"}
      </div>
      <span class="truncate">{t("layout.role_indicator")}</span>
    </div>

    <a href="/help" class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors">
      <HelpCircle class="size-4 shrink-0" />
      {t("nav.help_center")}
    </a>
  </div>
</nav>
