import { createSignal, onMount, Show, For } from 'solid-js';
import { useParams, useNavigate, A } from '@solidjs/router';
import { invoke } from '@tauri-apps/api/core';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card';
import { TagsSelect, type TagOption } from '../components/ui/tags-select';

interface GameData {
  id: number;
  title: string;
  original_title: string | null;
  description: string | null;
  node_type: string;
  status: string;
  year_published: number | null;
  min_players: number | null;
  max_players: number | null;
  min_age: number | null;
  play_time_min: number | null;
  play_time_max: number | null;
  difficulty: number | null;
  genre_ids: number[];
  author_ids: number[];
  publisher_ids: number[];
}

interface GameFormProps {
  gameId?: number;
}

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

export default function EditGame() {
  const params = useParams();
  const navigate = useNavigate();
  const gameId = () => params.id ? parseInt(params.id) : null;

  const [title, setTitle] = createSignal('');
  const [originalTitle, setOriginalTitle] = createSignal('');
  const [description, setDescription] = createSignal('');
  const [nodeType, setNodeType] = createSignal('game');
  const [status, setStatus] = createSignal('owned');
  const [yearPublished, setYearPublished] = createSignal<number | null>(null);
  const [minPlayers, setMinPlayers] = createSignal<number | null>(null);
  const [maxPlayers, setMaxPlayers] = createSignal<number | null>(null);
  const [minAge, setMinAge] = createSignal<number | null>(null);
  const [playTimeMin, setPlayTimeMin] = createSignal<number | null>(null);
  const [playTimeMax, setPlayTimeMax] = createSignal<number | null>(null);
  const [difficulty, setDifficulty] = createSignal<number | null>(null);

  const [genres, setGenres] = createSignal<TagOption[]>([]);
  const [authors, setAuthors] = createSignal<TagOption[]>([]);
  const [publishers, setPublishers] = createSignal<TagOption[]>([]);
  const [selectedGenreIds, setSelectedGenreIds] = createSignal<number[]>([]);
  const [selectedAuthorIds, setSelectedAuthorIds] = createSignal<number[]>([]);
  const [selectedPublisherIds, setSelectedPublisherIds] = createSignal<number[]>([]);

  const [loading, setLoading] = createSignal(true);

  onMount(async () => {
    try {
      const [genresData, authorsData, publishersData] = await Promise.all([
        invoke<{ id: number; name: string }[]>('get_genres'),
        invoke<{ id: number; name: string }[]>('get_authors'),
        invoke<{ id: number; name: string }[]>('get_publishers'),
      ]);

      setGenres(genresData.map(g => ({ id: g.id, name: g.name })));
      setAuthors(authorsData.map(a => ({ id: a.id, name: a.name })));
      setPublishers(publishersData.map(p => ({ id: p.id, name: p.name })));

      if (gameId()) {
        const games = await invoke<any[]>('search_games', { query: '', limit: 1000 });
        const game = games.find((g: any) => g.id === gameId());
        if (game) {
          setTitle(game.title);
          setOriginalTitle(game.original_title || '');
          setDescription(game.description || '');
          setNodeType(game.node_type);
          setStatus(game.status);
          setYearPublished(game.year_published);
          setMinPlayers(game.min_players);
          setMaxPlayers(game.max_players);
          setMinAge(game.min_age);
          setPlayTimeMin(game.play_time_min);
          setPlayTimeMax(game.play_time_max);
          setDifficulty(game.difficulty);

          const gameDetails = await invoke<any>('get_game_details', { id: gameId() });
          if (gameDetails) {
            setSelectedGenreIds(gameDetails.genre_ids || []);
            setSelectedAuthorIds(gameDetails.author_ids || []);
            setSelectedPublisherIds(gameDetails.publisher_ids || []);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      setLoading(false);
    }
  });

  const handleSubmit = async () => {
    if (!title().trim()) return;

    try {
      const dto = {
        title: title(),
        original_title: originalTitle() || null,
        description: description() || null,
        node_type: nodeType(),
        status: status(),
        year_published: yearPublished(),
        min_players: minPlayers(),
        max_players: maxPlayers(),
        min_age: minAge(),
        play_time_min: playTimeMin(),
        play_time_max: playTimeMax(),
        difficulty: difficulty(),
        genre_ids: selectedGenreIds(),
        author_ids: selectedAuthorIds(),
        publisher_ids: selectedPublisherIds(),
        parent_id: null,
        series_id: null,
      };

      if (gameId()) {
        await invoke('update_game', { id: gameId(), dto });
      } else {
        await invoke('create_game', { dto });
      }

      navigate('/');
    } catch (e) {
      console.error('Failed to save game:', e);
    }
  };

  const handleCreateGenre = async (name: string) => {
    const result = await invoke<{ id: number; name: string }>('create_genre', { dto: { name } });
    setGenres([...genres(), { id: result.id, name: result.name }]);
    return { id: result.id, name: result.name };
  };

  const handleCreateAuthor = async (name: string) => {
    const result = await invoke<{ id: number; name: string }>('create_author', { dto: { name, bio: null } });
    setAuthors([...authors(), { id: result.id, name: result.name }]);
    return { id: result.id, name: result.name };
  };

  const handleCreatePublisher = async (name: string) => {
    const result = await invoke<{ id: number; name: string }>('create_publisher', { dto: { name, country: null, website: null } });
    setPublishers([...publishers(), { id: result.id, name: result.name }]);
    return { id: result.id, name: result.name };
  };

  return (
    <div class="p-6 max-w-3xl mx-auto">
      <div class="flex items-center gap-4 mb-6">
        <A href="/">
          <Button variant="ghost">← Назад</Button>
        </A>
        <h1 class="text-2xl font-bold">
          {gameId() ? 'Редактирование игры' : 'Добавление игры'}
        </h1>
      </div>

      <Show when={loading()}>
        <p class="text-center text-muted-foreground">Загрузка...</p>
      </Show>

      <Show when={!loading()}>
        <Card>
          <CardHeader>
            <CardTitle>Основная информация</CardTitle>
          </CardHeader>
          <CardContent class="flex flex-col gap-4">
            <div>
              <label class="text-sm text-muted-foreground mb-1 block">Название *</label>
              <Input
                placeholder="Название игры"
                value={title()}
                onInput={(e) => setTitle(e.currentTarget.value)}
              />
            </div>

            <div>
              <label class="text-sm text-muted-foreground mb-1 block">Оригинальное название</label>
              <Input
                placeholder="Original title"
                value={originalTitle()}
                onInput={(e) => setOriginalTitle(e.currentTarget.value)}
              />
            </div>

            <div>
              <label class="text-sm text-muted-foreground mb-1 block">Описание</label>
              <textarea
                class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Описание игры"
                value={description()}
                onInput={(e) => setDescription(e.currentTarget.value)}
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
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
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-sm text-muted-foreground mb-1 block">Год издания</label>
                <Input
                  type="number"
                  placeholder="2024"
                  value={yearPublished() || ''}
                  onInput={(e) => setYearPublished(e.currentTarget.value ? parseInt(e.currentTarget.value) : null)}
                />
              </div>

              <div>
                <label class="text-sm text-muted-foreground mb-1 block">Сложность (1-5)</label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  step="0.5"
                  placeholder="3"
                  value={difficulty() || ''}
                  onInput={(e) => setDifficulty(e.currentTarget.value ? parseFloat(e.currentTarget.value) : null)}
                />
              </div>
            </div>

            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="text-sm text-muted-foreground mb-1 block">Мин. игроков</label>
                <Input
                  type="number"
                  placeholder="2"
                  value={minPlayers() || ''}
                  onInput={(e) => setMinPlayers(e.currentTarget.value ? parseInt(e.currentTarget.value) : null)}
                />
              </div>

              <div>
                <label class="text-sm text-muted-foreground mb-1 block">Макс. игроков</label>
                <Input
                  type="number"
                  placeholder="4"
                  value={maxPlayers() || ''}
                  onInput={(e) => setMaxPlayers(e.currentTarget.value ? parseInt(e.currentTarget.value) : null)}
                />
              </div>

              <div>
                <label class="text-sm text-muted-foreground mb-1 block">Мин. возраст</label>
                <Input
                  type="number"
                  placeholder="8"
                  value={minAge() || ''}
                  onInput={(e) => setMinAge(e.currentTarget.value ? parseInt(e.currentTarget.value) : null)}
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-sm text-muted-foreground mb-1 block">Время игры (мин)</label>
                <Input
                  placeholder="30-60"
                  value={playTimeMin() ? `${playTimeMin()}${playTimeMax() ? '-' + playTimeMax() : ''}` : ''}
                  onInput={(e) => {
                    const val = e.currentTarget.value;
                    if (val.includes('-')) {
                      const [min, max] = val.split('-').map(v => parseInt(v) || null);
                      setPlayTimeMin(min);
                      setPlayTimeMax(max);
                    } else {
                      setPlayTimeMin(parseInt(val) || null);
                    }
                  }}
                />
              </div>
            </div>

            <TagsSelect
              label="Жанры"
              selectedIds={selectedGenreIds()}
              availableTags={genres()}
              onChange={setSelectedGenreIds}
              onCreateTag={handleCreateGenre}
            />

            <TagsSelect
              label="Авторы"
              selectedIds={selectedAuthorIds()}
              availableTags={authors()}
              onChange={setSelectedAuthorIds}
              onCreateTag={handleCreateAuthor}
              placeholder="Имя автора"
              createButtonLabel="+ Новый автор"
            />

            <TagsSelect
              label="Издатели"
              selectedIds={selectedPublisherIds()}
              availableTags={publishers()}
              onChange={setSelectedPublisherIds}
              onCreateTag={handleCreatePublisher}
              placeholder="Название издательства"
              createButtonLabel="+ Новый издатель"
            />
          </CardContent>
          <CardFooter class="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => navigate('/')}>
              Отмена
            </Button>
            <Button onClick={handleSubmit} disabled={!title().trim()}>
              Сохранить
            </Button>
          </CardFooter>
        </Card>
      </Show>
    </div>
  );
}