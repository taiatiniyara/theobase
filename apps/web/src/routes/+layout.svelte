<script lang="ts">
  import '../app.css';
  import { getMe, clearToken, getToken } from '$lib/api';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  let { children } = $props();
  let profile = $state<any>(null);
  let navOpen = $state(false);

  onMount(async () => {
    const token = getToken();
    if (token) {
      try {
        profile = await getMe();
      } catch { clearToken(); }
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
    {#if profile && !isAuthPage}
      <button class="menu-toggle" onclick={() => navOpen = !navOpen}>
        {navOpen ? '✕' : '☰'}
      </button>
    {/if}
  </header>

  {#if navOpen && profile}
    <nav class="mobile-nav">
      <a href="/dashboard" class:active={$page.url.pathname === '/dashboard'}>Dashboard</a>
      <a href="/me" class:active={$page.url.pathname === '/me'}>Profile</a>
      <a href="/receipts" class:active={$page.url.pathname === '/receipts'}>Giving</a>
      {#if isClerk() || isTreasurer()}
        <a href="/boardroom" class:active={$page.url.pathname === '/boardroom'}>Boardroom</a>
      {/if}
      {#if isClerk()}
        <a href="/rota" class:active={$page.url.pathname === '/rota'}>Rota</a>
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
  main { padding: 24px 0; }
</style>
