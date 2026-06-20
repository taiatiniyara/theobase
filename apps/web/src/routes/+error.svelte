<script lang="ts">
  import { page } from "$app/stores";
  import { getToken } from "$lib/api";
  import { Button } from "$lib/components/ui/button";
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";

  const homeHref = $derived(getToken() ? "/dashboard" : "/");

  const message = $derived(
    $page.status === 404
      ? "Page not found."
      : $page.status === 500
        ? "Server error. Please try again."
        : "An unexpected error occurred.",
  );
</script>

<svelte:head>
  <title>Error — Theobase</title>
</svelte:head>

<div class="flex min-h-[60vh] items-center justify-center">
  <Card class="w-full max-w-md text-center">
    <CardHeader>
      <CardTitle>{$page.status === 404 ? "Page not found" : "Something went wrong"}</CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <p class="text-slate-500">{message}</p>
      <div class="flex items-center justify-center gap-3">
        <a href={homeHref}>
          <Button>Go home</Button>
        </a>
        <Button variant="outline" onclick={() => window.location.reload()}>Try again</Button>
      </div>
    </CardContent>
  </Card>
</div>
