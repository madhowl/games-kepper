export interface ComponentType {
  id: number;
  name: string;
  base_type: 'card' | 'token' | 'board' | 'dice' | 'rulebook' | 'tile' | 'miniature' | 'marker' | 'custom';
  parent_type_id: number | null;
  field_schema: string;
  icon?: string;
  color: string;
  is_system: boolean;
  created_at: string;
}

export interface FieldSchema {
  type: 'string' | 'integer' | 'float' | 'boolean' | 'enum' | 'text' | 'color' | 'image' | 'coordinate';
  default?: any;
  options?: any[];
}

export interface GameComponent {
  id: number;
  game_id: number;
  component_type_id: number;
  name: string;
  quantity: number;
  data: string;
  images: string;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateComponentTypeDto {
  name: string;
  base_type: string;
  field_schema?: string;
  icon?: string;
  color?: string;
}

export interface UpdateComponentTypeDto {
  name?: string;
  field_schema?: string;
  icon?: string;
  color?: string;
}

export interface CreateGameComponentDto {
  game_id: number;
  component_type_id: number;
  name: string;
  quantity?: number;
  data?: string;
  images?: string;
  notes?: string;
}

export interface UpdateGameComponentDto {
  name?: string;
  quantity?: number;
  data?: string;
  images?: string;
  notes?: string;
  sort_order?: number;
}

export function parseFieldSchema(schema: string): Record<string, FieldSchema> {
  try {
    return JSON.parse(schema);
  } catch {
    return {};
  }
}

export function parseData(data: string): Record<string, any> {
  try {
    return JSON.parse(data);
  } catch {
    return {};
  }
}

export function parseImages(images: string): string[] {
  try {
    return JSON.parse(images);
  } catch {
    return [];
  }
}

export const BASE_TYPE_LABELS: Record<string, string> = {
  card: 'Карта',
  token: 'Фишка',
  board: 'Поле',
  dice: 'Кубик',
  rulebook: 'Правила',
  tile: 'Плитка',
  miniature: 'Миниатюра',
  marker: 'Маркер',
  custom: 'Другое',
};

export const BASE_TYPE_ICONS: Record<string, string> = {
  card: '🃏',
  token: '🪙',
  board: '🗺️',
  dice: '🎲',
  rulebook: '📖',
  tile: '⬜',
  miniature: '♟️',
  marker: '🏷️',
  custom: '📦',
};