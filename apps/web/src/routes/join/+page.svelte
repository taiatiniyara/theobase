<script lang="ts">
  import { verifyToken, setToken } from '$lib/api';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { Card, CardContent } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { LoaderCircle, CheckCircle, XCircle, LogIn } from '@lucide/svelte';

  let status = $state<'joining' | 'error' | 'success'>('joining');
  let error = $state('');
  let roleName = $state('');

  onMount(async () => {
    const token = $page.url.searchParams.get('token');
    const role = $page.url.searchParams.get('role') || '';
    roleName = role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    if (!token) {
      status = 'error';
      error = 'No invitation token provided.';
      return;
    }
    try {
      const res = await verifyToken(token);
      if (res.ok && res.token) {
        setToken(res.token);
        status = 'success';
        setTimeout(() => goto('/dashboard'), 2000);
      } else {
        status = 'error';
        error = res.error || 'Invalid or expired invitation.';
      }
    } catch {
      status = 'error';
      error = 'Could not verify your invitation. Please contact your congregation clerk.';
    }
  });
</script>

<svelte:head>
  <title>Join — Theobase</title>
</svelte:head>

<div class="pt-8">
  <Card class="mx-auto max-w-md text-center">
    <CardContent class="space-y-4 py-8">
      {#if status === 'joining'}
        <div class="flex justify-center">
          <LoaderCircle class="size-12 animate-spin text-slate-400" />
        </div>
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Joining Theobase...</h1>
          <p class="text-sm text-slate-500">Verifying your invitation{roleName ? ` as ${roleName}` : ''}.</p>
        </div>
      {:else if status === 'success'}
        <div class="flex justify-center">
          <CheckCircle class="size-12 text-green-500" />
        </div>
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Welcome!</h1>
          <p class="text-sm text-slate-500">
            You've joined Theobase{roleName ? ` as ${roleName}` : ''}. Redirecting to dashboard...
          </p>
        </div>
      {:else}
        <div class="flex justify-center">
          <XCircle class="size-12 text-red-500" />
        </div>
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Invitation failed</h1>
          <p class="text-sm text-red-600">{error}</p>
        </div>
        <a href="/">
          <Button variant="outline">
            <LogIn class="size-4" />
            Try signing in
          </Button>
        </a>
      {/if}
    </CardContent>
  </Card>
</div>
