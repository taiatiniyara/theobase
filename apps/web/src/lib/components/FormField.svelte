<script lang="ts">
  interface Props {
    label: string;
    type?: string;
    value?: string | number;
    hint?: string;
    error?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    oninput?: (e: Event) => void;
    onchange?: (e: Event) => void;
    onblur?: (e: Event) => void;
  }

  let {
    label,
    type = 'text',
    value = '',
    hint = '',
    error = '',
    placeholder = '',
    required = false,
    disabled = false,
    oninput = undefined,
    onchange = undefined,
    onblur = undefined,
  }: Props = $props();
</script>

<div class="field">
  <label class="label" for="field-{label.replace(/\s+/g, '-').toLowerCase()}">
    {label}
    {#if required}<span class="required">*</span>{/if}
  </label>
  {#if hint}<p class="hint">{hint}</p>{/if}
  {#if type === 'textarea'}
    <textarea id="field-{label.replace(/\s+/g, '-').toLowerCase()}" class="input" value={typeof value === 'string' ? value : ''} {placeholder} {required} {disabled} {oninput} {onchange} {onblur}></textarea>
  {:else}
    <input id="field-{label.replace(/\s+/g, '-').toLowerCase()}" class="input" {type} value={typeof value === 'string' || typeof value === 'number' ? value : ''} {placeholder} {required} {disabled} {oninput} {onchange} {onblur} />
  {/if}
  {#if error}<p class="error">{error}</p>{/if}
</div>

<style>
  .field { margin-bottom: 12px; }
  .label {
    display: block;
    font-size: 0.75rem;
    color: #4a5568;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
    font-weight: 600;
  }
  .required { color: #e53e3e; margin-left: 2px; }
  .hint {
    font-size: 0.75rem;
    color: #a0aec0;
    margin: 0 0 4px 0;
  }
  .input {
    display: block;
    width: 100%;
    padding: 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1rem;
    box-sizing: border-box;
    font-family: system-ui, -apple-system, sans-serif;
  }
  .input:focus {
    outline: none;
    border-color: #1a365d;
    box-shadow: 0 0 0 3px rgba(26, 54, 93, 0.1);
  }
  .error {
    color: #e53e3e;
    font-size: 0.8rem;
    margin: 4px 0 0 0;
  }
</style>
