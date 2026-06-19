<script lang="ts">
  import { onMount } from "svelte";

  interface Props {
    value: number;
    prefix?: string;
    suffix?: string;
    duration?: number;
    decimals?: number;
  }

  let {
    value,
    prefix = "",
    suffix = "",
    duration = 600,
    decimals = 0,
  }: Props = $props();

  let current = $state(0);

  function animate() {
    const start = performance.now();
    const from = 0;
    const to = value;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      current = from + (to - from) * eased;
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        current = to;
      }
    }

    requestAnimationFrame(tick);
  }

  $effect(() => {
    if (value > 0) animate();
  });
</script>

<span class="tabular-nums">
  {prefix}{current.toFixed(decimals)}{suffix}
</span>
