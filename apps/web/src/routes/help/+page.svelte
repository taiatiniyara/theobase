<script lang="ts">
  import { navigation, type NavSection, type NavItem } from "$lib/nav";
  import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "$lib/components/ui/collapsible";
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Input } from "$lib/components/ui/input";
  import { Button } from "$lib/components/ui/button";
  import { goto } from "$app/navigation";

  import Search from "@lucide/svelte/icons/search";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import ArrowUpRight from "@lucide/svelte/icons/arrow-up-right";
  import BookOpen from "@lucide/svelte/icons/book-open";
  import Keyboard from "@lucide/svelte/icons/keyboard";
  import MessageCircle from "@lucide/svelte/icons/message-circle";

  const descriptions: Record<string, string> = {
    "Overview": "Your personal overview showing giving history, role badges, and quick actions.",
    "Profile": "Edit your name, email, and notification preferences.",
    "Giving": "Submit giving receipts by uploading bank transfer screenshots and allocating funds.",
    "Boardroom": "Schedule and run board meetings with agendas, minutes, and recorded decisions.",
    "Duty Rota": "Manage the weekly duty roster with assignments, swaps, and rotations.",
    "Congregation": "Manage church details, import member rolls, and invite officers.",
    "Church Setup": "Step-by-step wizard to configure your congregation, import members, and invite officers.",
    "Pathfinders": "Track Pathfinder class progress, honors, and achievements.",
    "Welfare": "Record welfare cases, assistance provided, and follow-up actions.",
    "Sabbath School": "Manage Sabbath School classes, attendance, and divisions.",
    "Health Ministry": "Log health events, contacts, and wellness activities.",
    "Communion": "Plan communion services, manage inventory, and assign room setups.",
    "AV Sync": "Control live service slides, order-of-service, and AV schedules.",
    "District Hub": "Manage district visit rotations, bookings, and progress tracking.",
    "Facilities": "Manage church facilities, assets, and resource bookings.",
    "Crisis Assets": "Register and track congregation crisis response assets.",
    "Transfers": "Handle membership transfer requests in and out of the congregation.",
    "Households": "Manage household groupings and family member associations.",
    "Candidacies": "Track member candidacy applications and appointment stages.",
    "Nominating": "Manage nomination sessions for church officer positions.",
    "Treasury": "View fund balances, record expenses, and manage financial operations.",
    "Conference Report": "Generate and submit quarterly conference financial reports.",
  };

  const shortcuts = [
    { keys: ["Cmd", "K"], description: "Command palette — search and navigate" },
    { keys: ["?"], description: "Show keyboard shortcuts" },
    { keys: ["G", "D"], description: "Go to Dashboard" },
    { keys: ["G", "H"], description: "Go to Help Center" },
    { keys: ["G", "B"], description: "Go to Boardroom" },
    { keys: ["G", "R"], description: "Go to Duty Rota" },
    { keys: ["G", "G"], description: "Go to Giving" },
    { keys: ["G", "T"], description: "Go to Treasury" },
    { keys: ["G", "C"], description: "Go to Congregation" },
    { keys: ["G", "M"], description: "Go to Profile" },
    { keys: ["G", "S"], description: "Go to Church Setup" },
    { keys: ["Esc"], description: "Close dialogs and menus" },
    { keys: ["↑", "↓"], description: "Navigate command palette results" },
    { keys: ["Enter"], description: "Select command palette result" },
  ];

  let search = $state("");
  let openSections = $state<Record<string, boolean>>({});

  const filteredSections = $derived(
    navigation
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            !search ||
            item.label.toLowerCase().includes(search.toLowerCase()) ||
            (descriptions[item.label] || "").toLowerCase().includes(search.toLowerCase()) ||
            section.label.toLowerCase().includes(search.toLowerCase())
        ),
      }))
      .filter((section) => section.items.length > 0)
  );

  function navigateTo(href: string) {
    goto(href);
  }
</script>

<svelte:head>
  <title>Help Center — Theobase</title>
</svelte:head>

<div class="space-y-6 pb-8">
  <div>
    <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">Help Center</h1>
    <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
      Learn how to use each part of Theobase
    </p>
  </div>

  <div class="relative">
    <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
    <Input
      class="pl-10"
      placeholder="Search modules by name or description..."
      bind:value={search}
    />
  </div>

  {#if filteredSections.length === 0}
    <Card class="border-dashed">
      <CardContent class="flex flex-col items-center gap-2 py-8">
        <Search class="size-6 text-slate-300 dark:text-slate-600" />
        <p class="text-sm text-slate-500 dark:text-slate-400">
          No modules found matching "{search}"
        </p>
      </CardContent>
    </Card>
  {:else}
    <div class="space-y-3">
      {#each filteredSections as section}
        {@const sectionKey = section.label}
        <Card>
          <Collapsible bind:open={openSections[sectionKey]}>
            <CollapsibleTrigger class="w-full">
              <CardHeader class="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-t-xl transition-colors">
                <div class="flex items-center gap-3 justify-between">
                  <div class="flex items-center gap-3">
                    <div class="rounded-lg bg-brand-50 dark:bg-brand-950 p-2">
                      <section.icon class="size-4 text-brand-600 dark:text-brand-400" />
                    </div>
                    <div class="text-left">
                      <CardTitle class="text-base">{section.label}</CardTitle>
                      <CardDescription>
                        {section.items.length} module{section.items.length !== 1 ? "s" : ""}
                      </CardDescription>
                    </div>
                  </div>
                  <ChevronDown
                    class="size-4 text-slate-400 transition-transform duration-200 {openSections[sectionKey] ? 'rotate-180' : ''}"
                  />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent class="pt-0 pb-4">
                <div class="divide-y">
                  {#each section.items as item}
                    <div class="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div class="flex items-start gap-3 min-w-0">
                        <div class="mt-0.5 rounded-md bg-slate-100 dark:bg-slate-800 p-1.5 shrink-0">
                          <item.icon class="size-3.5 text-slate-500 dark:text-slate-400" />
                        </div>
                        <div class="min-w-0">
                          <p class="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {item.label}
                          </p>
                          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                            {descriptions[item.label] || ""}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="xs"
                        onclick={() => navigateTo(item.href)}
                        class="shrink-0 ml-3"
                      >
                        Open
                        <ArrowUpRight class="size-3" />
                      </Button>
                    </div>
                  {/each}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      {/each}
    </div>
  {/if}

  <Card>
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <Keyboard class="size-5" />
        Keyboard Shortcuts
      </CardTitle>
      <CardDescription>
        Press <kbd class="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">?</kbd> at any time to see these shortcuts.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div class="space-y-1">
        {#each shortcuts as shortcut}
          <div class="flex items-center justify-between rounded-lg px-3 py-2">
            <span class="text-sm text-slate-600 dark:text-slate-400">{shortcut.description}</span>
            <div class="flex items-center gap-1">
              {#each shortcut.keys as key}
                <kbd class="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">{key}</kbd>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <MessageCircle class="size-5" />
        Need more help?
      </CardTitle>
      <CardDescription>
        Can't find what you're looking for? We're here to help.
      </CardDescription>
    </CardHeader>
    <CardContent class="flex flex-wrap items-center gap-3">
      <Button variant="outline" disabled>
        <BookOpen class="size-4" />
        Knowledge Base
        <span class="ml-2 rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">Coming soon</span>
      </Button>
    </CardContent>
  </Card>
</div>
