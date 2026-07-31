<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';

  interface Props extends HTMLInputAttributes {
    type: 'date' | 'datetime-local';
    value?: string;
    min?: string;
    max?: string;
    class?: string;
    id?: string;
    name?: string;
    placeholder?: string;
    autofocus?: boolean;
    onkeydown?: (e: KeyboardEvent) => void;
  }

  let { type, value = $bindable(), max = undefined, onkeydown, ...rest }: Props = $props();

  let fallbackMax = $derived(type === 'date' ? '9999-12-31' : '9999-12-31T23:59');

  // Hold intermediate typed value; only commit to parent on blur or Enter
  // to avoid resetting the date when the browser clears a segment mid-edit.
  let updatedValue = $state(value ?? '');
  let focused = $state(false);

  $effect(() => {
    // Sync inbound prop changes (e.g. parent resets the date) only when
    // the input is not focused, so in-progress edits are not overwritten.
    if (!focused) {
      updatedValue = value ?? '';
    }
  });
</script>

<input
  {...rest}
  {type}
  value={updatedValue}
  max={max || fallbackMax}
  onfocus={() => (focused = true)}
  oninput={(e) => (updatedValue = e.currentTarget.value)}
  onblur={() => {
    focused = false;
    value = updatedValue;
  }}
  onkeydown={(e) => {
    if (e.key === 'Enter') {
      value = updatedValue;
    }
    onkeydown?.(e);
  }}
  step=".001"
/>
