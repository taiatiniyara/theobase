<script lang="ts">
  import { requestMagicLink } from "$lib/api";
  import { toast } from "$lib/toast";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";

  let email = $state("");
  let status = $state<"idle" | "sent" | "error">("idle");
  let emailError = $state("");
  let loading = $state(false);

  async function submit() {
    status = "idle";
    emailError = "";
    if (!email.includes("@")) {
      emailError = "Please enter a valid email address.";
      return;
    }
    loading = true;
    try {
      await requestMagicLink(email);
      status = "sent";
      toast.success("Check your email for the magic link.");
    } catch {
      status = "error";
      toast.error("Something went wrong. Try again.");
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Sign in — Theobase</title>
</svelte:head>

<div class="flex min-h-[80vh] items-center justify-center">
  <Card class="w-full max-w-md">
    <CardHeader class="text-center">
      <CardTitle class="text-2xl">Sign in to Theobase</CardTitle>
      <CardDescription>
        Enter your email address and we'll send you a sign-in link.
      </CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      {#if status === "sent"}
        <div class="rounded-lg bg-green-50 p-4 text-sm text-green-800">
          Check your email &mdash; we sent you a magic link.
        </div>
      {:else}
        <div class="space-y-2">
          <Label for="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="elder@mychurch.org"
            bind:value={email}
            onkeydown={(e) => e.key === "Enter" && submit()}
            onblur={() => { emailError = email.includes("@") ? "" : "Please enter a valid email address."; }}
          />
          {#if emailError}
            <p class="text-sm text-red-600">{emailError}</p>
          {/if}
        </div>
        <Button class="w-full" onclick={submit} disabled={!email.includes("@") || loading || !!emailError}>
          {loading ? "Sending..." : "Send magic link"}
        </Button>
        {#if status === "error"}
          <p class="text-center text-sm text-red-600">Something went wrong. Try again.</p>
        {/if}
      {/if}
    </CardContent>
  </Card>
</div>
