import { For, Show, createSignal, JSX } from 'solid-js';
import { cn } from '../../lib/utils';

export interface GameNode {
  id: number;
  title: string;
  node_type: 'game' | 'expansion' | 'promo';
  cover_image: string | null;
  has_children: boolean;
  sort_order: number;
  children: GameNode[];
}

interface GameTreeProps {
  games: GameNode[];
  selectedId?: number;
  onSelect?: (game: GameNode) => void;
  onToggle?: (id: number) => void;
  expandedIds?: Set<number>;
}

function getNodeIcon(type: string): string {
  switch (type) {
    case 'expansion': return '📦';
    case 'promo': return '🎁';
    default: return '🎲';
  }
}

interface TreeItemProps {
  game: GameNode;
  level: number;
  selectedId?: number;
  onSelect?: (game: GameNode) => void;
  onToggle?: (id: number) => void;
  expandedIds?: Set<number>;
}

function TreeItem(props: TreeItemProps) {
  const isExpanded = () => props.expandedIds?.has(props.game.id) || false;
  const isSelected = () => props.selectedId === props.game.id;
  
  const handleClick = () => {
    if (props.game.has_children && props.onToggle) {
      props.onToggle(props.game.id);
    }
    if (props.onSelect) {
      props.onSelect(props.game);
    }
  };
  
  return (
    <div class="flex flex-col">
      <div
        onClick={handleClick}
        class={cn(
          'flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors',
          'hover:bg-accent/10',
          isSelected() && 'bg-primary text-primary-foreground'
        )}
        style={{ 'padding-left': `${props.level * 16 + 12}px` }}
      >
        <Show when={props.game.has_children}>
          <span 
            class={cn(
              'w-4 text-xs transition-transform',
              isExpanded() ? 'rotate-90' : ''
            )}
          >
            ▶
          </span>
        </Show>
        <Show when={!props.game.has_children}>
          <span class="w-4" />
        </Show>
        <span>{getNodeIcon(props.game.node_type)}</span>
        <span class="truncate">{props.game.title}</span>
      </div>
      
      <Show when={props.game.has_children && isExpanded()}>
        <For each={props.game.children}>
          {(child) => (
            <TreeItem
              game={child}
              level={props.level + 1}
              selectedId={props.selectedId}
              onSelect={props.onSelect}
              onToggle={props.onToggle}
              expandedIds={props.expandedIds}
            />
          )}
        </For>
      </Show>
    </div>
  );
}

export function GameTree(props: GameTreeProps) {
  return (
    <div class="flex flex-col">
      <For each={props.games}>
        {(game) => (
          <TreeItem
            game={game}
            level={0}
            selectedId={props.selectedId}
            onSelect={props.onSelect}
            onToggle={props.onToggle}
            expandedIds={props.expandedIds}
          />
        )}
      </For>
    </div>
  );
}

export function SearchResults(props: { 
  games: GameNode[]; 
  selectedId?: number; 
  onSelect?: (game: GameNode) => void;
}) {
  return (
    <div class="flex flex-col gap-1">
      <For each={props.games}>
        {(game) => (
          <div
            onClick={() => props.onSelect?.(game)}
            class={cn(
              'flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors',
              'hover:bg-accent/10',
              props.selectedId === game.id && 'bg-primary text-primary-foreground'
            )}
          >
            <span>{getNodeIcon(game.node_type)}</span>
            <span class="truncate">{game.title}</span>
          </div>
        )}
      </For>
    </div>
  );
}

export type { GameTreeProps };