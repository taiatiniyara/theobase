<script lang="ts">
  import { cn } from "$lib/utils";
  import { Label } from "$lib/components/ui/label";
  import { Input } from "$lib/components/ui/input";
  import { Textarea } from "$lib/components/ui/textarea";

  interface Props {
    label: string;
    type?: string;
    value?: string | number;
    hint?: string;
    error?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    class?: string;
    oninput?: (e: Event) => void;
    onchange?: (e: Event) => void;
    onblur?: (e: Event) => void;
  }

  let {
    label,
    type = "text",
    value = "",
    hint = "",
    error = "",
    placeholder = "",
    required = false,
    disabled = false,
    class: className = "",
    oninput = undefined,
    onchange = undefined,
    onblur = undefined,
  }: Props = $props();

  const id = $derived(`field-${label.replace(/\s+/g, "-").toLowerCase()}`);
</script>

<div class={cn("space-y-2", className)}>
  {#if label}
    <Label for={id}>
      {label}
      {#if required}<span class="text-red-500 ml-0.5">*</span>{/if}
    </Label>
  {/if}
  {#if hint}
    <p class="text-xs text-slate-400">{hint}</p>
  {/if}
  {#if type === "textarea"}
    <Textarea
      {id}
      value={typeof value === "string" ? value : ""}
      {placeholder}
      {required}
      {disabled}
      {oninput}
      {onchange}
      {onblur}
    />
  {:else}
    <Input
      {id}
      {type}
      value={typeof value === "string" || typeof value === "number" ? value : ""}
      {placeholder}
      {required}
      {disabled}
      {oninput}
      {onchange}
      {onblur}
    />
  {/if}
  {#if error}
    <p class="text-sm text-red-600">{error}</p>
  {/if}
</div>
