import { createSignal, For, Show } from 'solid-js';
import { A } from '@solidjs/router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';

interface ManagerProps {
  title: string;
  items: { id: number; name: string; extra?: string }[];
  onAdd: (name: string, extra?: string) => void;
  onEdit: (id: number, name: string, extra?: string) => void;
  onDelete: (id: number) => void;
  extraLabel?: string;
}

function EntityManager(props: ManagerProps) {
  const [newName, setNewName] = createSignal('');
  const [newExtra, setNewExtra] = createSignal('');
  const [editingId, setEditingId] = createSignal<number | null>(null);
  const [editName, setEditName] = createSignal('');
  const [editExtra, setEditExtra] = createSignal('');

  const handleAdd = () => {
    if (!newName().trim()) return;
    props.onAdd(newName(), newExtra() || undefined);
    setNewName('');
    setNewExtra('');
  };

  const handleEdit = (id: number) => {
    const item = props.items.find(i => i.id === id);
    if (!item) return;
    setEditingId(id);
    setEditName(item.name);
    setEditExtra(item.extra || '');
  };

  const handleSaveEdit = () => {
    if (!editName().trim() || editingId() === null) return;
    props.onEdit(editingId()!, editName(), editExtra() || undefined);
    setEditingId(null);
  };

  const handleDelete = (id: number) => {
    if (confirm('Удалить?')) {
      props.onDelete(id);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{props.title}</CardTitle>
      </CardHeader>
      <CardContent class="flex flex-col gap-4">
        <div class="flex gap-2">
          <Input
            placeholder={`Название ${props.title.toLowerCase()}`}
            value={newName()}
            onInput={(e) => setNewName(e.currentTarget.value)}
            class="flex-1"
          />
          <Show when={props.extraLabel}>
            <Input
              placeholder={props.extraLabel}
              value={newExtra()}
              onInput={(e) => setNewExtra(e.currentTarget.value)}
              class="w-40"
            />
          </Show>
          <Button onClick={handleAdd}>Добавить</Button>
        </div>

        <table class="w-full text-sm">
          <thead>
            <tr class="border-b">
              <th class="text-left p-2">ID</th>
              <th class="text-left p-2">Название</th>
              <Show when={props.extraLabel}>
                <th class="text-left p-2">{props.extraLabel}</th>
              </Show>
              <th class="text-right p-2">Действия</th>
            </tr>
          </thead>
          <tbody>
            <For each={props.items}>
              {(item) => (
                <tr class="border-b hover:bg-muted/50">
                  <td class="p-2 text-muted-foreground">{item.id}</td>
                  <td class="p-2">
                    <Show when={editingId() === item.id} fallback={item.name}>
                      <Input
                        value={editName()}
                        onInput={(e) => setEditName(e.currentTarget.value)}
                        class="h-8"
                      />
                    </Show>
                  </td>
                  <Show when={props.extraLabel}>
                    <td class="p-2">
                      <Show when={editingId() === item.id} fallback={item.extra || '-'}>
                        <Input
                          value={editExtra()}
                          onInput={(e) => setEditExtra(e.currentTarget.value)}
                          class="h-8"
                        />
                      </Show>
                    </td>
                  </Show>
                  <td class="p-2 text-right">
                    <Show when={editingId() === item.id}>
                      <Button size="sm" variant="secondary" onClick={handleSaveEdit} class="mr-1">
                        Сохранить
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                        Отмена
                      </Button>
                    </Show>
                    <Show when={editingId() !== item.id}>
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(item.id)}>
                        ✏️
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(item.id)}>
                        🗑️
                      </Button>
                    </Show>
                  </td>
                </tr>
              )}
            </For>
          </tbody>
        </table>

        <Show when={props.items.length === 0}>
          <p class="text-muted-foreground text-center py-4">Нет записей</p>
        </Show>
      </CardContent>
    </Card>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = createSignal<'genres' | 'publishers' | 'authors'>('genres');
  const [genres, setGenres] = createSignal<{ id: number; name: string }[]>([]);
  const [publishers, setPublishers] = createSignal<{ id: number; name: string; country?: string; website?: string }[]>([]);
  const [authors, setAuthors] = createSignal<{ id: number; name: string; bio?: string }[]>([]);

  const loadGenres = async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    try {
      const data = await invoke<{ id: number; name: string }[]>('get_genres');
      setGenres(data);
    } catch (e) { console.error(e); }
  };

  const loadPublishers = async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    try {
      const data = await invoke<{ id: number; name: string; country?: string; website?: string }[]>('get_publishers');
      setPublishers(data);
    } catch (e) { console.error(e); }
  };

  const loadAuthors = async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    try {
      const data = await import('@tauri-apps/api/core').then(m => m.invoke<{ id: number; name: string; bio?: string }[]>('get_authors'));
      setAuthors(data);
    } catch (e) { console.error(e); }
  };

  const addGenre = async (name: string) => {
    const { invoke } = await import('@tauri-apps/api/core');
    try {
      await invoke('create_genre', { dto: { name } });
      await loadGenres();
    } catch (e) { console.error(e); }
  };

  const editGenre = async (id: number, name: string) => {
    const { invoke } = await import('@tauri-apps/api/core');
    try {
      await invoke('update_genre', { id, dto: { name } });
      await loadGenres();
    } catch (e) { console.error(e); }
  };

  const deleteGenre = async (id: number) => {
    const { invoke } = await import('@tauri-apps/api/core');
    try {
      await invoke('delete_genre', { id });
      await loadGenres();
    } catch (e) { console.error(e); }
  };

  const addPublisher = async (name: string, country?: string) => {
    const { invoke } = await import('@tauri-apps/api/core');
    try {
      await invoke('create_publisher', { dto: { name, country, website: null } });
      await loadPublishers();
    } catch (e) { console.error(e); }
  };

  const editPublisher = async (id: number, name: string, country?: string) => {
    const { invoke } = await import('@tauri-apps/api/core');
    try {
      await invoke('update_publisher', { id, dto: { name, country, website: null } });
      await loadPublishers();
    } catch (e) { console.error(e); }
  };

  const deletePublisher = async (id: number) => {
    const { invoke } = await import('@tauri-apps/api/core');
    try {
      await invoke('delete_publisher', { id });
      await loadPublishers();
    } catch (e) { console.error(e); }
  };

  const addAuthor = async (name: string, bio?: string) => {
    const { invoke } = await import('@tauri-apps/api/core');
    try {
      await invoke('create_author', { dto: { name, bio } });
      await loadAuthors();
    } catch (e) { console.error(e); }
  };

  const editAuthor = async (id: number, name: string, bio?: string) => {
    const { invoke } = await import('@tauri-apps/api/core');
    try {
      await invoke('update_author', { id, dto: { name, bio } });
      await loadAuthors();
    } catch (e) { console.error(e); }
  };

  const deleteAuthor = async (id: number) => {
    const { invoke } = await import('@tauri-apps/api/core');
    try {
      await invoke('delete_author', { id });
      await loadAuthors();
    } catch (e) { console.error(e); }
  };

  const init = async () => {
    await loadGenres();
    await loadPublishers();
    await loadAuthors();
  };

  init();

  return (
    <div class="p-6 max-w-4xl mx-auto">
      <div class="flex items-center gap-4 mb-6">
        <A href="/">
          <Button variant="ghost">← Назад</Button>
        </A>
        <h1 class="text-2xl font-bold">Настройки</h1>
      </div>

      <div class="flex gap-2 mb-6">
        <Button
          variant={activeTab() === 'genres' ? 'default' : 'secondary'}
          onClick={() => setActiveTab('genres')}
        >
          Жанры
        </Button>
        <Button
          variant={activeTab() === 'publishers' ? 'default' : 'secondary'}
          onClick={() => setActiveTab('publishers')}
        >
          Издатели
        </Button>
        <Button
          variant={activeTab() === 'authors' ? 'default' : 'secondary'}
          onClick={() => setActiveTab('authors')}
        >
          Авторы
        </Button>
      </div>

      <Show when={activeTab() === 'genres'}>
        <EntityManager
          title="Жанры"
          items={genres()}
          onAdd={addGenre}
          onEdit={editGenre}
          onDelete={deleteGenre}
        />
      </Show>

      <Show when={activeTab() === 'publishers'}>
        <EntityManager
          title="Издатели"
          items={publishers().map(p => ({ id: p.id, name: p.name, extra: p.country }))}
          onAdd={addPublisher}
          onEdit={editPublisher}
          onDelete={deletePublisher}
          extraLabel="Страна"
        />
      </Show>

      <Show when={activeTab() === 'authors'}>
        <EntityManager
          title="Авторы"
          items={authors().map(a => ({ id: a.id, name: a.name, extra: a.bio }))}
          onAdd={addAuthor}
          onEdit={editAuthor}
          onDelete={deleteAuthor}
          extraLabel="Биография"
        />
      </Show>
    </div>
  );
}