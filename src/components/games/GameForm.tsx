import { createSignal, onMount, Show } from 'solid-js';
import { invoke } from '@tauri-apps/api/core';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Button } from '../../components/ui/button';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { TagsSelect, type TagOption } from '../../components/ui/tags-select';

interface CreateGameDto {
  title: string;
  node_type: string;
  parent_id: number | null;
  series_id: number | null;
  original_title: string | null;
  description: string | null;
  year_published: number | null;
  min_players: number | null;
  max_players: number | null;
  min_age: number | null;
  play_time_min: number | null;
  play_time_max: number | null;
  difficulty: number | null;
  status: string;
  genre_ids: number[];
  author_ids: number[];
  publisher_ids: number[];
}

interface GameFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (dto: CreateGameDto) => void;
}

const defaultDto: CreateGameDto = {
  title: '',
  node_type: 'game',
  parent_id: null,
  series_id: null,
  original_title: null,
  description: null,
  year_published: null,
  min_players: null,
  max_players: null,
  min_age: null,
  play_time_min: null,
  play_time_max: null,
  difficulty: null,
  status: 'owned',
  genre_ids: [],
  author_ids: [],
  publisher_ids: [],
};

const typeOptions = [
  { value: 'game', label: 'Игра' },
  { value: 'expansion', label: 'Дополнение' },
  { value: 'promo', label: 'Промо' },
];

const statusOptions = [
  { value: 'owned', label: 'В коллекции' },
  { value: 'wishlist', label: 'Хочу купить' },
  { value: 'preorder', label: 'Предзаказ' },
  { value: 'sold', label: 'Продан' },
];

export function GameForm(props: GameFormProps) {
  const [title, setTitle] = createSignal('');
  const [nodeType, setNodeType] = createSignal('game');
  const [status, setStatus] = createSignal('owned');
  const [genres, setGenres] = createSignal<TagOption[]>([]);
  const [selectedGenreIds, setSelectedGenreIds] = createSignal<number[]>([]);

  onMount(async () => {
    try {
      const loadedGenres = await invoke<{ id: number; name: string }[]>('get_genres');
      setGenres(loadedGenres.map(g => ({ id: g.id, name: g.name })));
    } catch (e) {
      console.error('Failed to load genres:', e);
    }
  });

  const handleCreateGenre = async (name: string) => {
    const result = await invoke<{ id: number; name: string }>('create_genre', { dto: { name } });
    setGenres([...genres(), { id: result.id, name: result.name }]);
    return { id: result.id, name: result.name };
  };
  
  const handleSubmit = () => {
    if (!title().trim()) return;
    
    props.onSubmit({
      ...defaultDto,
      title: title(),
      node_type: nodeType(),
      status: status(),
      genre_ids: selectedGenreIds(),
    });
    
    setTitle('');
    setNodeType('game');
    setStatus('owned');
    setSelectedGenreIds([]);
    props.onOpenChange(false);
  };
  
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogHeader>
        <DialogTitle>Добавить игру</DialogTitle>
        <DialogDescription>
          Заполните форму для добавления новой игры в коллекцию.
        </DialogDescription>
      </DialogHeader>
      
      <div class="flex flex-col gap-4">
        <div>
          <label class="text-sm text-muted-foreground mb-1 block">Название *</label>
          <Input
            placeholder="Название игры"
            value={title()}
            onInput={(e) => setTitle(e.currentTarget.value)}
          />
        </div>
        
        <div>
          <label class="text-sm text-muted-foreground mb-1 block">Тип</label>
          <Select
            value={nodeType()}
            onChange={(e) => setNodeType(e.currentTarget.value)}
            options={typeOptions}
          />
        </div>
        
<div>
          <label class="text-sm text-muted-foreground mb-1 block">Статус</label>
          <Select
            value={status()}
            onChange={(e) => setStatus(e.currentTarget.value)}
            options={statusOptions}
          />
        </div>

        <TagsSelect
          label="Жанры"
          selectedIds={selectedGenreIds()}
          availableTags={genres()}
          onChange={setSelectedGenreIds}
          onCreateTag={handleCreateGenre}
        />
      </div>
      
      <DialogFooter>
        <Button variant="secondary" onClick={() => props.onOpenChange(false)}>
          Отмена
        </Button>
        <Button onClick={handleSubmit} disabled={!title().trim()}>
          Добавить
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

export type { GameFormProps, CreateGameDto };