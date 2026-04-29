#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use log::{error, info};
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
    
    info!("[DB] Opening database at: {}", db_path.display());
    
    std::fs::create_dir_all(db_dir).expect("Failed to create data directory");
    
    let db = Database::connect(&db_url).await?;
    
    info!("[DB] Database connected");
    
    Ok(db)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();
    
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