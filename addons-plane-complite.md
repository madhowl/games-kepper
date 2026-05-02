# 🎮 Games Keeper — Объединённый план реализации

> **Текущая версия**: v0.2.0 (Милистоун 1 завершен)
> **Стек проекта**: Tauri 2.0 + SolidJS + TypeScript + Tailwind 4 + shadcn-solid + Rust + SQLite (sqlx)
> **План**: Объединение лучшего из addons/1.md, addons/2.md, addons/3.md, addons/4.md

---

## 1. Текущее состояние

| Компонент | Статус | Версия |
|-----------|--------|--------|
| Tauri 2.0 + Solid.js | ✅ Готово | v0.2.0 |
| SQLite + sqlx | ✅ Готово | v0.2.0 |
| CRUD игр/жанров/авторов/издателей | ✅ Готово | v0.2.0 |
| Иерархия через parent_id | ✅ Готово | v0.2.0 |
| Базовый JSON экспорт | ✅ Готово | v0.2.0 |

---

## 2. Git Flow стратегия

```
main/master ←────────────────────────── (protected, production)
  ↑
develop ←─────────────────────────── (default branch)
  ├── feature/components-db        (v0.2.1)
  ├── feature/components-ui        (v0.2.2)
  ├── feature/card-constructor    (v0.2.3)
  ├── feature/image-editor        (v0.2.4)
  ├── feature/ocr-ai             (v0.2.5)
  └── feature/pdf-print           (v0.2.6)
```

