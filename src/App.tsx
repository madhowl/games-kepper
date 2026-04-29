import { createSignal, onMount, Show } from 'solid-js';
import { invoke } from '@tauri-apps/api/core';

import { Input } from './components/ui/input';
import { Button } from './components/ui/button';
import { GameTree, SearchResults, type GameNode } from './components/games/GameTree';
import { GameCard } from './components/games/GameCard';
import { GameForm, type CreateGameDto } from './components/games/GameForm';

const [gamesTree, setGamesTree] = createSignal<GameNode[]>([]);
const [selectedGame, setSelectedGame] = createSignal<GameNode | null>(null);
const [expandedNodes, setExpandedNodes] = createSignal<Set<number>>(new Set());
const [searchQuery, setSearchQuery] = createSignal('');
const [searchResults, setSearchResults] = createSignal<GameNode[]>([]);
const [showAddModal, setShowAddModal] = createSignal(false);

async function loadData() {
  try {
    const tree = await invoke<GameNode[]>('get_games_tree');
    setGamesTree(tree);
  } catch (e) {
    console.error('Failed to load data:', e);
  }
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
});

export default function App() {
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
          <Button class="w-full" onClick={() => setShowAddModal(true)}>
            + Добавить игру
          </Button>
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