<script lang="ts">
  import '../app.css';
  let { children } = $props();
</script>

<div class="app">
  <header class="header">
    <a href="/" class="logo">Theobase</a>
  </header>
  <main>
    {@render children()}
  </main>
</div>

<style>
  .app { max-width: 640px; margin: 0 auto; padding: 0 16px; }
  .header { display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-bottom: 1px solid #e2e8f0; }
  .logo { font-weight: 700; font-size: 1.25rem; color: #1a365d; text-decoration: none; }
  main { padding: 24px 0; }
</style>
