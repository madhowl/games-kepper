# 🎲 Полный план разработки приложения каталогизации настольных игр (SeaORM версия)

## Часть 1: Анализ требований и выбор стека

### 1.1 Анализ сложности компонентов

```
┌─────────────────────────────────────────────────────────────┐
│                    СЛОЖНОСТЬ КОМПОНЕНТОВ                     │
├─────────────────────┬───────────────┬───────────────────────┤
│ Компонент           │ Сложность     │ Ключевые требования   │
├─────────────────────┼───────────────┼───────────────────────┤
│ Иерархия игр        │ Средняя       │ Рекурсия, CRUD        │
│ Конструктор форм    │ Высокая       │ JSON Schema, динамика │
│ Редактор карт       │ Очень высокая │ Canvas, слои, шаблоны │
│ OCR + LM Studio     │ Высокая       │ API, промпты, валид.  │
│ PDF + печать        │ Высокая       │ Imposition, bleed     │
│ Редактор изображений│ Высокая       │ Фильтры, маски, crop  │
└─────────────────────┴───────────────┴───────────────────────┘
```

### 1.2 Выбор технологического стека

```
┌─────────────────────────────────────────────────────────────────┐
│                      ТЕХНОЛОГИЧЕСКИЙ СТЕК (SeaORM)                │
├──────────────────┬──────────────────────┬───────────────────────┤
│ Слой             │ Технология           │ Обоснование           │
├──────────────────┼──────────────────────┼───────────────────────┤
│ Desktop Shell    │ Tauri 2.0            │ ~8MB, Rust, безопасно │
│ UI Framework     │ SolidJS              │ Реактивность, скорость │
│ Язык UI          │ TypeScript           │ Типизация, надёжность │
│ Стили            │ TailwindCSS 4        │ Утилитарность, скорость│
│ UI Компоненты    │ shadcn-solid        │ Готовые accessible UI │
│ Canvas/Editor    │ Konva.js             │ Лучший 2D Canvas API  │
│ Backend          │ Rust                 │ Скорость, безопасность│
│ База данных      │ SQLite + SeaORM      │ ORM, Relations, типы  │
│ Миграции БД      │ sea-orm-migration    │ Версионирование схемы │
│ PDF              │ printpdf (Rust)      │ Точная работа с PDF   │
│ Изображения      │ image + resvg (Rust) │ Быстрая обработка     │
│ OCR API          │ LM Studio (HTTP)     │ Локально, оффлайн     │
│ State Management │ SolidJS Stores       │ Встроено в SolidJS    │
│ Роутинг          │ SolidJS Router       │ Файловый роутинг      │
│ Тестирование     │ Vitest + cargo test  │ Покрытие обоих слоёв  │
└──────────────────┴──────────────────────┴───────────────────────┘
```

---

## Часть 2: Архитектура системы

### 2.1 Общая архитектура

