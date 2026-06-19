<script lang="ts">
  import '../app.css';
  import { getMe, clearToken, getToken } from '$lib/api';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  let { children } = $props();
  let profile = $state<any>(null);
  let navOpen = $state(false);
  let online = $state(true);
  let pendingSync = $state(0);

  onMount(async () => {
    const token = getToken();
    if (token) {
      try {
        profile = await getMe();
      } catch { clearToken(); }
    }

    // Service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'connectivity') {
          online = event.data.online;
          if (event.data.online) {
            navigator.serviceWorker.controller?.postMessage({ type: 'sync_outbox' });
          }
        } else if (event.data?.type === 'outbox_queued') {
          pendingSync++;
        } else if (event.data?.type === 'outbox_synced') {
          pendingSync = event.data.remaining || 0;
        }
      });

      // Initial connectivity check
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'check_online' });
      }
    }
  });

  function signOut() {
    clearToken();
    profile = null;
    goto('/');
  }

  function isClerk() {
    return profile?.roles?.includes('clerk');
  }

  function isTreasurer() {
    return profile?.roles?.includes('treasurer');
  }

  const isAuthPage = $derived($page.url.pathname.startsWith('/auth'));
</script>

<div class="app">
  <header class="header">
    <a href={profile ? '/dashboard' : '/'} class="logo">Theobase</a>
    <div style="display: flex; align-items: center; gap: 8px;">
      {#if !online}
        <span class="offline-badge">Offline</span>
      {/if}
      {#if pendingSync > 0}
        <span class="sync-badge">{pendingSync}</span>
      {/if}
      {#if profile && !isAuthPage}
        <button class="menu-toggle" onclick={() => navOpen = !navOpen}>
          {navOpen ? '✕' : '☰'}
        </button>
      {/if}
    </div>
  </header>

  {#if navOpen && profile}
    <nav class="mobile-nav">
      <a href="/dashboard" class:active={$page.url.pathname === '/dashboard'}>Dashboard</a>
      <a href="/me" class:active={$page.url.pathname === '/me'}>Profile</a>
      <a href="/receipts" class:active={$page.url.pathname === '/receipts'}>Giving</a>
      {#if isClerk() || isTreasurer()}
        <a href="/boardroom" class:active={$page.url.pathname === '/boardroom'}>Boardroom</a>
      {/if}
      {#if isTreasurer()}
        <a href="/treasury" class:active={$page.url.pathname === '/treasury'}>Treasury</a>
      {/if}
      {#if isClerk()}
        <a href="/rota" class:active={$page.url.pathname === '/rota'}>Rota</a>
        <a href="/congregation" class:active={$page.url.pathname === '/congregation'}>Congregation</a>
        <a href="/pathfinders" class:active={$page.url.pathname === '/pathfinders'}>Pathfinders</a>
        <a href="/welfare" class:active={$page.url.pathname === '/welfare'}>Welfare</a>
        <a href="/sabbath-school" class:active={$page.url.pathname === '/sabbath-school'}>Sabbath School</a>
        <a href="/health" class:active={$page.url.pathname === '/health'}>Health Ministry</a>
        <a href="/communion" class:active={$page.url.pathname === '/communion'}>Communion</a>
        <a href="/av" class:active={$page.url.pathname === '/av'}>AV Sync</a>
        <a href="/district" class:active={$page.url.pathname === '/district'}>District Hub</a>
        <a href="/facilities" class:active={$page.url.pathname === '/facilities'}>Facilities</a>
        <a href="/crisis" class:active={$page.url.pathname === '/crisis'}>Crisis Assets</a>
        <a href="/transfers" class:active={$page.url.pathname === '/transfers'}>Transfers</a>
        <a href="/nominating" class:active={$page.url.pathname === '/nominating'}>Nominating</a>
        <a href="/conference" class:active={$page.url.pathname === '/conference'}>Conference Report</a>
      {/if}
      <button class="nav-signout" onclick={signOut}>Sign out</button>
    </nav>
  {/if}

  <main>
    {@render children()}
  </main>
</div>

<style>
  .app { max-width: 640px; margin: 0 auto; padding: 0 16px; }
  .header { display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-bottom: 1px solid #e2e8f0; }
  .logo { font-weight: 700; font-size: 1.25rem; color: #1a365d; text-decoration: none; }
  .menu-toggle { background: #edf2f7; color: #1a365d; padding: 8px 12px; font-size: 1.2rem; line-height: 1; }
  .mobile-nav { display: flex; flex-direction: column; gap: 4px; padding: 12px 0; border-bottom: 1px solid #e2e8f0; }
  .mobile-nav a {
    display: block; padding: 10px 12px; border-radius: 8px; text-decoration: none;
    color: #4a5568; font-size: 0.95rem; font-weight: 500;
  }
  .mobile-nav a.active { background: #ebf4ff; color: #1a365d; }
  .mobile-nav a:hover { background: #f7fafc; }
  .nav-signout {
    margin-top: 8px; padding: 10px 12px; background: transparent; color: #e53e3e;
    text-align: left; font-size: 0.95rem; font-weight: 500;
  }
  .offline-badge {
    background: #fed7d7; color: #9b2c2c; padding: 2px 8px; border-radius: 12px;
    font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;
  }
  .sync-badge {
    background: #fefcbf; color: #975a16; padding: 2px 8px; border-radius: 12px;
    font-size: 0.7rem; font-weight: 600; min-width: 18px; text-align: center;
  }
  main { padding: 24px 0; }
</style>
