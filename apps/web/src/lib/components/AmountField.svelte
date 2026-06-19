<script lang="ts">
  import FormField from './FormField.svelte';

  interface Props {
    label?: string;
    cents?: number;
    error?: string;
    placeholder?: string;
    disabled?: boolean;
    onchange?: (cents: number) => void;
  }

  let {
    label = 'Amount ($)',
    cents = 0,
    error = '',
    placeholder = '0.00',
    disabled = false,
    onchange = undefined,
  }: Props = $props();

  let raw = $state('');
  let lastCents = $state(cents);

  $effect(() => {
    if (cents !== lastCents) {
      lastCents = cents;
      raw = cents > 0 ? (cents / 100).toFixed(2) : '';
    }
  });

  function handleBlur() {
    const cleaned = raw.replace(/[^0-9.]/g, '');
    if (!cleaned) return;
    const num = parseFloat(cleaned);
    if (isNaN(num)) return;
    raw = num.toFixed(2);
    if (onchange) onchange(Math.round(num * 100));
  }

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    raw = target.value;
  }
</script>

<FormField
  {label}
  {error}
  {placeholder}
  {disabled}
  type="text"
  value={raw}
  oninput={handleInput}
  onblur={handleBlur}
/>