```
┌─────────────────────────────────────────────────────────────────────┐
│                           TAURI 2.0 APP                              │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    FRONTEND (SolidJS)                        │    │
│  │                                                               │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │    │
│  │  │  Games   │  │Component │  │   Card   │  │ Printing │   │    │
│  │  │  Module  │  │ Builder  │  │  Editor  │  │  Module  │   │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │    │
│  │                                                               │    │
│  │  ┌──────────────────────────────────────────────────────┐   │    │
│  │  │              SolidJS Stores (State Layer)              │   │    │
│  │  └──────────────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              │  Tauri Commands IPC                   │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                     BACKEND (Rust)                            │    │
│  │                                                               │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │    │
│  │  │  Games   │  │Component │  │   OCR    │  │   PDF    │   │    │
│  │  │  Service │  │ Service  │  │  Service │  │  Service │   │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │    │
│  │                                                               │    │
│  │  ┌──────────────────────────────────────────────────────┐   │    │
│  │  │          SeaORM Entities Layer (SQLite)               │   │    │
│  │  └──────────────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌─────────────────────┐    ┌──────────────────────────┐    │
│  │   File System        │    │   LM Studio (Local HTTP API)     │    │
│  │   (Images, PDFs)     │    │   localhost:1234                 │    │
│  └─────────────────────┘    └──────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Структура проекта

```
board-game-catalog/
│
├── src-tauri/                          # Rust Backend
│   ├── src/
│   │   ├── main.rs                     # Точка входа Tauri
│   │   ├── lib.rs                      # Регистрация команд
│   │   │
│   │   ├── entities/                   # SeaORM Entities
│   │   │   ├── mod.rs
│   │   │   ├── game.rs
│   │   │   ├── genre.rs
│   │   │   ├── author.rs
│   │   │   ├── publisher.rs
│   │   │   ├── series.rs
│   │   │   ├── game_genres.rs
│   │   │   ├── game_authors.rs
│   │   │   └── game_publishers.rs
│   │   │
│   │   ├── models/                     # DTO структуры
│   │   │   ├── mod.rs
│   │   │   └── dto.rs
│   │   │
│   │   ├── services/                   # Бизнес-логика
│   │   │   ├── mod.rs
│   │   │   ├── game_service.rs
│   │   │   ├── component_service.rs
│   │   │   ├── ocr_service.rs
│   │   │   ├── pdf_service.rs
│   │   │   ├── image_service.rs
│   │   │   └── export_service.rs
│   │   │
│   │   └── commands/                   # Tauri команды (IPC)
│   │       ├── mod.rs
│   │       ├── game_commands.rs
│   │       ├── component_commands.rs
│   │       ├── ocr_commands.rs
│   │       └── pdf_commands.rs
│   │
│   ├── Cargo.toml
│   └── tauri.conf.json
│
├── src/                                # SolidJS Frontend
│   ├── index.html
│   ├── app.tsx
│   │
│   ├── components/                 # UI компоненты
│   │   ├── ui/                     # Базовые (shadcn-solid)
│   │   ├── games/                  # Компоненты игр
│   │   │   ├── GameTree.tsx
│   │   │   ├── GameCard.tsx
│   │   │   ├── GameForm.tsx
│   │   │   └── SeriesView.tsx
│   │   │
│   │   ├── components/             # Конструктор компонентов
│   │   │   ├── ComponentBuilder.tsx
│   │   │   ├── FieldConstructor.tsx
│   │   │   └── DynamicForm.tsx
│   │   │
│   │   ├── cards/                  # Редактор карт
│   │   │   ├── CardEditor.tsx
│   │   │   ├── CardCanvas.tsx
│   │   │   ├── LayerPanel.tsx
│   │   │   └── CardTemplates.tsx
│   │   │
│   │   ├── ocr/                    # OCR модуль
│   │   │   ├── OcrImporter.tsx
│   │   │   └── OcrReview.tsx
│   │   │
│   │   └── printing/               # Печать и PDF
│   │       ├── PrintLayout.tsx
│   │       └── PdfExporter.tsx
│   │
│   ├── stores/                     # SolidJS stores
│   │   ├── games.store.ts
│   │   ├── components.store.ts
│   │   └── ui.store.ts
│   │
│   ├── types/                      # TypeScript типы
│   │   ├── game.types.ts
│   │   ├── component.types.ts
│   │   └── schema.types.ts
│   │
│   └── utils/                      # Утилиты
│       ├── api.ts                  # Обёртки над Tauri invoke
│       ├── schema.utils.ts
│       └── canvas.utils.ts
│
├── package.json
├── solid.config.ts
└── tailwind.config.ts
```

---

## Часть 3: Модели данных (SeaORM)

### 3.1 SeaORM Entities

```rust
// src-tauri/src/entities/genre.rs
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "genres")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = true)]
    pub id: i64,
    #[sea_orm(column_type = "Text")]
    pub name: String,
    #[sea_orm(column_type = "Text")]
    pub created_at: String,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
```

```rust
// src-tauri/src/entities/author.rs
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "authors")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = true)]
    pub id: i64,
    #[sea_orm(column_type = "Text")]
    pub name: String,
    #[sea_orm(column_type = "Text", nullable)]
    pub bio: Option<String>,
    #[sea_orm(column_type = "Text")]
    pub created_at: String,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
```

```rust
// src-tauri/src/entities/publisher.rs
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "publishers")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = true)]
    pub id: i64,
    #[sea_orm(column_type = "Text")]
    pub name: String,
    #[sea_orm(column_type = "Text", nullable)]
    pub country: Option<String>,
    #[sea_orm(column_type = "Text", nullable)]
    pub website: Option<String>,
    #[sea_orm(column_type = "Text")]
    pub created_at: String,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
```

```rust
// src-tauri/src/entities/series.rs
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "series")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = true)]
    pub id: i64,
    #[sea_orm(column_type = "Text")]
    pub name: String,
    #[sea_orm(column_type = "Text", nullable)]
    pub description: Option<String>,
    #[sea_orm(column_type = "Text", nullable)]
    pub image_path: Option<String>,
    #[sea_orm(column_type = "Text")]
    pub created_at: String,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
