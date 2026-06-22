<script lang="ts">
  import { verifyToken, setToken } from "$lib/api";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Loader2 } from "@lucide/svelte";

  let status = $state<"verifying" | "error">("verifying");
  let error = $state("");

  onMount(async () => {
    const token = $page.url.searchParams.get("token");
    if (!token) {
      status = "error";
      error = "No token provided.";
      return;
    }
    try {
      const res = await verifyToken(token);
      if (res.ok && res.token) {
        setToken(res.token);
        if (res.hasCongregation) {
          goto("/dashboard");
        } else {
          goto("/join");
        }
      } else {
        status = "error";
        error = res.error || "Invalid or expired token.";
      }
    } catch {
      status = "error";
      error = "Could not verify your token. Please request a new link.";
    }
  });
</script>

<svelte:head>
  <title>Verify — Theobase</title>
</svelte:head>

<div class="flex min-h-[80vh] items-center justify-center">
  <Card class="w-full max-w-md text-center">
    <CardHeader>
      <CardTitle>
        {status === "verifying" ? "Verifying..." : "Sign-in failed"}
      </CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      {#if status === "verifying"}
        <div class="flex items-center justify-center gap-2 text-slate-500">
          <Loader2 class="size-4 animate-spin" />
          Checking your sign-in link.
        </div>
      {:else}
        <p class="text-red-600">{error}</p>
        <p class="text-xs text-slate-500 mt-1">Your verification link may have expired or already been used.</p>
        <a href="/">
          <Button>Request a new link</Button>
        </a>
      {/if}
    </CardContent>
  </Card>
</div>
