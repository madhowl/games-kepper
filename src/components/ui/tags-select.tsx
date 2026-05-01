import { For, createSignal, Show } from 'solid-js';
import { Input } from './input';
import { Button } from './button';

interface TagOption {
  id: number;
  name: string;
}

interface TagsSelectProps {
  selectedIds: number[];
  availableTags: TagOption[];
  onChange: (ids: number[]) => void;
  onCreateTag: (name: string) => Promise<TagOption>;
  placeholder?: string;
  label?: string;
  createButtonLabel?: string;
}

export function TagsSelect(props: TagsSelectProps) {
  const [showInput, setShowInput] = createSignal(false);
  const [newTagName, setNewTagName] = createSignal('');

  const selectedTags = () => props.availableTags.filter(t => props.selectedIds.includes(t.id));
  const availableToAdd = () => props.availableTags.filter(t => !props.selectedIds.includes(t.id));

  const handleAddTag = (id: number) => {
    props.onChange([...props.selectedIds, id]);
  };

  const handleRemoveTag = (id: number) => {
    props.onChange(props.selectedIds.filter(tid => tid !== id));
  };

  const handleCreateTag = async () => {
    const name = newTagName().trim();
    if (!name) return;
    try {
      const newTag = await props.onCreateTag(name);
      props.onChange([...props.selectedIds, newTag.id]);
      setNewTagName('');
      setShowInput(false);
    } catch (e) {
      console.error('Failed to create tag:', e);
    }
  };

  return (
    <div class="flex flex-col gap-2">
      <Show when={props.label}>
        <label class="text-sm text-muted-foreground">{props.label}</label>
      </Show>
      
      <div class="flex flex-wrap gap-1 mb-2">
        <For each={selectedTags()}>
          {(tag) => (
            <span class="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground text-sm rounded">
              {tag.name}
              <button
                type="button"
                class="hover:text-destructive"
                onClick={() => handleRemoveTag(tag.id)}
              >
                ×
              </button>
            </span>
          )}
        </For>
      </div>

      <Show when={availableToAdd().length > 0}>
        <div class="flex flex-wrap gap-1">
          <For each={availableToAdd()}>
            {(tag) => (
              <button
                type="button"
                class="px-2 py-1 text-sm border rounded hover:bg-secondary"
                onClick={() => handleAddTag(tag.id)}
              >
                + {tag.name}
              </button>
            )}
          </For>
        </div>
      </Show>

      <Show when={!showInput()}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowInput(true)}
        >
          {props.createButtonLabel || '+ Новый жанр'}
        </Button>
      </Show>

      <Show when={showInput()}>
        <div class="flex gap-2">
          <Input
            placeholder={props.placeholder || 'Название жанра'}
            value={newTagName()}
            onInput={(e) => setNewTagName(e.currentTarget.value)}
            class="flex-1"
          />
          <Button size="sm" onClick={handleCreateTag}>Добавить</Button>
          <Button size="sm" variant="secondary" onClick={() => setShowInput(false)}>Отмена</Button>
        </div>
      </Show>
    </div>
  );
}

export type { TagsSelectProps, TagOption };