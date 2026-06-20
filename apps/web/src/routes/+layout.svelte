<script lang="ts">
  import "../app.css";
  import { getMe, clearToken, getToken } from "$lib/api";
  import { clearRoles } from "$lib/guard";
  import { connectRealtime } from "$lib/realtime";
  import { realtimeEvents, type RealtimeEvent } from "$lib/rtstore";
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { cn } from "$lib/utils";
  import { locale, getT, initI18n } from "$lib/i18n";
  import Sidebar from "$lib/components/Sidebar.svelte";
  import LocaleSwitcher from "$lib/components/LocaleSwitcher.svelte";
  import { Sheet, SheetContent, SheetTrigger } from "$lib/components/ui/sheet";
  import { Button } from "$lib/components/ui/button";
  import { Avatar, AvatarFallback } from "$lib/components/ui/avatar";
  import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "$lib/components/ui/dropdown-menu";
  import { Toaster } from "$lib/components/ui/sonner";
  import CommandPalette from "$lib/components/CommandPalette.svelte";
  import ConfirmDialog from "$lib/components/ConfirmDialog.svelte";
  import PullToRefresh from "$lib/components/PullToRefresh.svelte";
  import KeyboardShortcuts from "$lib/components/KeyboardShortcuts.svelte";
  import InstallPrompt from "$lib/components/InstallPrompt.svelte";
  import Menu from "@lucide/svelte/icons/menu";
  import Bell from "@lucide/svelte/icons/bell";
  import LogOut from "@lucide/svelte/icons/log-out";
  import User from "@lucide/svelte/icons/user";
  import Keyboard from "@lucide/svelte/icons/keyboard";
  import Moon from "@lucide/svelte/icons/moon";
  import Sun from "@lucide/svelte/icons/sun";
  import HelpCircle from "@lucide/svelte/icons/help-circle";

  let { children } = $props();
  let profile = $state<any>(null);
  let online = $state(true);
  let pendingSync = $state(0);
  let mobileNavOpen = $state(false);
  let cmdOpen = $state(false);
  let signOutOpen = $state(false);
  let dark = $state(false);
  let shortcutsOpen = $state(false);
  let gModeActive = $state(false);
  let realtimeConn: ReturnType<typeof connectRealtime> | null = null;
  let notifCount = $state(0);
  let notificationHistory = $state<{ message: string; timestamp: number; type: string }[]>([]);

  const t = $derived(getT($locale));

  async function loadProfile() {
    const token = getToken();
    if (!token) {
      profile = null;
      realtimeConn?.close();
      realtimeConn = null;
      return;
    }
    if (profile) return;
    try {
      profile = await getMe();
      if (profile) {
        realtimeConn?.close();
        realtimeConn = connectRealtime(token, {
          onMessage: (data: RealtimeEvent) => {
            if (data.type === "notification" || data.type === "congregation_notification") {
              notifCount++;
              notificationHistory = [{ message: String(data.message || data.type), timestamp: Date.now(), type: data.type as string }, ...notificationHistory.slice(0, 19)];
            }
            realtimeEvents.set(data);
          },
        });
        const path = $page.url.pathname;
        if (path === "/" || path === "/auth/verify") {
          goto("/dashboard");
        }
      }
    } catch (e: any) {
      if (e?.message === "Unauthorized") {
        clearToken();
        profile = null;
      }
    }
  }

  $effect(() => {
    if (profile) return;
    loadProfile();
  });

  onMount(async () => {
    initI18n();

    const stored = localStorage.getItem("theobase_dark");
    if (stored !== null) {
      dark = stored === "true";
      document.documentElement.classList.toggle("dark", dark);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      dark = true;
      document.documentElement.classList.add("dark");
    }

    window.addEventListener("storage", (e) => {
      if (e.key === "theobase_token" && !e.newValue) {
        profile = null;
        realtimeConn?.close();
        realtimeConn = null;
        if (!$page.url.pathname.startsWith("/auth")) {
          goto("/");
        }
      }
    });

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data?.type === "connectivity") {
          online = event.data.online;
          if (event.data.online) {
            navigator.serviceWorker.controller?.postMessage({ type: "sync_outbox" });
          }
        } else if (event.data?.type === "outbox_queued") {
          pendingSync++;
        } else if (event.data?.type === "outbox_synced") {
          pendingSync = event.data.remaining || 0;
        }
      });

      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: "check_online" });
      }
    }

    function handleKeydown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        cmdOpen = !cmdOpen;
      } else if (e.key === "?" && !isInput(e)) {
        e.preventDefault();
        shortcutsOpen = !shortcutsOpen;
      } else if (e.key === "g" && !isInput(e) && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        gModeActive = true;
        setTimeout(() => { gModeActive = false; }, 2000);
      } else if (gModeActive && !isInput(e)) {
        e.preventDefault();
        gModeActive = false;
        const nav: Record<string, string> = {
          "d": "/dashboard",
          "h": "/help",
          "b": "/boardroom",
          "r": "/rota",
          "g": "/receipts",
          "t": "/treasury",
          "c": "/congregation",
          "m": "/me",
          "s": "/setup",
          "p": "/pathfinders",
          "w": "/welfare",
          "a": "/av",
          "i": "/district",
          "f": "/facilities",
          "k": "/crisis",
          "n": "/nominating",
          "l": "/safety",
          "u": "/audit",
          "e": "/conference",
          "x": "/transfers",
          "o": "/households",
          "y": "/candidacies",
          "z": "/sabbath-school",
          "j": "/communion",
          "v": "/health",
          "q": "/discipline",
        };
        const target = nav[e.key.toLowerCase()];
        if (target) goto(target);
      }
    }

    function isInput(e: KeyboardEvent): boolean {
      const tag = (e.target as HTMLElement)?.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
    }
    window.addEventListener("keydown", handleKeydown);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
      realtimeConn?.close();
    };
  });

  function signOut() {
    clearToken();
    clearRoles();
    profile = null;
    realtimeConn?.close();
    realtimeConn = null;
    notifCount = 0;
    goto("/");
  }

  function toggleDark() {
    dark = !dark;
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theobase_dark", String(dark));
  }

  const roles = $derived<string[]>(profile?.roles || []);
  const isAuthPage = $derived($page.url.pathname.startsWith("/auth"));
  const initials = $derived(
    profile?.firstName ? profile.firstName[0].toUpperCase() : "?",
  );

  const pathTitleMap: Record<string, string> = {
    "/dashboard": "nav.overview",
    "/me": "nav.profile",
    "/receipts": "nav.giving",
    "/boardroom": "nav.boardroom",
    "/treasury": "nav.treasury",
    "/rota": "nav.duty_rota",
    "/congregation": "nav.congregation",
    "/pathfinders": "nav.pathfinders",
    "/welfare": "nav.welfare",
    "/sabbath-school": "nav.sabbath_school",
    "/health": "nav.health_ministry",
    "/communion": "nav.communion",
    "/av": "nav.av_sync",
    "/district": "nav.district_hub",
    "/facilities": "nav.facilities",
    "/crisis": "nav.crisis_assets",
    "/transfers": "nav.transfers",
    "/households": "nav.households",
    "/candidacies": "nav.candidacies",
    "/nominating": "nav.nominating",
    "/discipline": "nav.discipline",
    "/safety": "nav.safety",
    "/audit": "nav.audit",
    "/conference": "nav.conference_report",
    "/setup": "nav.church_setup",
    "/help": "nav.help_center",
    "/join": "Join",
  };

  function getPageTitle(): string {
    const path = $page.url.pathname;
    const key = pathTitleMap[path];
    if (key) return t(key);
    return t("common.app_name");
  }
