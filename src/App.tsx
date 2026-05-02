import { createSignal, onMount, Show, For } from 'solid-js';
import { Router, Route, A } from '@solidjs/router';
import { invoke } from '@tauri-apps/api/core';

import { Input } from './components/ui/input';
import { Button } from './components/ui/button';
import { Select } from './components/ui/select';
import { GameTree, SearchResults, type GameNode } from './components/games/GameTree';
import { GameCard } from './components/games/GameCard';
import { GameForm, type CreateGameDto } from './components/games/GameForm';
import Settings from './pages/Settings';
import EditGame from './pages/EditGame';
import EditComponents from './pages/EditComponents';

const [gamesTree, setGamesTree] = createSignal<GameNode[]>([]);
const [selectedGame, setSelectedGame] = createSignal<GameNode | null>(null);
const [expandedNodes, setExpandedNodes] = createSignal<Set<number>>(new Set());
const [searchQuery, setSearchQuery] = createSignal('');
const [searchResults, setSearchResults] = createSignal<GameNode[]>([]);
const [showAddModal, setShowAddModal] = createSignal(false);
const [genres, setGenres] = createSignal<{ id: number; name: string }[]>([]);
const [selectedGenreId, setSelectedGenreId] = createSignal<number | null>(null);

async function loadData() {
  try {
    const tree = await invoke<GameNode[]>('get_games_tree', { genreId: selectedGenreId() });
    setGamesTree(tree);
  } catch (e) {
    console.error('Failed to load data:', e);
  }
}

async function loadGenres() {
  try {
    const loadedGenres = await invoke<{ id: number; name: string }[]>('get_genres');
    setGenres(loadedGenres);
  } catch (e) {
    console.error('Failed to load genres:', e);
  }
}

function handleGenreFilter(e: Event) {
  const value = (e.target as HTMLSelectElement).value;
  setSelectedGenreId(value ? parseInt(value) : null);
  loadData();
}

async function handleCreateGame(dto: CreateGameDto) {
  try {
    await invoke('create_game', { dto });
    await loadData();
    setShowAddModal(false);
  } catch (e) {
    console.error('Failed to create game:', e);
  }
}

async function handleDeleteGame(id: number) {
  if (!confirm('Удалить игру?')) return;
  try {
    await invoke('delete_game', { id });
    await loadData();
    setSelectedGame(null);
  } catch (e) {
    console.error('Failed to delete game:', e);
  }
}

async function handleSearch() {
  if (!searchQuery()) {
    setSearchResults([]);
    return;
  }
  try {
    const results = await invoke<GameNode[]>('search_games', { query: searchQuery(), limit: 50 });
    setSearchResults(results);
  } catch (e) {
    console.error('Search failed:', e);
  }
}

function toggleNode(id: number) {
  setExpandedNodes(prev => {
    const next = new Set(prev);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    return next;
  });
}

onMount(() => {
  loadData();
  loadGenres();
});

function Home() {
  return (
    <div class="flex h-screen w-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside class="w-80 border-r border-border flex flex-col overflow-hidden">
        {/* Header */}
        <div class="p-4 border-b border-border">
          <div class="flex gap-2 mb-3">
            <Input
              placeholder="Поиск игр..."
              value={searchQuery()}
              onInput={(e) => setSearchQuery(e.currentTarget.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              class="flex-1"
            />
            <Button size="icon" variant="secondary" onClick={handleSearch}>
              🔍
            </Button>
          </div>
          <div class="flex gap-2">
            <Button class="flex-1" onClick={() => setShowAddModal(true)}>
              + Добавить игру
            </Button>
            <A href="/settings">
              <Button variant="secondary">⚙️</Button>
            </A>
          </div>
          
          <Show when={genres().length > 0}>
            <div class="mt-3">
              <Select
                value={selectedGenreId()?.toString() || ''}
                onChange={handleGenreFilter}
                options={[
                  { value: '', label: 'Все жанры' },
                  ...genres().map(g => ({ value: g.id.toString(), label: g.name }))
                ]}
              />
            </div>
          </Show>
        </div>
        
        {/* Game Tree */}
        <div class="flex-1 overflow-auto p-2">
          <Show when={searchQuery() && searchResults().length > 0}>
            <div class="mb-2">
              <p class="text-xs text-muted-foreground px-2 mb-2">
                Результаты поиска:
              </p>
              <SearchResults
                games={searchResults()}
                selectedId={selectedGame()?.id}
                onSelect={setSelectedGame}
              />
            </div>
          </Show>
          
          <Show when={!searchQuery() || searchResults().length === 0}>
            <Show when={gamesTree().length === 0}>
              <div class="p-8 text-center text-muted-foreground">
                <p class="text-4xl mb-2">🎲</p>
                <p>Нет игр в коллекции.</p>
                <p>Добавьте первую игру!</p>
              </div>
            </Show>
            
            <Show when={gamesTree().length > 0}>
              <GameTree
                games={gamesTree()}
                selectedId={selectedGame()?.id}
                onSelect={setSelectedGame}
                onToggle={toggleNode}
                expandedIds={expandedNodes()}
              />
            </Show>
          </Show>
        </div>
      </aside>
      
      {/* Main Content */}
      <main class="flex-1 overflow-auto p-6">
        <Show when={selectedGame()}>
          <GameCard
            game={selectedGame()!}
            onDelete={handleDeleteGame}
          />
        </Show>
        
        <Show when={!selectedGame()}>
          <div class="flex h-full items-center justify-center text-muted-foreground">
            <div class="text-center">
              <p class="text-5xl mb-4">🎲</p>
              <p>Выберите игру из дерева или добавьте новую</p>
            </div>
          </div>
        </Show>
      </main>
      
      {/* Add Game Modal */}
      <GameForm
        open={showAddModal()}
        onOpenChange={setShowAddModal}
        onSubmit={handleCreateGame}
      />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Route path="/" component={Home} />
      <Route path="/settings" component={Settings} />
      <Route path="/game/new" component={EditGame} />
      <Route path="/game/:id/edit" component={EditGame} />
      <Route path="/game/:id/components" component={EditComponents} />
    </Router>
  );
}