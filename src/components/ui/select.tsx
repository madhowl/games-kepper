import { For, Show, JSX, splitProps } from 'solid-js';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends JSX.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  placeholder?: string;
}

function Select(props: SelectProps) {
  const [local, rest] = splitProps(props, ['class', 'options', 'placeholder', 'value', 'onChange']);
  
  return (
    <select
      class={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${local.class || ''}`}
      {...rest}
    >
      <Show when={local.placeholder}>
        <option value="" disabled selected>
          {local.placeholder}
        </option>
      </Show>
      <For each={local.options}>
        {(option) => (
          <option value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        )}
      </For>
    </select>
  );
}

export { Select };
export type { SelectProps, SelectOption };