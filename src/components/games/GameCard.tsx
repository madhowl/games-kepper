import { Show } from 'solid-js';
import { A } from '@solidjs/router';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../ui/button';
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

interface GameCardProps {
  game: GameNode;
  onDelete?: (id: number) => void;
  class?: string;
}

function getNodeIcon(type: string): string {
  switch (type) {
    case 'expansion': return '📦';
    case 'promo': return '🎁';
    default: return '🎲';
  }
}

export function GameCard(props: GameCardProps) {
  return (
    <Card class={cn('w-full', props.class)}>
      <CardHeader>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-2xl">{getNodeIcon(props.game.node_type)}</span>
            <CardTitle>{props.game.title}</CardTitle>
          </div>
          <Show when={props.game.has_children}>
            <Badge variant="secondary">
              📂 {props.game.children.length}
            </Badge>
          </Show>
        </div>
      </CardHeader>
      
      <Show when={props.game.cover_image}>
        <CardContent>
          <div class="w-full h-48 bg-muted rounded-md flex items-center justify-center">
            <span class="text-muted-foreground">Обложка</span>
          </div>
        </CardContent>
      </Show>
      
      <CardFooter>
        <div class="flex justify-end w-full gap-2">
          <A href={`/game/${props.game.id}/components`}>
            <Button variant="outline" size="sm">
              📦 Компоненты
            </Button>
          </A>
          <A href={`/game/${props.game.id}/edit`}>
            <Button variant="secondary" size="sm">
              ✏️ Редактировать
            </Button>
          </A>
          <Show when={props.onDelete}>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => props.onDelete?.(props.game.id)}
            >
              Удалить
            </Button>
          </Show>
        </div>
      </CardFooter>
    </Card>
  );
}

export type { GameCardProps };