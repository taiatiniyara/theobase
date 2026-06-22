<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { loadStripe, type Stripe } from "@stripe/stripe-js";
  import {
    STRIPE_PUBLISHABLE_KEY,
    getBillingPlans,
    getBillingSubscription,
    createCheckoutSession,
    createPortalSession,
  } from "$lib/api";
  import { requireRole } from "$lib/guard";
  import { toast } from "$lib/toast";
  import { locale, getT } from "$lib/i18n";
  import { Button } from "$lib/components/ui/button";
  import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Skeleton } from "$lib/components/ui/skeleton";
  import { Badge } from "$lib/components/ui/badge";
  import Check from "@lucide/svelte/icons/check";
  import ExternalLink from "@lucide/svelte/icons/external-link";
  import Loader from "@lucide/svelte/icons/loader";

  interface BillingPlan {
    id: string;
    name: string;
    description: string | null;
    amount: number;
    currency: string;
    interval: string;
    features: string[] | null;
    active: boolean;
  }

  interface BillingSubscription {
    id: string;
    status: string;
    planId: string | null;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    stripeCustomerId: string;
  }

  const t = $derived(getT($locale));

  let authorized = $state(false);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let plans = $state<BillingPlan[]>([]);
  let currentSub = $state<BillingSubscription | null>(null);
  let checkoutLoading = $state<string | null>(null);
  let portalLoading = $state(false);
  let stripePromise = $state<Promise<Stripe | null> | null>(null);
  let checkoutContainer = $state<HTMLDivElement | null>(null);

  function formatPrice(amount: number, currency: string): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
    }).format(amount / 100);
  }

  function formatInterval(interval: string): string {
    return interval === "month" ? "month" : "year";
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function statusVariant(
    status: string,
  ): "default" | "success" | "destructive" | "warning" | "outline" {
    switch (status) {
      case "active":
      case "trialing":
        return "success";
      case "past_due":
      case "unpaid":
        return "destructive";
      case "canceled":
      case "incomplete_expired":
        return "outline";
      case "paused":
        return "warning";
      default:
        return "default";
    }
  }

  async function loadData() {
    const [plansData, subData] = await Promise.all([
      getBillingPlans().catch(() => []),
      getBillingSubscription().catch(() => null),
    ]);
    plans = plansData as BillingPlan[];
    currentSub = subData as BillingSubscription | null;
  }

  async function handleSubscribe(planId: string) {
    checkoutLoading = planId;
    try {
      const { clientSecret } = await createCheckoutSession(planId);
      if (!stripePromise) {
        stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
      }
      const stripe = await stripePromise;
      if (!stripe) {
        toast.error("Failed to load Stripe");
        return;
      }
      const checkout = await stripe.initEmbeddedCheckout({ clientSecret });
      if (checkoutContainer) {
        checkout.mount(checkoutContainer);
      }
    } catch (e: any) {
      toast.error(e?.message || "Checkout failed");
    } finally {
      checkoutLoading = null;
    }
  }

  async function handlePortal() {
    portalLoading = true;
    try {
      const { url } = await createPortalSession();
      window.location.href = url;
    } catch (e: any) {
      toast.error(e?.message || "Portal failed");
      portalLoading = false;
    }
  }

  const currentPlanId = $derived(currentSub?.planId);

  onMount(async () => {
    const ok = await requireRole("clerk", "treasurer");
    if (!ok) return;
    authorized = true;
    try {
      await loadData();
    } catch (e: any) {
      error = e?.message || "Failed to load billing data";
    } finally {
      loading = false;
    }

    const sessionId = $page.url.searchParams.get("session_id");
    if (sessionId) {
      goto("/billing", { replaceState: true });
      await loadData();
    }
  });
</script>

{#if loading}
  <div class="space-y-6">
    <div>
      <Skeleton class="h-8 w-48" />
      <Skeleton class="h-4 w-64 mt-2" />
    </div>
    <div class="grid gap-6 md:grid-cols-3">
      {#each [1, 2, 3] as _}
        <Skeleton class="h-64" />
      {/each}
    </div>
  </div>
{:else if error}
  <Card>
    <CardContent class="py-12 text-center">
      <p class="text-red-600 dark:text-red-400">{error}</p>
      <Button variant="outline" class="mt-4" onclick={() => { error = null; loading = true; loadData().then(() => loading = false).catch(() => { loading = false; error = "Failed to reload"; }); }}>
        {t("common.retry")}
      </Button>
    </CardContent>
  </Card>
{:else}
  <div class="space-y-8">
    <div>
      <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">Billing</h1>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {#if currentSub}
          {currentSub.status === "active"
            ? "Your subscription is active"
            : `Status: ${currentSub.status}`}
          {#if currentSub.cancelAtPeriodEnd}
            &mdash; cancels on {formatDate(currentSub.currentPeriodEnd)}
          {/if}
        {:else}
          Choose a plan to get started
        {/if}
      </p>
    </div>

    {#if currentSub && currentSub.status === "active"}
      <Card>
        <CardHeader>
          <CardTitle>Current Subscription</CardTitle>
          <CardDescription>
            Your congregation is subscribed
            {#if currentSub.cancelAtPeriodEnd}
              &mdash; will end on {formatDate(currentSub.currentPeriodEnd)}
            {/if}
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-2">
          <div class="flex items-center gap-2">
            <span class="text-sm text-slate-500 dark:text-slate-400">Status:</span>
            <Badge variant={statusVariant(currentSub.status)}>
              {currentSub.status}
            </Badge>
          </div>
          <div class="text-sm text-slate-500 dark:text-slate-400">
            Current period ends: {formatDate(currentSub.currentPeriodEnd)}
          </div>
        </CardContent>
        <CardFooter>
          <Button onclick={handlePortal} disabled={portalLoading}>
            {#if portalLoading}
              <Loader class="size-4 mr-2 animate-spin" />
            {/if}
            Manage Billing
            <ExternalLink class="size-4 ml-1" />
          </Button>
        </CardFooter>
      </Card>
    {/if}

    <div class="grid gap-6 md:grid-cols-3">
      {#each plans as plan}
        {@const isCurrent = currentPlanId === plan.id}
        <Card class={isCurrent ? "ring-2 ring-brand-500" : ""}>
          <CardHeader>
            <CardTitle class="flex items-center justify-between">
              {plan.name}
              {#if isCurrent}
                <Badge variant="success">Current</Badge>
              {/if}
            </CardTitle>
            <CardDescription>{plan.description}</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="text-3xl font-bold">
              {formatPrice(plan.amount, plan.currency)}
              <span class="text-base font-normal text-slate-500 dark:text-slate-400">
                /{formatInterval(plan.interval)}
              </span>
            </div>
            {#if plan.features?.length}
              <ul class="space-y-2">
                {#each plan.features as feature}
                  <li class="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Check class="size-4 mt-0.5 shrink-0 text-green-500" />
                    {feature}
                  </li>
                {/each}
              </ul>
            {/if}
          </CardContent>
          <CardFooter>
            <Button
              class="w-full"
              variant={isCurrent ? "outline" : "default"}
              disabled={isCurrent || checkoutLoading === plan.id}
              onclick={() => handleSubscribe(plan.id)}
            >
              {#if checkoutLoading === plan.id}
                <Loader class="size-4 mr-2 animate-spin" />
                Loading...
              {:else if isCurrent}
                Current Plan
              {:else if currentSub}
                Switch Plan
              {:else}
                Subscribe
              {/if}
            </Button>
          </CardFooter>
        </Card>
      {/each}
    </div>

    <div bind:this={checkoutContainer} id="checkout-container"></div>
  </div>
{/if}
