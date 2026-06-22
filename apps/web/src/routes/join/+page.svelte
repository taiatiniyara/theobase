<script lang="ts">
  import { verifyToken, setToken, joinCongregationByCode } from '$lib/api';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { LoaderCircle, CheckCircle, XCircle, Church, Users, ArrowRight, ArrowLeft } from '@lucide/svelte';

  let tokenMode = $state(false);
  let roleName = $state('');
  let joining = $state(false);
  let error = $state('');
  let success = $state(false);
  let congrName = $state('');
  let code = $state('');
  let showCodeInput = $state(false);
  let clerkConfirmed = $state(false);

  onMount(async () => {
    const token = $page.url.searchParams.get('token');
    if (token) {
      tokenMode = true;
      const role = $page.url.searchParams.get('role') || '';
      roleName = role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      joining = true;
      try {
        const res = await verifyToken(token);
        if (res.ok && res.token) {
          setToken(res.token);
          success = true;
          setTimeout(() => goto('/dashboard'), 2000);
        } else {
          error = res.error || 'Invalid or expired invitation.';
        }
      } catch {
        error = 'Could not verify your invitation. Please contact your congregation clerk.';
      }
      joining = false;
    }
  });

  async function submitCode() {
    if (code.length !== 8 || !/^\d{8}$/.test(code)) {
      error = 'Please enter a valid 8-digit code.';
      return;
    }
    error = '';
    joining = true;
    try {
      const res = await joinCongregationByCode(code);
      if (res.ok) {
        success = true;
        congrName = res.congregationName || '';
        setTimeout(() => goto('/dashboard'), 2000);
      } else {
        error = res.error || 'Invalid invite code.';
      }
    } catch {
      error = 'Something went wrong. Please try again.';
    }
    joining = false;
  }

  function onCodeInput(e: Event) {
    const input = e.target as HTMLInputElement;
    const cleaned = input.value.replace(/\D/g, '').slice(0, 8);
    code = cleaned;
  }
</script>

<svelte:head>
  <title>Join — Theobase</title>
</svelte:head>

<div class="pt-8">
  <Card class="mx-auto max-w-md">
    {#if tokenMode}
      <CardContent class="space-y-4 py-8 text-center">
        {#if joining}
          <div class="flex justify-center">
            <LoaderCircle class="size-12 animate-spin text-slate-400" />
          </div>
          <div>
            <h1 class="text-2xl font-bold text-slate-900">Joining Theobase...</h1>
            <p class="text-sm text-slate-500">Verifying your invitation{roleName ? ` as ${roleName}` : ''}.</p>
          </div>
        {:else if success}
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
            <Button variant="outline">Try signing in</Button>
          </a>
        {/if}
      </CardContent>

    {:else if showCodeInput}
      <CardHeader class="text-center">
        <CardTitle class="text-xl">Join your church</CardTitle>
        <CardDescription>Enter the 8-digit invite code from your congregation clerk.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        {#if success}
          <div class="flex flex-col items-center gap-3 py-4">
            <CheckCircle class="size-12 text-green-500" />
            <div class="text-center">
              <p class="font-medium">Welcome to {congrName || 'Theobase'}!</p>
              <p class="text-sm text-slate-500">Redirecting to dashboard...</p>
            </div>
          </div>
        {:else}
          <div class="space-y-2">
            <Label for="invite-code">Invite Code</Label>
            <Input
              id="invite-code"
              type="text"
              inputmode="numeric"
              maxlength="8"
              placeholder="00000000"
              value={code}
              oninput={onCodeInput}
              onkeydown={(e) => e.key === 'Enter' && submitCode()}
              class="text-center text-2xl tracking-[0.3em] font-mono"
            />
          </div>
          {#if error}
            <p class="text-sm text-red-600 text-center">{error}</p>
          {/if}
          <Button class="w-full" onclick={submitCode} disabled={joining || code.length !== 8}>
            {joining ? 'Joining...' : 'Join'}
          </Button>
          <p class="text-center text-xs text-muted-foreground">
            Don't have a code? Ask your congregation clerk.
          </p>
          <button class="w-full text-center text-xs text-muted-foreground underline hover:text-foreground" onclick={() => { showCodeInput = false; code = ''; error = ''; }}>
            ← Back
          </button>
        {/if}
      </CardContent>

    {:else}
      <CardHeader class="text-center">
        <CardTitle class="text-xl">Join Theobase</CardTitle>
        <CardDescription>How would you like to get started?</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <button
          onclick={() => { showCodeInput = true; }}
          class="flex w-full items-start gap-4 rounded-lg border p-4 text-left hover:bg-muted/50 transition-colors"
        >
          <div class="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
            <Users class="size-5" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-slate-900 dark:text-slate-100">I have an invite code</p>
            <p class="text-xs text-slate-500">I'm joining my church as a member or officer. My clerk gave me an 8-digit code.</p>
          </div>
          <ArrowRight class="size-4 text-slate-300 shrink-0 mt-1" />
        </button>

        <a
          href={clerkConfirmed ? "/setup" : undefined}
          onclick={(e) => { if (!clerkConfirmed) { e.preventDefault(); clerkConfirmed = true; } }}
          class="flex w-full items-start gap-4 rounded-lg border p-4 text-left hover:bg-muted/50 transition-colors"
        >
          <div class="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
            <Church class="size-5" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-slate-900 dark:text-slate-100">I'm a church clerk</p>
            <p class="text-xs text-slate-500">
              {clerkConfirmed
                ? "Click again to start setting up your congregation."
                : "I'm setting up my congregation and am authorized to manage its records."}
            </p>
          </div>
          <ArrowRight class="size-4 text-brand-300 shrink-0 mt-1" />
        </a>
      </CardContent>
    {/if}
  </Card>
</div>
