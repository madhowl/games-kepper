import { createSignal, onMount, For, Show, createMemo } from 'solid-js';
import { useParams, A } from '@solidjs/router';
import { invoke } from '@tauri-apps/api/core';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogContent } from '../components/ui/dialog';
import { Select } from '../components/ui/select';
import { CardConstructor } from '../components/editor/CardConstructor';
import type { ComponentType, GameComponent, CreateGameComponentDto, BASE_TYPE_LABELS, BASE_TYPE_ICONS } from '../types/components';

export default function EditComponents() {
  const params = useParams();
  const gameId = () => params.id ? parseInt(params.id) : null;

  const [componentTypes, setComponentTypes] = createSignal<ComponentType[]>([]);
  const [gameComponents, setGameComponents] = createSignal<GameComponent[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [selectedTypeId, setSelectedTypeId] = createSignal<number | null>(null);
  const [showAddModal, setShowAddModal] = createSignal(false);
  const [showEditModal, setShowEditModal] = createSignal(false);
  const [editingComponent, setEditingComponent] = createSignal<GameComponent | null>(null);
  const [showConstructor, setShowConstructor] = createSignal(false);

  // Form state
  const [formName, setFormName] = createSignal('');
  const [formTypeId, setFormTypeId] = createSignal<number | null>(null);
  const [formQuantity, setFormQuantity] = createSignal(1);
  const [formNotes, setFormNotes] = createSignal('');

  const loadData = async () => {
    if (!gameId()) return;
    try {
      const [types, components] = await Promise.all([
        invoke<ComponentType[]>('get_component_types'),
        invoke<GameComponent[]>('get_game_components', { gameId: gameId() })
      ]);
      setComponentTypes(types);
      setGameComponents(components);
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      setLoading(false);
    }
  };

  onMount(loadData);

  const filteredComponents = createMemo(() => {
    const typeId = selectedTypeId();
    if (!typeId) return gameComponents();
    return gameComponents().filter(c => c.component_type_id === typeId);
  });

  const getTypeById = (id: number) => componentTypes().find(t => t.id === id);

  const openAddModal = () => {
    setFormName('');
    setFormTypeId(null);
    setFormQuantity(1);
    setFormNotes('');
    setShowAddModal(true);
  };

  const openEditModal = (comp: GameComponent) => {
    setEditingComponent(comp);
    setFormName(comp.name);
    setFormTypeId(comp.component_type_id);
    setFormQuantity(comp.quantity);
    setFormNotes(comp.notes || '');
    setShowEditModal(true);
  };

  const handleAdd = async () => {
    if (!formName() || !formTypeId() || !gameId()) return;
    try {
      await invoke('create_game_component', {
        dto: {
          game_id: gameId(),
          component_type_id: formTypeId(),
          name: formName(),
          quantity: formQuantity(),
          notes: formNotes() || null,
        }
      });
      await loadData();
      setShowAddModal(false);
    } catch (e) {
      console.error('Failed to create component:', e);
    }
  };

  const handleEdit = async () => {
    const comp = editingComponent();
    if (!comp || !formName()) return;
    try {
      await invoke('update_game_component', {
        id: comp.id,
        dto: {
          name: formName(),
          quantity: formQuantity(),
          notes: formNotes() || null,
        }
      });
      await loadData();
      setShowEditModal(false);
      setEditingComponent(null);
    } catch (e) {
      console.error('Failed to update component:', e);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить компонент?')) return;
    try {
      await invoke('delete_game_component', { id });
      await loadData();
    } catch (e) {
      console.error('Failed to delete component:', e);
    }
  };

  const typeOptions = componentTypes().map(t => ({
    value: t.id.toString(),
    label: `${t.icon || ''} ${t.name}`
  }));

  const typeFilterOptions = [
    { value: '', label: 'Все типы' },
    ...typeOptions
  ];

  return (
    <div class="p-6">
      <div class="flex items-center gap-4 mb-6">
        <A href={`/game/${gameId()}/edit`}>
          <Button variant="ghost">← Назад к игре</Button>
        </A>
        <h1 class="text-2xl font-bold">Компоненты игры</h1>
      </div>

      <Show when={loading()}>
        <p class="text-center text-muted-foreground">Загрузка...</p>
      </Show>

      <Show when={!loading()}>
        <div class="flex gap-4 mb-6">
          <Select
            value={selectedTypeId()?.toString() || ''}
            onChange={(e) => setSelectedTypeId(e.currentTarget.value ? parseInt(e.currentTarget.value) : null)}
            options={typeFilterOptions}
            class="w-48"
          />
          <Button onClick={openAddModal}>+ Добавить компонент</Button>
          <Button variant="outline" onClick={() => setShowConstructor(true)}>🎨 Конструктор</Button>
        </div>

        <Show when={filteredComponents().length === 0}>
          <Card>
            <CardContent class="py-8 text-center text-muted-foreground">
              Нет компонентов. Добавьте первый компонент!
            </CardContent>
          </Card>
        </Show>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <For each={filteredComponents()}>
            {(comp) => {
              const type = getTypeById(comp.component_type_id);
              return (
                <Card>
                  <CardHeader class="pb-2">
                    <div class="flex items-center gap-2">
                      <span class="text-2xl">{type?.icon || '📦'}</span>
                      <CardTitle class="text-base">{comp.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div class="text-sm text-muted-foreground mb-2">
                      <p>Тип: {type?.name || 'Unknown'}</p>
                      <p>Количество: {comp.quantity}</p>
                      <Show when={comp.notes}>
                        <p class="truncate">{comp.notes}</p>
                      </Show>
                    </div>
                    <div class="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => openEditModal(comp)}>
                        ✏️
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(comp.id)}>
                        🗑️
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            }}
          </For>
        </div>
      </Show>

      {/* Add Modal */}
      <Dialog open={showAddModal()} onOpenChange={setShowAddModal}>
        <DialogHeader>
          <DialogTitle>Добавить компонент</DialogTitle>
          <DialogDescription>Создайте новый компонент для игры</DialogDescription>
        </DialogHeader>
        <div class="flex flex-col gap-4 py-4">
          <div>
            <label class="text-sm text-muted-foreground mb-1 block">Название *</label>
            <Input
              placeholder="Название компонента"
              value={formName()}
              onInput={(e) => setFormName(e.currentTarget.value)}
            />
          </div>
          <div>
            <label class="text-sm text-muted-foreground mb-1 block">Тип компонента *</label>
            <Select
              value={formTypeId()?.toString() || ''}
              onChange={(e) => setFormTypeId(e.currentTarget.value ? parseInt(e.currentTarget.value) : null)}
              options={typeOptions}
            />
          </div>
          <div>
            <label class="text-sm text-muted-foreground mb-1 block">Количество</label>
            <Input
              type="number"
              min="1"
              value={formQuantity()}
              onInput={(e) => setFormQuantity(parseInt(e.currentTarget.value) || 1)}
            />
          </div>
          <div>
            <label class="text-sm text-muted-foreground mb-1 block">Заметки</label>
            <Input
              placeholder="Дополнительные заметки"
              value={formNotes()}
              onInput={(e) => setFormNotes(e.currentTarget.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>Отмена</Button>
          <Button onClick={handleAdd} disabled={!formName() || !formTypeId()}>Добавить</Button>
        </DialogFooter>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal()} onOpenChange={setShowEditModal}>
        <DialogHeader>
          <DialogTitle>Редактировать компонент</DialogTitle>
        </DialogHeader>
        <div class="flex flex-col gap-4 py-4">
          <div>
            <label class="text-sm text-muted-foreground mb-1 block">Название *</label>
            <Input
              value={formName()}
              onInput={(e) => setFormName(e.currentTarget.value)}
            />
          </div>
          <div>
            <label class="text-sm text-muted-foreground mb-1 block">Количество</label>
            <Input
              type="number"
              min="1"
              value={formQuantity()}
              onInput={(e) => setFormQuantity(parseInt(e.currentTarget.value) || 1)}
            />
          </div>
          <div>
            <label class="text-sm text-muted-foreground mb-1 block">Заметки</label>
            <Input
              value={formNotes()}
              onInput={(e) => setFormNotes(e.currentTarget.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>Отмена</Button>
          <Button onClick={handleEdit} disabled={!formName()}>Сохранить</Button>
        </DialogFooter>
      </Dialog>

      <CardConstructor
        open={showConstructor()}
        onOpenChange={setShowConstructor}
      />
    </div>
  );
}