</script>

<svelte:head>
  <title>{getPageTitle()} — {t("common.app_name")}</title>
</svelte:head>

{#if isAuthPage || !profile}
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 pb-safe">
    <main class="mx-auto max-w-lg px-4 py-8" style="animation: fade-in 0.15s ease-out">
      {@render children()}
    </main>
  </div>
{:else}
  <div class="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
    <aside class="hidden lg:flex lg:w-60 lg:flex-col lg:border-r lg:border-slate-200 lg:bg-white dark:border-slate-800 dark:bg-slate-900">
      <Sidebar {roles} />
    </aside>

    <div class="flex flex-1 flex-col overflow-hidden">
      <header class="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 pt-safe wco-drag dark:border-slate-800 dark:bg-slate-900" style="padding-top: calc(0.5rem + var(--safe-area-inset-top))">
        <Sheet open={mobileNavOpen} onOpenChange={(o) => mobileNavOpen = o}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" class="lg:hidden" aria-label={t("layout.open_menu")}>
              <Menu class="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" class="w-60 p-0 pt-safe pb-safe">
            <Sidebar {roles} onNavigate={() => mobileNavOpen = false} />
          </SheetContent>
        </Sheet>

        <nav class="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
          <a href="/dashboard" class="hover:text-slate-900 dark:hover:text-slate-200 transition-colors">{t("common.app_name")}</a>
          <span class="text-slate-300 dark:text-slate-600">/</span>
          <span class="font-medium text-slate-900 dark:text-slate-100">{getPageTitle()}</span>
        </nav>

        <div class="flex-1"></div>

        <div class="flex items-center gap-2">
          {#if notifCount > 0}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  class="relative inline-flex items-center rounded-full p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label={t("layout.notifications", { n: notifCount })}
                >
                  <Bell class="size-4" />
                  <span class="absolute -right-0.5 -top-0.5 flex size-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                    {notifCount}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" class="w-72 max-h-64 overflow-y-auto">
                <div class="flex items-center justify-between px-2 py-1.5 border-b">
                  <span class="text-xs font-medium">Notifications</span>
                  <button class="text-xs text-brand-600 hover:underline" onclick={() => { notifCount = 0; notificationHistory = []; }}>Clear all</button>
                </div>
                {#each notificationHistory as n}
                  <div class="px-3 py-2 text-xs border-b last:border-0">
                    <p>{n.message}</p>
                    <p class="text-slate-400 mt-0.5">{new Date(n.timestamp).toLocaleTimeString()}</p>
                  </div>
                {/each}
              </DropdownMenuContent>
            </DropdownMenu>
          {/if}
          {#if !online}
            <span class="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 cursor-help" title={t("layout.offline")}>
              <span class="size-1.5 rounded-full bg-red-500"></span>
              {t("layout.offline")}
            </span>
          {/if}
          {#if pendingSync > 0}
            <span class="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 cursor-help" title={t("layout.pending_syncs", { n: pendingSync })}>
              {t("layout.pending_syncs", { n: pendingSync })}
            </span>
          {/if}
        </div>

        <LocaleSwitcher />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" class="rounded-full" aria-label={t("layout.user_menu")}>
              <Avatar class="size-8">
                <AvatarFallback class="bg-brand-100 text-brand-900 text-xs font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-48">
            <div class="flex items-center gap-2 px-2 py-1.5">
              <div class="flex flex-col">
                <span class="text-sm font-medium">{profile?.firstName || profile?.email}</span>
                <span class="text-xs text-slate-500">{profile?.email}</span>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onclick={() => goto("/me")}>
              <User class="size-4" />
              {t("nav.profile")}
            </DropdownMenuItem>
            <DropdownMenuItem onclick={() => goto("/help")}>
              <HelpCircle class="size-4" />
              {t("nav.help_center")}
            </DropdownMenuItem>
            <DropdownMenuItem onclick={toggleDark}>
              {#if dark}
                <Sun class="size-4" />
                {t("layout.light_mode")}
              {:else}
                <Moon class="size-4" />
                {t("layout.dark_mode")}
              {/if}
            </DropdownMenuItem>
            <DropdownMenuItem onclick={() => { cmdOpen = true; }}>
              <Keyboard class="size-4" />
              {t("layout.shortcuts")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onclick={() => signOutOpen = true} class="text-red-600">
              <LogOut class="size-4" />
              {t("layout.sign_out")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <main class="flex-1 overflow-y-auto p-6 pb-safe" style="animation: fade-in-up 0.2s ease-out both">
        <PullToRefresh onrefresh={async () => { window.location.reload(); }}>
          {@render children()}
        </PullToRefresh>
      </main>
    </div>
  </div>

  <div class="sr-only" role="status" aria-live="polite" aria-atomic="true"></div>
  <InstallPrompt />
  <Toaster position="bottom-right" />
  <CommandPalette {roles} open={cmdOpen} onOpenChange={(o) => cmdOpen = o} />
  <KeyboardShortcuts open={shortcutsOpen} onOpenChange={(o) => shortcutsOpen = o} />
  <ConfirmDialog
    open={signOutOpen}
    onOpenChange={(o) => signOutOpen = o}
    title={t("layout.sign_out_confirm_label")}
    description={t("layout.sign_out_confirm")}
    confirmLabel={t("layout.sign_out_confirm_label")}
    variant="destructive"
    onconfirm={signOut}
  />
{/if}