```

```rust
// src-tauri/src/entities/game.rs
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "games")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = true)]
    pub id: i64,
    #[sea_orm(nullable)]
    pub parent_id: Option<i64>,
    #[sea_orm(nullable)]
    pub series_id: Option<i64>,
    #[sea_orm(column_type = "Text", default = "game")]
    pub node_type: String,
    #[sea_orm(default = 0)]
    pub sort_order: i32,
    #[sea_orm(column_type = "Text")]
    pub title: String,
    #[sea_orm(column_type = "Text", nullable)]
    pub original_title: Option<String>,
    #[sea_orm(column_type = "Text", nullable)]
    pub description: Option<String>,
    #[sea_orm(nullable)]
    pub year_published: Option<i32>,
    #[sea_orm(nullable)]
    pub min_players: Option<i32>,
    #[sea_orm(nullable)]
    pub max_players: Option<i32>,
    #[sea_orm(nullable)]
    pub min_age: Option<i32>,
    #[sea_orm(nullable)]
    pub play_time_min: Option<i32>,
    #[sea_orm(nullable)]
    pub play_time_max: Option<i32>,
    #[sea_orm(nullable)]
    pub difficulty: Option<f64>,
    #[sea_orm(column_type = "Text", nullable)]
    pub cover_image: Option<String>,
    #[sea_orm(nullable)]
    pub bgg_id: Option<i32>,
    #[sea_orm(column_type = "Text", nullable)]
    pub barcode: Option<String>,
    #[sea_orm(column_type = "Text", default = "ru")]
    pub language: String,
    #[sea_orm(column_type = "Text", default = "owned")]
    pub status: String,
    #[sea_orm(column_type = "Text", nullable)]
    pub condition: Option<String>,
    #[sea_orm(column_type = "Text")]
    pub created_at: String,
    #[sea_orm(column_type = "Text")]
    pub updated_at: String,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::game_genres::Entity")]
    GameGenres,
    #[sea_orm(has_many = "super::game_authors::Entity")]
    GameAuthors,
    #[sea_orm(has_many = "super::game_publishers::Entity")]
    GamePublishers,
    #[sea_orm(has_many = "Entity")]
    Children,
    #[sea_orm(belongs_to = "Entity", from = "Column::ParentId", to = "Column::Id")]
    Parent,
    #[sea_orm(belongs_to = "super::series::Entity", from = "Column::SeriesId", to = "Column::Id")]
    Series,
}

impl ActiveModelBehavior for ActiveModel {}
```

```rust
// src-tauri/src/entities/game_genres.rs
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "game_genres")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub game_id: i64,
    #[sea_orm(primary_key, auto_increment = false)]
    pub genre_id: i64,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(belongs_to = "super::game::Entity", from = "Column::GameId", to = "super::game::Column::Id")]
    Game,
    #[sea_orm(belongs_to = "super::genre::Entity", from = "Column::GenreId", to = "super::genre::Column::Id")]
    Genre,
}