### Правила
- `main` / `master` — стабильные релизы, теги версий (v0.2.0, v0.2.1...)
- `develop` — основная ветка разработки
- `feature/*` — от ветки `develop`, вливаются через PR в `develop`
- Коммиты: **Conventional Commits** (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`)
- PR обязательны для `develop` и `main`

### Полезные команды
```bash
# Создание ветки для фичи
git checkout develop
git pull origin develop
git checkout -b feature/components-db

# Разработка
npm run tauri dev

# Коммиты (Conventional Commits)
git add .
git commit -m "feat: add component models for v0.2.1"

# PR (через gh cli)
gh pr create --base develop --head feature/components-db --title "v0.2.1: Components System" --body "Реализация системы компонентов"

# Сборка релиза
npm run tauri build

# Тегирование
git tag -a v0.2.1 -m "Release v0.2.1: Components System"
git push origin v0.2.1
```

---

## 3. Версии релизов

| Релиз | Содержание | Feature-ветка |
|-------|-----------|---------------|
| **v0.2.1** | Компоненты: БД + Rust CRUD | `feature/components-db` |
| **v0.2.2** | Frontend UI компонентов | `feature/components-ui` |
| **v0.2.3** | Конструктор карт (tldraw) | `feature/card-constructor` |
| **v0.2.4** | Редактор изображений (multiwindow) | `feature/image-editor` |
| **v0.2.5** | OCR + AI (LM Studio/Ollama/OpenRouter) | `feature/ocr-ai` |
| **v0.2.6** | PDF экспорт + печать | `feature/pdf-print` |

---

# v0.2.1: Компоненты (БД + Rust CRUD)

## Задачи

### 1.1 Миграция БД
**Файл**: `src-tauri/migrations/002_components.sql`

```sql
-- Таблица типов компонентов (конструктор форм)
CREATE TABLE IF NOT EXISTS component_types (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    name           TEXT NOT NULL,
    base_type      TEXT NOT NULL 
                   CHECK(base_type IN ('card', 'token', 'board', 'dice', 'rulebook', 'tile', 'miniature', 'marker', 'custom')),
    parent_type_id INTEGER REFERENCES component_types(id),
    field_schema   TEXT NOT NULL DEFAULT '{}',
    icon           TEXT,
    color          TEXT DEFAULT '#6366f1',
    is_system      BOOLEAN DEFAULT FALSE,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Таблица компонентов игры (экземпляры типов)
CREATE TABLE IF NOT EXISTS game_components (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id           INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    component_type_id INTEGER NOT NULL REFERENCES component_types(id),
    name              TEXT NOT NULL,
    quantity          INTEGER DEFAULT 1,
    data              TEXT NOT NULL DEFAULT '{}',
    images            TEXT DEFAULT '[]',
    notes             TEXT,
    sort_order        INTEGER DEFAULT 0,
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Триггер updated_at
CREATE TRIGGER IF NOT EXISTS game_components_updated_at 
AFTER UPDATE ON game_components
BEGIN
    UPDATE game_components SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Индексы
CREATE INDEX IF NOT EXISTS idx_game_components_game ON game_components(game_id);
CREATE INDEX IF NOT EXISTS idx_game_components_type ON game_components(component_type_id);
```

### 1.2 Сидинг системных шаблонов
```rust
let templates = vec![
    ("Стандартная карта", "card", r#"{"fields": [{"name": "cost", "type": "integer", "default": 0}, {"name": "type", "type": "string", "default": ""}]}"#, r#"{"width": 63, "height": 88}"#),
    ("Фишка", "token", r#"{"fields": [{"name": "value", "type": "integer", "default": 1}]}"#, r#"{"width": 20, "height": 20}"#),
    ("Игровое поле", "board", r#"{"fields": [{"name": "grid", "type": "string", "default": "none"}]}"#, r#"{"width": 297, "height": 420}"#),
];
```

### 1.3 Rust DTO
**Файл**: `src-tauri/src/models/dto.rs`

```rust
#[derive(Serialize, Deserialize)]
pub struct CreateComponentTypeDto {
    pub name: String,
    pub base_type: String,
    pub field_schema: Option<String>,
    pub icon: Option<String>,
    pub color: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct CreateGameComponentDto {
    pub game_id: i64,
    pub component_type_id: i64,
    pub name: String,
    pub quantity: Option<i32>,
    pub data: Option<String>,
}
```

### 1.4 Rust команды
**Файл**: `src-tauri/src/commands/components.rs`

```rust
#[tauri::command]
pub async fn get_component_types(state: State<'_, AppState>) -> Result<Vec<ComponentType>, String> { ... }

#[tauri::command]
pub async fn create_component_type(state: State<'_, AppState>, dto: CreateComponentTypeDto) -> Result<ComponentType, String> { ... }

#[tauri::command]
pub async fn get_game_components(state: State<'_, AppState>, game_id: i64) -> Result<Vec<GameComponent>, String> { ... }

#[tauri::command]
pub async fn create_game_component(state: State<'_, AppState>, dto: CreateGameComponentDto) -> Result<GameComponent, String> { ... }

#[tauri::command]
pub async fn update_game_component(state: State<'_, AppState>, id: i64, dto: CreateGameComponentDto) -> Result<GameComponent, String> { ... }

#[tauri::command]
pub async fn delete_game_component(state: State<'_, AppState>, id: i64) -> Result<bool, String> { ... }
```

### 1.5 Frontend: Типы и API
**Файл**: `src/types/components.ts`

```typescript
export interface ComponentType {
  id: number;
  name: string;
  base_type: 'card' | 'token' | 'board' | 'dice' | 'rulebook' | 'tile' | 'miniature' | 'marker' | 'custom';
  field_schema: Record<string, FieldSchema>;
  icon?: string;
  color: string;
  is_system: boolean;
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
  data: Record<string, any>;
  images?: string[];
  notes?: string;
}
```

## Ветка
`feature/components-db`

## Чеклист
- [ ] Миграция 002_components.sql
- [ ] Модели ComponentType, GameComponent
- [ ] CRUD команды Tauri
- [ ] Сидинг системных типов
- [ ] Тесты
- [ ] PR в develop

---

# v0.2.2: Frontend UI компонентов

## Задачи

### 2.1 Страница компонентов
- [ ] Новая страница `/game/:id/components`
- [ ] Список компонентов с фильтрацией по типу
- [ ] Карточки компонентов (grid view)

### 2.2 Детали компонента
- [ ] Просмотр деталей
- [ ] Редактирование (модалка)
- [ ] Удаление

### 2.3 UI компоненты
- [ ] `ComponentList.tsx`
- [ ] `ComponentCard.tsx` — визуальная карточка
- [ ] `ComponentForm.tsx`
- [ ] `FieldBuilderDialog.tsx` — конструктор полей

## Ветка
`feature/components-ui`

## Файлы
- `src/pages/EditComponents.tsx`
- `src/components/components/*.tsx`

---

# v0.2.3: Конструктор карт

## Задачи

### 3.1 Диалог конструктора
- [ ] Модалка конструктора карт
- [ ] Выбор шаблона (односторонняя, двусторонняя, токен)
- [ ] Выбор размера

### 3.2 Canvas (tldraw)
- [ ] Интеграция `@tldraw/tldraw`
- [ ] Холст для редактирования
- [ ] Слои (лицевая, обратная, рамка)

### 3.3 Параметры карты
- [ ] Название
- [ ] Текст
- [ ] Эффекты (выбор из списка)
- [ ] Предпросмотр

### 3.4 Сохранение
- [ ] Экспорт в PNG
- [ ] Сохранение в БД

## Зависимости
```bash
npm install @tldraw/tldraw
```

## Ветка
`feature/card-constructor`

## Файлы
- `src/components/editor/CardConstructor.tsx`
- `src/components/editor/TldrawEditor.tsx`

---

# v0.2.4: Редактор изображений (отдельное окно)

## Задачи

### 4.1 Multiwindow
- [ ] Открытие отдельного окна через Tauri 2.0
- [ ] Передача данных между окнами

### 4.2 Инструменты
- [ ] Выделение (selection)
- [ ] Перемещение
- [ ] Масштабирование
- [ ] Поворот
- [ ] Обрезка (crop)

### 4.3 Слои
- [ ] Добавление/удаление слоёв
- [ ] Порядок слоёв

### 4.4 Текст и фигуры
- [ ] Добавление текста
- [ ] Простые фигуры (rect, circle, line)
- [ ] Заливка и обводка

### 4.5 Экспорт
- [ ] PNG
- [ ] JPG
- [ ] PDF (одиночная страница)

## Rust команды (Backend)
```rust
#[tauri::command]
pub async fn resize_image(base64_image: String, width: u32, height: u32) -> Result<String, String> { ... }

#[tauri::command]
pub async fn crop_image(base64_image: String, x: u32, y: u32, width: u32, height: u32) -> Result<String, String> { ... }

#[tauri::command]
pub async fn rotate_image(base64_image: String, degrees: f32) -> Result<String, String> { ... }
```

## Зависимости (Cargo.toml)
```toml
image = "0.25"
```

## Ветка
`feature/image-editor`

## Файлы
- `src-tauri/src/commands/image_editor.rs`
- `src/windows/ImageEditor.tsx`

---

# v0.2.5: OCR + AI

## Задачи

### 5.1 OCR (LM Studio)
- [ ] Интеграция с LM Studio API
- [ ] UI диалог OCR
- [ ] Выбор языка (rus+eng)
- [ ] Batch обработка

### 5.2 AI провайдеры
- [ ] LM Studio (локальный)
- [ ] Ollama (локальный)
- [ ] OpenRouter (удалённый)

### 5.3 UI настроек
- [ ] Страница настроек AI/OCR
- [ ] Выбор провайдера
- [ ] Настройка модели
- [ ] Тестирование подключения

### 5.4 Анализ карт
- [ ] OCR → текст карты
- [ ] AI → описание эффектов
- [ ] Создание карты из результата

## Rust (Backend)
**Файл**: `src-tauri/src/commands/ocr.rs`

```rust
const LM_STUDIO_URL: &str = "http://localhost:1234/v1/chat/completions";

#[derive(Debug, Serialize, Deserialize)]
pub struct OcrRequest {
    pub image_base64: String,
    pub prompt: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OcrResult {
    pub text: String,
    pub confidence: f32,
}

#[tauri::command]
pub async fn recognize_text(dto: OcrRequest) -> Result<OcrResult, String> {
    let client = Client::new();
    let prompt = dto.prompt.unwrap_or_else(|| 
        "Describe the text in this image. Extract any game card information like name, cost, effects.".to_string()
    );
    let body = json!({
        "model": "local-model",
        "messages": [{
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": format!("data:image/png;base64,{}", dto.image_base64)}}
            ]
        }],
        "max_tokens": 500
    });
    let response = client.post(LM_STUDIO_URL).json(&body).send().await.map_err(|e| e.to_string())?;
    let json: Value = response.json().await.map_err(|e| e.to_string())?;
    let text = json["choices"][0]["message"]["content"].as_str().unwrap_or("").to_string();
    Ok(OcrResult { text, confidence: 0.9 })
}
```

## Зависимости (Cargo.toml)
```toml
reqwest = { version = "0.12", features = ["json"] }
base64 = "0.22"
image = "0.25"
```

## Ветка
`feature/ocr-ai`

## Файлы
- `src-tauri/src/commands/ocr.rs`
- `src-tauri/src/commands/llm.rs`
- `src/pages/SettingsOcr.tsx`

---

# v0.2.6: PDF экспорт + печать

## Задачи

### 6.1 Rust PDF
- [ ] Интеграция `printpdf`
- [ ] Генерация PDF
- [ ] Сетка карт на листе
- [ ] Метки реза
- [ ] Отступы

### 6.2 UI диалог печати
- [ ] Выбор компонентов
- [ ] Шаблон листа (A4, Letter)
- [ ] Размер сетки (3x3, 4x5)
- [ ] Размер карт
- [ ] Метки реза (checkbox)
- [ ] Отступы

### 6.3 Предпросмотр
- [ ] Preview PDF в браузере
- [ ] Масштабирование

### 6.4 Печать
- [ ] Печать через системный диалог
- [ ] Сохранение в PDF

## Зависимости (Cargo.toml)
```toml
printpdf = "0.7"
```

## Ветка
`feature/pdf-print`

## Файлы
- `src-tauri/src/commands/pdf_export.rs`
- `src/components/export/PrintDialog.tsx`
- `src/components/export/PdfPreview.tsx`

---

# Приложения

## A. Зависимости проекта

### npm
```json
{
  "dependencies": {
    "@tldraw/tldraw": "^2.0.0"
  }
}
```

### Cargo (Rust)
```toml
[dependencies]
image = "0.25"
reqwest = { version = "0.12", features = ["json"] }
base64 = "0.22"
printpdf = "0.7"
```

## B. Маршруты приложения

```
/                           — список игр
/game/:id                   — детали игры
/game/:id/components       — компоненты игры
/tools/constructor          — конструктор (глобальный)
/tools/ocr                 — OCR инструмент
/tools/export               — экспорт
/settings                  — настройки AI/OCR
```

## C. Меню приложения (Tauri)

```rust
.menu(Menu::new()
    .add_submenu(Submenu::new("Файл")
        .add_item(MenuItem::new("Экспорт в JSON").accelerator("CmdOrCtrl+E"))
        .add_item(MenuItem::new("Экспорт в PDF"))
    )
    .add_submenu(Submenu::new("Инструменты")
        .add_item(MenuItem::new("Конструктор компонентов").accelerator("CmdOrCtrl+G"))
        .add_item(MenuItem::new("OCR распознавание").accelerator("CmdOrCtrl+I"))
    )
)
```

## D. Чеклист завершения (общий)

- [ ] Миграции БД выполняются автоматически
- [ ] Создание/удаление компонентов работает
- [ ] Конструктор полей сохраняет JSON корректно
- [ ] Редактор изображений обрезает/поворачивает
- [ ] OCR через LM Studio возвращает текст
- [ ] Экспорт в JSON включает компоненты
- [ ] PDF генерируется с сеткой и метками реза
- [ ] Диалоги открываются/закрываются корректно
- [ ] Навигация по маршрутам работает
- [ ] Горячие клавиши функционируют

---

## Заметки

1. **tldraw** — `npm install @tldraw/tldraw`
2. **Multiwindow** — Tauri 2.0 `tauri::WebviewWindow::new()`
3. **LM Studio** — HTTP `reqwest::Client` (порт 1234)
4. **PDF** — Rust `printpdf` (не в браузере — проблемы с DPI)
5. **AI провайдеры** — LM Studio, Ollama, OpenRouter

---

**План обновлён: 02.05.2026**
**Объединено из**: addons/1.md, addons/2.md, addons/3.md, addons/4.md
**Версии**: v0.2.1 ... v0.2.6
