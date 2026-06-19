<script lang="ts">
  import { page } from "$app/stores";
  import { Button } from "$lib/components/ui/button";
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";

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
      <CardTitle>Something went wrong</CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <p class="text-slate-500">{message}</p>
      <a href="/">
        <Button>Go home</Button>
      </a>
    </CardContent>
  </Card>
</div>