impl ActiveModelBehavior for ActiveModel {}
```

### 3.2 DTO модели (Data Transfer Objects)

```rust
// src-tauri/src/models/dto.rs
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateGameDto {
    pub parent_id: Option<i64>,
    pub series_id: Option<i64>,
    pub node_type: String,
    pub title: String,
    pub original_title: Option<String>,
    pub description: Option<String>,
    pub year_published: Option<i32>,
    pub min_players: Option<i32>,
    pub max_players: Option<i32>,
    pub min_age: Option<i32>,
    pub play_time_min: Option<i32>,
    pub play_time_max: Option<i32>,
    pub difficulty: Option<f64>,
    pub status: String,
    pub genre_ids: Vec<i64>,
    pub author_ids: Vec<i64>,
    pub publisher_ids: Vec<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateGameDto {
    pub title: Option<String>,
    pub original_title: Option<String>,
    pub description: Option<String>,
    pub year_published: Option<i32>,
    pub min_players: Option<i32>,
    pub max_players: Option<i32>,
    pub min_age: Option<i32>,
    pub play_time_min: Option<i32>,
    pub play_time_max: Option<i32>,
    pub difficulty: Option<f64>,
    pub status: Option<String>,
    pub parent_id: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GameNode {
    pub id: i64,
    pub title: String,
    pub node_type: String,
    pub cover_image: Option<String>,
    pub has_children: bool,
    pub sort_order: i32,
    pub children: Vec<GameNode>,
}
```

### 3.3 TypeScript типы (Frontend)

```typescript
// src/types/game.types.ts
export type NodeType = 'game' | 'expansion' | 'promo'
export type GameStatus = 'owned' | 'wishlist' | 'preorder' | 'sold'
export type GameCondition = 'mint' | 'good' | 'fair' | 'poor'

export interface Game {
    id:             number
    parentId:       number | null
    seriesId:       number | null
    nodeType:       NodeType
    sortOrder:      number
    title:          string
    originalTitle:  string | null
    description:    string | null
    yearPublished:  number | null
    minPlayers:     number | null
    maxPlayers:     number | null
    minAge:         number | null
    playTimeMin:    number | null
    playTimeMax:    number | null
    difficulty:     number | null
    coverImage:     string | null
    status:         GameStatus
    condition:      GameCondition | null
    createdAt:      string
    updatedAt:      string
}

export interface GameNode {
    id:          number
    title:       string
    nodeType:    NodeType
    coverImage:  string | null
    children:    GameNode[]
    hasChildren: boolean
    sortOrder:   number
}
```

---

## Часть 4: Реализация ключевых модулей (SeaORM)

### 4.1 Rust — Сервис игр с SeaORM

```rust
// src-tauri/src/services/game_service.rs
use sea_orm::{
    ActiveModelTrait, DatabaseConnection, DbErr, EntityTrait, 
    Order, PrimaryKeyTrait, QueryFilter, QueryOrder, Set
};
use crate::entities::game::{self, Entity as GameEntity};
use crate::entities::game_genres;
use crate::models::dto::*;

pub struct GameService {
    db: DatabaseConnection,
}

impl GameService {
    pub fn new(db: DatabaseConnection) -> Self {
        Self { db }
    }
    
    // ──────────────────────────────────────────
    // Получение дерева игр
    // ──────────────────────────────────────────
    
    pub async fn get_game_tree(&self) -> Result<Vec<GameNode>, DbErr> {
        let games = GameEntity::find()
            .order_by(game::Column::SortOrder, Order::Asc)
            .order_by(game::Column::Title, Order::Asc)
            .all(&self.db)
            .await?;
        
        Ok(self.build_tree(games, None))
    }
    
    fn build_tree(
        &self, 
        games: Vec<game::Model>, 
        parent_id: Option<i64>
    ) -> Vec<GameNode> {
        games
            .iter()
            .filter(|g| g.parent_id == parent_id)
            .map(|g| GameNode {
                id: g.id,
                title: g.title.clone(),
                node_type: g.node_type.clone(),
                cover_image: g.cover_image.clone(),
                sort_order: g.sort_order,
                has_children: games.iter().any(|c| c.parent_id == Some(g.id)),
                children: self.build_tree(games.clone(), Some(g.id)),
            })
            .collect()
    }
    
    // ──────────────────────────────────────────
    // CRUD операции
    // ──────────────────────────────────────────
    
    pub async fn create_game(
        &self, 
        dto: CreateGameDto
    ) -> Result<game::Model, DbErr> {
        // Вставка основной записи через ActiveModel
        let active_model = game::ActiveModel {
            parent_id: Set(dto.parent_id),
            series_id: Set(dto.series_id),
            node_type: Set(dto.node_type),
            sort_order: Set(0),
            title: Set(dto.title),
            original_title: Set(dto.original_title),
            description: Set(dto.description),
            year_published: Set(dto.year_published),
            min_players: Set(dto.min_players),
            max_players: Set(dto.max_players),
            min_age: Set(dto.min_age),
            play_time_min: Set(dto.play_time_min),
            play_time_max: Set(dto.play_time_max),
            difficulty: Set(dto.difficulty),
            cover_image: Set(None),
            bgg_id: Set(None),
            barcode: Set(None),
            language: Set("ru".to_string()),
            status: Set(dto.status),
            condition: Set(None),
            created_at: Set(chrono::Utc::now().to_rfc3339()),
            updated_at: Set(chrono::Utc::now().to_rfc3339()),
            ..Default::default()
        };
        
        let game = active_model.insert(&self.db).await?;
        
        // Привязка жанров
        for genre_id in &dto.genre_ids {
            let gg_active = game_genres::ActiveModel {
                game_id: Set(game.id),
                genre_id: Set(*genre_id),
                ..Default::default()
            };
            gg_active.insert(&self.db).await?;
        }
        
        Ok(game)
    }
    
    pub async fn get_game(&self, id: i64) -> Result<game::Model, DbErr> {
        GameEntity::find_by_id(id)
            .one(&self.db)
            .await?
            .ok_or(DbErr::RecordNotFound("Game not found".to_string()))
    }
    
    pub async fn update_game(
        &self, 
        id: i64,
        dto: UpdateGameDto
    ) -> Result<game::Model, DbErr> {
        let game = self.get_game(id).await?;
        let mut active_model: game::ActiveModel = game.into();
        
        if let Some(title) = dto.title { active_model.title = Set(title); }
        if let Some(original_title) = dto.original_title { 
            active_model.original_title = Set(Some(original_title)); 
        }
        if let Some(description) = dto.description { 
            active_model.description = Set(Some(description)); 
        }
        if let Some(year_published) = dto.year_published { 
            active_model.year_published = Set(Some(year_published)); 
        }
        if let Some(min_players) = dto.min_players { 
            active_model.min_players = Set(Some(min_players)); 
        }
        if let Some(max_players) = dto.max_players { 
            active_model.max_players = Set(Some(max_players)); 
        }
        if let Some(min_age) = dto.min_age { 
            active_model.min_age = Set(Some(min_age)); 
        }
        if let Some(play_time_min) = dto.play_time_min { 
            active_model.play_time_min = Set(Some(play_time_min)); 
        }
        if let Some(play_time_max) = dto.play_time_max { 
            active_model.play_time_max = Set(Some(play_time_max)); 
        }
        if let Some(difficulty) = dto.difficulty { 
            active_model.difficulty = Set(Some(difficulty)); 
        }
        if let Some(status) = dto.status { active_model.status = Set(status); }
        if let Some(parent_id) = dto.parent_id { 
            active_model.parent_id = Set(Some(parent_id)); 
        }
        
        active_model.updated_at = Set(chrono::Utc::now().to_rfc3339());
        
        active_model.update(&self.db).await
    }
    
    pub async fn delete_game(&self, id: i64) -> Result<(), DbErr> {
        GameEntity::delete_by_id(id).exec(&self.db).await?;
        Ok(())
    }
    
    // ──────────────────────────────────────────
    // Поиск (FTS5 через SeaORM)
    // ──────────────────────────────────────────
    
    pub async fn search_games(
        &self, 
        query: &str,
        limit: u64
    ) -> Result<Vec<game::Model>, DbErr> {
        let search_pattern = format!("%{}%", query);
        
        GameEntity::find()
            .filter(
                game::Column::Title.contains(&search_pattern)
                    | game::Column::OriginalTitle.contains(&search_pattern)
            )
            .order_by(game::Column::Title, Order::Asc)
            .limit(limit)
            .all(&self.db)
            .await
    }
}
```

### 4.2 Инициализация базы данных

```rust
// src-tauri/src/lib.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use sea_orm::{Database, DbConn};
use std::path::PathBuf;
use tauri::Manager;
use tokio::sync::Mutex as TokioMutex;

mod commands;
mod entities;
mod models;

pub struct AppState {
    pub db: TokioMutex<Option<DbConn>>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            db: TokioMutex::new(None),
        }
    }
}

