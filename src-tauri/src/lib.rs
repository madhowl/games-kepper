#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use log::{error, info};
use sqlx::{sqlite::SqlitePoolOptions, SqlitePool, Connection, Executor};
use std::path::PathBuf;
use tauri::Manager;

mod commands;
mod models;

pub struct AppState {
    pub db: tokio::sync::Mutex<Option<SqlitePool>>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            db: tokio::sync::Mutex::new(None),
        }
    }
}

async fn run_migrations(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    let sql = r#"
CREATE TABLE IF NOT EXISTS genres (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL UNIQUE,
    created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS authors (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    bio         TEXT,
    created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS publishers (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    country     TEXT,
    website    TEXT,
    created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS series (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    description TEXT,
    image_path TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS games (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_id       INTEGER REFERENCES games(id) ON DELETE SET NULL,
    series_id       INTEGER REFERENCES series(id) ON DELETE SET NULL,
    node_type       TEXT NOT NULL DEFAULT 'game',
    sort_order      INTEGER DEFAULT 0,
    title           TEXT NOT NULL,
    original_title  TEXT,
    description    TEXT,
    year_published INTEGER,
    min_players   INTEGER,
    max_players   INTEGER,
    min_age       INTEGER,
    play_time_min INTEGER,
    play_time_max INTEGER,
    difficulty    REAL,
    cover_image   TEXT,
    bgg_id      INTEGER,
    barcode     TEXT,
    language    TEXT DEFAULT 'ru',
    status      TEXT DEFAULT 'owned',
    condition   TEXT,
    created_at   TEXT DEFAULT (datetime('now')),
    updated_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS game_genres (
    game_id  INTEGER REFERENCES games(id) ON DELETE CASCADE,
    genre_id INTEGER REFERENCES genres(id) ON DELETE CASCADE,
    PRIMARY KEY (game_id, genre_id)
);

CREATE TABLE IF NOT EXISTS game_authors (
    game_id   INTEGER REFERENCES games(id) ON DELETE CASCADE,
    author_id INTEGER REFERENCES authors(id) ON DELETE CASCADE,
    role      TEXT DEFAULT 'designer',
    PRIMARY KEY (game_id, author_id, role)
);

CREATE TABLE IF NOT EXISTS game_publishers (
    game_id      INTEGER REFERENCES games(id) ON DELETE CASCADE,
    publisher_id INTEGER REFERENCES publishers(id) ON DELETE CASCADE,
    is_primary  INTEGER DEFAULT 1,
    PRIMARY KEY (game_id, publisher_id)
);

-- Component types (конструктор форм)
CREATE TABLE IF NOT EXISTS component_types (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    name           TEXT NOT NULL,
    base_type      TEXT NOT NULL CHECK(base_type IN ('card', 'token', 'board', 'dice', 'rulebook', 'tile', 'miniature', 'marker', 'custom')),
    parent_type_id INTEGER REFERENCES component_types(id),
    field_schema   TEXT NOT NULL DEFAULT '{}',
    icon           TEXT,
    color          TEXT DEFAULT '#6366f1',
    is_system      INTEGER DEFAULT 0,
    created_at     TEXT DEFAULT (datetime('now'))
);

-- Game components (экземпляры)
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
    created_at        TEXT DEFAULT (datetime('now')),
    updated_at        TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_game_components_game ON game_components(game_id);
CREATE INDEX IF NOT EXISTS idx_game_components_type ON game_components(component_type_id);
    "#;
    
    let mut conn = pool.acquire().await?;
    conn.execute(sql).await?;
    
    let seed_sql = r#"
    INSERT OR IGNORE INTO component_types (name, base_type, field_schema, icon, color, is_system) VALUES 
    ('Стандартная карта', 'card', '{"width": 63, "height": 88, "fields": [{"name": "cost", "type": "integer", "default": 0}, {"name": "type", "type": "string", "default": ""}]}', '🃏', '#3b82f6', 1),
    ('Фишка', 'token', '{"width": 20, "height": 20, "fields": [{"name": "value", "type": "integer", "default": 1}]}', '🪙', '#f59e0b', 1),
    ('Игровое поле', 'board', '{"width": 297, "height": 420, "fields": [{"name": "grid", "type": "string", "default": "none"}]}', '🗺️', '#10b981', 1),
    ('Кубик d6', 'dice', '{"width": 15, "height": 15, "fields": []}', '🎲', '#ef4444', 1),
    ('Правила', 'rulebook', '{"width": 148, "height": 210, "fields": []}', '📖', '#8b5cf6', 1),
    ('Плитка', 'tile', '{"width": 40, "height": 40, "fields": [{"name": "terrain", "type": "string", "default": ""}]}', '⬜', '#6b7280', 1),
    ('Миниатюра', 'miniature', '{"width": 25, "height": 25, "fields": []}', '♟️', '#ec4899', 1),
    ('Маркер', 'marker', '{"width": 10, "height": 10, "fields": [{"name": "color", "type": "string", "default": "red"}]}', '🏷️', '#14b8a6', 1);
    "#;
    conn.execute(seed_sql).await?;
    
    info!("[DB] Migrations run with seed");
    Ok(())
}

fn get_data_dir() -> PathBuf {
    // Для AppImage используем XDG_DATA_HOME или ~/.local/share
    if let Ok(xdg) = std::env::var("APPIMAGE") {
        if xdg.is_empty() == false {
            // Мы внутри AppImage - используем домашнюю директорию
            if let Some(home) = dirs::home_dir() {
                return home.join(".local/share/games-keeper");
            }
        }
    }
    
    // Стандартный путь - рядом с исполняемым файлом
    std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|p| p.to_path_buf()))
        .unwrap_or_else(|| PathBuf::from("."))
        .join("data")
}

async fn init_db() -> Result<SqlitePool, sqlx::Error> {
    let data_dir = get_data_dir();
    let db_path = data_dir.join("collection.db");
    
    let db_dir = data_dir.clone();
    let db_url = format!("sqlite:{}?mode=rwc", db_path.display());
    
    info!("[DB] Opening database at: {}", db_path.display());
    
    std::fs::create_dir_all(&db_dir).expect("Failed to create data directory");
    
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect(&db_url).await?;
    
    run_migrations(&pool).await?;
    
    info!("[DB] Database connected");
    
    Ok(pool)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();
    
    tauri::Builder::default()
        .manage(AppState::default())
        .setup(|app| {
            let app_handle = app.handle().clone();

            #[cfg(target_os = "linux")]
            {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.set_title("Games Keeper");
                }
            }

            tauri::async_runtime::spawn(async move {
                match init_db().await {
                    Ok(pool) => {
                        let state = app_handle.state::<AppState>();
                        let mut lock = state.db.lock().await;
                        *lock = Some(pool);
                        info!("Database initialized");
                    }
                    Err(e) => {
                        error!("Database initialization error: {}", e);
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
            commands::get_game_details,
            commands::get_genres,
            commands::create_genre,
            commands::update_genre,
            commands::delete_genre,
            commands::get_authors,
            commands::create_author,
            commands::update_author,
            commands::delete_author,
            commands::get_publishers,
            commands::create_publisher,
            commands::update_publisher,
            commands::delete_publisher,
            commands::get_series,
            commands::create_series,
            commands::export_database,
            commands::import_database,
            commands::components::get_component_types,
            commands::components::create_component_type,
            commands::components::update_component_type,
            commands::components::delete_component_type,
            commands::components::get_game_components,
            commands::components::create_game_component,
            commands::components::update_game_component,
            commands::components::delete_game_component,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}