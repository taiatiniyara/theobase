<script lang="ts">
  import { Sparkles } from "@lucide/svelte";

  interface Props {
    trigger: boolean;
    message?: string;
  }

  let { trigger, message = "Well done!" }: Props = $props();

  type Phase = "idle" | "visible" | "exiting";
  let phase = $state<Phase>("idle");

  const CONFETTI_COLORS = [
    "bg-brand-500",
    "bg-amber-400",
    "bg-green-400",
    "bg-red-400",
    "bg-purple-400",
    "bg-pink-400",
  ];

  interface Dot {
    color: string;
    style: string;
  }

  let dots = $state<Dot[]>([]);

  function spawnConfetti(): Dot[] {
    return Array.from({ length: 12 }, () => {
      const angle = Math.random() * 360;
      const distance = 40 + Math.random() * 80;
      const tx = Math.cos((angle * Math.PI) / 180) * distance;
      const ty = Math.sin((angle * Math.PI) / 180) * distance;
      const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      const delay = Math.random() * 0.15;
      const size = 3 + Math.random() * 2;
      return {
        color,
        style: `--tx:${tx}px;--ty:${ty}px;--delay:${delay}s;--rotate:${Math.random() * 360}deg;width:${size}px;height:${size}px`,
      };
    });
  }

  $effect(() => {
    if (trigger) {
      dots = spawnConfetti();
      phase = "visible";

      const timer = setTimeout(() => {
        phase = "exiting";
      }, 3000);

      return () => clearTimeout(timer);
    }
  });

  function handleAnimationEnd(e: AnimationEvent) {
    if (e.target !== e.currentTarget) return;
    if (phase === "exiting") {
      phase = "idle";
    }
  }
</script>

{#if phase !== "idle"}
  <div
    class="fixed bottom-6 right-6 z-50"
    class:animate-celebration-in={phase === "visible"}
    class:animate-celebration-out={phase === "exiting"}
    onanimationend={handleAnimationEnd}
  >
    {#each dots as dot, i (i)}
      <span
        class="confetti-dot absolute rounded-full {dot.color}"
        style="left:30px;top:24px;{dot.style}"
      ></span>
    {/each}

    <div
      class="relative rounded-xl shadow-lg bg-white dark:bg-slate-900 border border-border px-5 py-4 flex items-center gap-3 min-w-[240px]"
    >
      <Sparkles class="h-5 w-5 text-brand-500 shrink-0" />
      <span class="text-sm font-medium text-card-foreground">{message}</span>
    </div>
  </div>
{/if}

<style>
  @keyframes celebration-in {
    from {
      opacity: 0;
      transform: translate(24px, 24px) scale(0.92);
    }
    to {
      opacity: 1;
      transform: translate(0, 0) scale(1);
    }
  }

  @keyframes celebration-out {
    from {
      opacity: 1;
      transform: translate(0, 0) scale(1);
    }
    to {
      opacity: 0;
      transform: translate(24px, 24px) scale(0.92);
    }
  }

  @keyframes confetti-burst {
    0% {
      opacity: 1;
      transform: translate(0, 0) rotate(0deg) scale(1);
    }
    100% {
      opacity: 0;
      transform: translate(var(--tx), var(--ty)) rotate(var(--rotate)) scale(0.3);
    }
  }

  .animate-celebration-in {
    animation: celebration-in 0.35s ease-out both;
  }

  .animate-celebration-out {
    animation: celebration-out 0.3s ease-in both;
  }

  .confetti-dot {
    animation: confetti-burst 0.8s ease-out var(--delay, 0s) both;
    pointer-events: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .animate-celebration-in,
    .animate-celebration-out,
    .confetti-dot {
      animation-duration: 0.01ms !important;
    }
  }
</style>