async fn init_db() -> Result<DbConn, sea_orm::DbErr> {
    let db_path = std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|p| p.to_path_buf()))
        .unwrap_or_else(|| PathBuf::from("."))
        .join("data")
        .join("collection.db");
    
    let db_dir = db_path.parent().unwrap();
    let db_url = format!("sqlite:{}?mode=rwc", db_path.display());
    
    eprintln!("[DB] Opening database at: {}", db_path.display());
    
    std::fs::create_dir_all(db_dir).expect("Failed to create data directory");
    
    let db = Database::connect(&db_url).await?;
    
    eprintln!("[DB] Database connected");
    
    Ok(db)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState::default())
        .setup(|app| {
            let app_handle = app.handle().clone();
            
            tauri::async_runtime::spawn(async move {
                match init_db().await {
                    Ok(db) => {
                        let state = app_handle.state::<AppState>();
                        let mut lock = state.db.lock().await;
                        *lock = Some(db);
                        println!("Database initialized");
                    }
                    Err(e) => {
                        eprintln!("Database initialization error: {}", e);
                    }
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_games_tree,
            commands::create_game,
            commands::update_game,
            commands::delete_game,
            commands::move_game,
            commands::search_games,
            commands::get_genres,
            commands::create_genre,
            commands::get_authors,
            commands::create_author,
            commands::get_publishers,
            commands::create_publisher,
            commands::export_database,
            commands::import_database,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 4.3 Tauri команды с SeaORM

```rust
// src-tauri/src/commands/game_commands.rs
use sea_orm::{DbConn, EntityTrait, Order, QueryOrder, Set};
use tauri::State;
use serde::{Deserialize, Serialize};

use crate::entities::game::{self, Entity as GameEntity};
use crate::entities::genre::{self, Entity as GenreEntity};
use crate::models::dto::*;
use crate::AppState;

async fn get_db(state: &State<'_, AppState>) -> Result<DbConn, String> {
    let db_lock = state.db.lock().await;
    db_lock.clone().ok_or_else(|| "Database not initialized".to_string())
}

#[tauri::command]
pub async fn get_games_tree(state: State<'_, AppState>) -> Result<Vec<GameNode>, String> {
    let db = get_db(&state).await?;
    
    let games = GameEntity::find()
        .order_by(game::Column::SortOrder, Order::Asc)
        .order_by(game::Column::Title, Order::Asc)
        .all(&db)
        .await
        .map_err(|e| e.to_string())?;
    
    // build_tree function here...
    
    Ok(vec![]) // Simplified
}

#[tauri::command]
pub async fn create_game(state: State<'_, AppState>, dto: CreateGameDto) -> Result<game::Model, String> {
    let db = get_db(&state).await?;
    
    let active_model = game::ActiveModel {
        parent_id: Set(dto.parent_id),
        series_id: Set(dto.series_id),
        node_type: Set(dto.node_type),
        sort_order: Set(0),
        title: Set(dto.title),
        // ... other fields
        ..Default::default()
    };
    
    let game = active_model.insert(&db).await.map_err(|e| e.to_string())?;
    
    Ok(game)
}
```

---

## Часть 5: Преимущества SeaORM для проекта

### 5.1 Relations (Связи)

```rust
// Автоматические связи через DeriveRelation
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::game_genres::Entity")]
    GameGenres,
    
    #[sea_orm(belongs_to = "super::series::Entity", 
              from = "Column::SeriesId", 
              to = "super::series::Column::Id")]
    Series,
}

// Использование связей
let game = GameEntity::find_by_id(id)
    .find_with_related(GenreEntity)  // Автоматический JOIN
    .all(&db)
    .await?;
```

### 5.2 Active Record паттерн

```rust
// Создание
let active_model = game::ActiveModel { title: Set("Catan".to_string()), ..Default::default() };
let game = active_model.insert(&db).await?;

// Обновление
let mut game: game::ActiveModel = game.into();
game.title = Set("Catan (新版)".to_string());
game.update(&db).await?;

// Удаление
game.delete(&db).await?;
```

### 5.3 Типобезопасность

- Compile-time проверка существования колонок
- Автоматическая генерация типов из схемы
- Безопасные enum'ы через `#[derive(EnumIter)]`

---

## Часть 6: Миграции с sea-orm-migration

```rust
// src-tauri/src/migration/m20240101_000001_create_tables.rs
use sea_orm_migration::prelude::*;

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20240101_000001_create_tables"
    }
}

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Создание таблицы genres
        manager
            .create_table(
                Table::create()
                    .table(Genres::Table)
                    .col(ColumnDef::new(Genres::Id).integer().not_null().auto_increment().primary_key())
                    .col(ColumnDef::new(Genres::Name).text().not_null().unique())
                    .col(ColumnDef::new(Genres::CreatedAt).text().default(Expr::current_timestamp()))
                    .to_owned(),
            )
            .await?;
        
        // Аналогично для остальных таблиц...
        
        Ok(())
    }
}
```

---

## Сравнение: sqlx vs SeaORM

| Характеристика | sqlx (оригинал) | SeaORM (адаптация) |
|---|---|---|
| **Тип запросов** | Raw SQL + макросы | Query builder + Active Record |
| **Compile-time** | Да (проверка SQL) | Runtime (проверка типов) |
| **Relations** | Ручные JOIN | Автоматические связи |
| **Миграции** | sqlx-cli | sea-orm-migration |
| **Models** | Ручные структуры | DeriveEntityModel макрос |
| **Производительность** | ★★★★★ | ★★★★ |
| **Сложность** | ★★ | ★★★ |

---

## Заключение

SeaORM предоставляет:
- **Удобные Relations** для связи игр с жанрами, авторами
- **Active Record** паттерн для простых CRUD операций
- **Типобезопасность** через строгую систему типов Rust
- **Миграции** с версионированием схемы

Для проекта Games Keeper с 5+ таблицами и сложными связями, SeaORM значительно упростит поддержку кода.
