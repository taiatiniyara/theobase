<script lang="ts">
  interface Props {
    each: unknown[];
    delay?: number;
    children: import("svelte").Snippet<[item: unknown, index: number]>;
  }

  let { each, delay = 0.04, children }: Props = $props();
</script>

<div class="contents">
  {#each each as item, i}
    <div
      style="opacity: 0; animation: fade-in-up 0.35s ease-out forwards; animation-delay: {i * delay}s"
    >
      {@render children(item, i)}
    </div>
  {/each}
</div>
