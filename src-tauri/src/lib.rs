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
    "#;
    
    let mut conn = pool.acquire().await?;
    conn.execute(sql).await?;
    info!("[DB] Migrations run");
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
            commands::get_genres,
            commands::create_genre,
            commands::get_authors,
            commands::create_author,
            commands::get_publishers,
            commands::create_publisher,
            commands::get_series,
            commands::create_series,
            commands::export_database,
            commands::import_database,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}