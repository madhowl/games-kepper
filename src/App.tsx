import { createSignal, For, Show, onMount } from 'solid-js';
import { invoke } from '@tauri-apps/api/core';

interface GameNode {
  id: number;
  title: string;
  node_type: string;
  cover_image: string | null;
  has_children: boolean;
  sort_order: number;
  children: GameNode[];
}

const [gamesTree, setGamesTree] = createSignal<GameNode[]>([]);
const [selectedGame, setSelectedGame] = createSignal<GameNode | null>(null);
const [expandedNodes, setExpandedNodes] = createSignal<Set<number>>(new Set());
const [searchQuery, setSearchQuery] = createSignal('');
const [searchResults, setSearchResults] = createSignal<GameNode[]>([]);
const [showAddModal, setShowAddModal] = createSignal(false);
const [newGameTitle, setNewGameTitle] = createSignal('');
const [newGameType, setNewGameType] = createSignal('game');

async function loadData() {
  try {
    const tree = await invoke<GameNode[]>('get_games_tree');
    setGamesTree(tree);
  } catch (e) {
    console.error('Failed to load data:', e);
  }
}

async function handleCreateGame() {
  if (!newGameTitle()) return;
  try {
    await invoke('create_game', {
      dto: {
        title: newGameTitle(),
        node_type: newGameType(),
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
      }
    });
    setNewGameTitle('');
    setNewGameType('game');
    setShowAddModal(false);
    await loadData();
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

function getNodeIcon(type: string) {
  switch (type) {
    case 'expansion': return '📦';
    case 'promo': return '🎁';
    default: return '🎲';
  }
}

onMount(() => {
  loadData();
});

function GameItem(props: { game: GameNode; level: number }) {
  const isExpanded = () => expandedNodes().has(props.game.id);
  const isSelected = () => selectedGame()?.id === props.game.id;
  
  return (
    <>
      <div
        onClick={() => {
          if (props.game.has_children) toggleNode(props.game.id);
          setSelectedGame(props.game);
        }}
        style={{
          padding: '8px 12px',
          borderRadius: '6px',
          cursor: 'pointer',
          background: isSelected() ? '#4f46e5' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginLeft: `${props.level * 20}px`
        }}
      >
        <Show when={props.game.has_children}>
          <span style={{ transform: isExpanded() ? 'rotate(90deg)' : 'rotate(0)', transition: '0.2s' }}>▶</span>
        </Show>
        <Show when={!props.game.has_children}>
          <span style={{ width: '16px' }} />
        </Show>
        {getNodeIcon(props.game.node_type)} {props.game.title}
      </div>
      <Show when={props.game.has_children && isExpanded()}>
        <For each={props.game.children}>
          {(child) => <GameItem game={child} level={props.level + 1} />}
        </For>
      </Show>
    </>
  );
}

export default function App() {
  return (
    <div style={{ display: 'flex', height: '100vh', background: '#1a1a2e', color: '#eaeaea' }}>
      <aside style={{ width: '320px', borderRight: '1px solid #333', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #333' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input
              type="text"
              placeholder="Поиск игр..."
              value={searchQuery()}
              onInput={(e) => setSearchQuery(e.currentTarget.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #444',
                background: '#16213e',
                color: '#eaeaea',
                outline: 'none'
              }}
            />
            <button
              onClick={handleSearch}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                background: '#4f46e5',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              🔍
            </button>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '6px',
              border: 'none',
              background: '#22c55e',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            + Добавить игру
          </button>
        </div>
        
        <div style={{ flex: 1, overflow: 'auto', padding: '8px', minHeight: 0 }}>
          <Show when={searchQuery() && searchResults().length > 0}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px', padding: '0 8px' }}>
                Результаты поиска:
              </div>
              <For each={searchResults()}>
                {(game) => (
                  <div
                    onClick={() => setSelectedGame(game)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      background: selectedGame()?.id === game.id ? '#4f46e5' : 'transparent',
                      marginBottom: '4px'
                    }}
                  >
                    {getNodeIcon(game.node_type)} {game.title}
                  </div>
                )}
              </For>
            </div>
          </Show>
          
          <Show when={!searchQuery() || searchResults().length === 0}>
            <For each={gamesTree()}>
              {(game) => <GameItem game={game} level={0} />}
            </For>
          </Show>
          
          <Show when={gamesTree().length === 0 && !searchQuery()}>
            <div style={{ padding: '32px', textAlign: 'center', color: '#666' }}>
              Нет игр в коллекции.<br />Добавьте первую игру!
            </div>
          </Show>
        </div>
      </aside>
      
      <main style={{ flex: 1, padding: '24px', overflow: 'auto', position: 'relative', zIndex: 1 }}>
        <Show when={selectedGame()}>
          <div style={{ background: '#16213e', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>
                {getNodeIcon(selectedGame()!.node_type)} {selectedGame()!.title}
              </h1>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleDeleteGame(selectedGame()!.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#ef4444',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Удалить
                </button>
              </div>
            </div>
            <Show when={selectedGame()!.has_children}>
              <div style={{ color: '#22c55e', marginBottom: '16px' }}>
                📂 {selectedGame()!.children.length} вложенных элементов
              </div>
            </Show>
          </div>
        </Show>
        
        <Show when={!selectedGame()}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎲</div>
              <div>Выберите игру из дерева или добавьте новую</div>
            </div>
          </div>
        </Show>
      </main>
      
      <Show when={showAddModal()}>
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}
        onClick={() => setShowAddModal(false)}
        >
          <div style={{
            background: '#16213e',
            borderRadius: '12px',
            padding: '24px',
            width: '400px'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: '16px' }}>Добавить игру</h2>
            <input
              type="text"
              placeholder="Название"
              value={newGameTitle()}
              onInput={(e) => setNewGameTitle(e.currentTarget.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #444',
                background: '#1a1a2e',
                color: '#eaeaea',
                marginBottom: '12px',
                outline: 'none'
              }}
            />
            <select
              value={newGameType()}
              onChange={(e) => setNewGameType(e.currentTarget.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #444',
                background: '#1a1a2e',
                color: '#eaeaea',
                marginBottom: '12px'
              }}
            >
              <option value="game">Игра</option>
              <option value="expansion">Дополнение</option>
              <option value="promo">Промо</option>
            </select>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleCreateGame}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#22c55e',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Добавить
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#444',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}