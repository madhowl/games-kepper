use sqlx::SqlitePool;
use tauri::State;
use serde::{Deserialize, Serialize};

use crate::models::dto::*;
use crate::AppState;
use sqlx::Row;

async fn get_db(state: &State<'_, AppState>) -> Result<SqlitePool, String> {
    let db_lock = state.db.lock().await;
    db_lock.clone().ok_or_else(|| "Database not initialized".to_string())
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameRow {
    pub id: i64,
    pub parent_id: Option<i64>,
    pub series_id: Option<i64>,
    pub node_type: String,
    pub sort_order: i32,
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
    pub cover_image: Option<String>,
    pub bgg_id: Option<i32>,
    pub barcode: Option<String>,
    pub language: String,
    pub status: String,
    pub condition: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

impl GameRow {
    fn from_row(row: &sqlx::sqlite::SqliteRow) -> Self {
        Self {
            id: row.get("id"),
            parent_id: row.get("parent_id"),
            series_id: row.get("series_id"),
            node_type: row.get("node_type"),
            sort_order: row.get("sort_order"),
            title: row.get("title"),
            original_title: row.get("original_title"),
            description: row.get("description"),
            year_published: row.get("year_published"),
            min_players: row.get("min_players"),
            max_players: row.get("max_players"),
            min_age: row.get("min_age"),
            play_time_min: row.get("play_time_min"),
            play_time_max: row.get("play_time_max"),
            difficulty: row.get("difficulty"),
            cover_image: row.get("cover_image"),
            bgg_id: row.get("bgg_id"),
            barcode: row.get("barcode"),
            language: row.get("language"),
            status: row.get("status"),
            condition: row.get("condition"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenreRow {
    pub id: i64,
    pub name: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthorRow {
    pub id: i64,
    pub name: String,
    pub bio: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PublisherRow {
    pub id: i64,
    pub name: String,
    pub country: Option<String>,
    pub website: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SeriesRow {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub image_path: Option<String>,
    pub created_at: String,
}

fn build_tree(games: Vec<GameRow>, parent_id: Option<i64>) -> Vec<GameNode> {
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
            children: build_tree(games.clone(), Some(g.id)),
        })
        .collect()
}

#[tauri::command]
pub async fn get_games_tree(state: State<'_, AppState>) -> Result<Vec<GameNode>, String> {
    let pool = get_db(&state).await?;
    
    let rows = sqlx::query(
        "SELECT id, parent_id, series_id, node_type, sort_order, title, original_title, description, year_published, min_players, max_players, min_age, play_time_min, play_time_max, difficulty, cover_image, bgg_id, barcode, language, status, condition, created_at, updated_at FROM games ORDER BY sort_order, title"
    ).fetch_all(&pool).await.map_err(|e| e.to_string())?;
    
    let games: Vec<GameRow> = rows.iter().map(|r| GameRow::from_row(r)).collect();
    Ok(build_tree(games, None))
}

#[tauri::command]
pub async fn get_genres(state: State<'_, AppState>) -> Result<Vec<GenreRow>, String> {
    let pool = get_db(&state).await?;
    
    let rows = sqlx::query("SELECT id, name, created_at FROM genres ORDER BY name")
        .fetch_all(&pool).await.map_err(|e| e.to_string())?;
    
    Ok(rows.iter().map(|r| GenreRow {
        id: r.get("id"),
        name: r.get("name"),
        created_at: r.get("created_at"),
    }).collect())
}

#[tauri::command]
pub async fn create_genre(state: State<'_, AppState>, dto: CreateGenreDto) -> Result<GenreRow, String> {
    let pool = get_db(&state).await?;
    
    let result = sqlx::query(
        "INSERT INTO genres (name, created_at) VALUES (?, datetime('now')) RETURNING id, name, created_at"
    ).bind(&dto.name).fetch_one(&pool).await.map_err(|e| e.to_string())?;
    
    Ok(GenreRow {
        id: result.get("id"),
        name: result.get("name"),
        created_at: result.get("created_at"),
    })
}

#[tauri::command]
pub async fn get_authors(state: State<'_, AppState>) -> Result<Vec<AuthorRow>, String> {
    let pool = get_db(&state).await?;
    
    let rows = sqlx::query("SELECT id, name, bio, created_at FROM authors ORDER BY name")
        .fetch_all(&pool).await.map_err(|e| e.to_string())?;
    
    Ok(rows.iter().map(|r| AuthorRow {
        id: r.get("id"),
        name: r.get("name"),
        bio: r.get("bio"),
        created_at: r.get("created_at"),
    }).collect())
}

#[tauri::command]
pub async fn create_author(state: State<'_, AppState>, dto: CreateAuthorDto) -> Result<AuthorRow, String> {
    let pool = get_db(&state).await?;
    
    let result = sqlx::query(
        "INSERT INTO authors (name, bio, created_at) VALUES (?, ?, datetime('now')) RETURNING id, name, bio, created_at"
    ).bind(&dto.name).bind(&dto.bio).fetch_one(&pool).await.map_err(|e| e.to_string())?;
    
    Ok(AuthorRow {
        id: result.get("id"),
        name: result.get("name"),
        bio: result.get("bio"),
        created_at: result.get("created_at"),
    })
}

#[tauri::command]
pub async fn get_publishers(state: State<'_, AppState>) -> Result<Vec<PublisherRow>, String> {
    let pool = get_db(&state).await?;
    
    let rows = sqlx::query("SELECT id, name, country, website, created_at FROM publishers ORDER BY name")
        .fetch_all(&pool).await.map_err(|e| e.to_string())?;
    
    Ok(rows.iter().map(|r| PublisherRow {
        id: r.get("id"),
        name: r.get("name"),
        country: r.get("country"),
        website: r.get("website"),
        created_at: r.get("created_at"),
    }).collect())
}

#[tauri::command]
pub async fn create_publisher(state: State<'_, AppState>, dto: CreatePublisherDto) -> Result<PublisherRow, String> {
    let pool = get_db(&state).await?;
    
    let result = sqlx::query(
        "INSERT INTO publishers (name, country, website, created_at) VALUES (?, ?, ?, datetime('now')) RETURNING id, name, country, website, created_at"
    ).bind(&dto.name).bind(&dto.country).bind(&dto.website).fetch_one(&pool).await.map_err(|e| e.to_string())?;
    
    Ok(PublisherRow {
        id: result.get("id"),
        name: result.get("name"),
        country: result.get("country"),
        website: result.get("website"),
        created_at: result.get("created_at"),
    })
}

#[tauri::command]
pub async fn get_series(state: State<'_, AppState>) -> Result<Vec<SeriesRow>, String> {
    let pool = get_db(&state).await?;
    
    let rows = sqlx::query("SELECT id, name, description, image_path, created_at FROM series ORDER BY name")
        .fetch_all(&pool).await.map_err(|e| e.to_string())?;
    
    Ok(rows.iter().map(|r| SeriesRow {
        id: r.get("id"),
        name: r.get("name"),
        description: r.get("description"),
        image_path: r.get("image_path"),
        created_at: r.get("created_at"),
    }).collect())
}

#[tauri::command]
pub async fn create_series(state: State<'_, AppState>, dto: CreateSeriesDto) -> Result<SeriesRow, String> {
    let pool = get_db(&state).await?;
    
    let result = sqlx::query(
        "INSERT INTO series (name, description, created_at) VALUES (?, ?, datetime('now')) RETURNING id, name, description, image_path, created_at"
    ).bind(&dto.name).bind(&dto.description).fetch_one(&pool).await.map_err(|e| e.to_string())?;
    
    Ok(SeriesRow {
        id: result.get("id"),
        name: result.get("name"),
        description: result.get("description"),
        image_path: result.get("image_path"),
        created_at: result.get("created_at"),
    })
}

#[tauri::command]
pub async fn create_game(state: State<'_, AppState>, dto: CreateGameDto) -> Result<GameRow, String> {
    let pool = get_db(&state).await?;
    
    let result = sqlx::query(
        r#"INSERT INTO games (parent_id, series_id, node_type, sort_order, title, original_title, description, year_published, min_players, max_players, min_age, play_time_min, play_time_max, difficulty, cover_image, bgg_id, barcode, language, status, condition, created_at, updated_at)
        VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ru', ?, datetime('now'), datetime('now')) 
        RETURNING id, parent_id, series_id, node_type, sort_order, title, original_title, description, year_published, min_players, max_players, min_age, play_time_min, play_time_max, difficulty, cover_image, bgg_id, barcode, language, status, condition, created_at, updated_at"#
    )
    .bind(&dto.parent_id)
    .bind(&dto.series_id)
    .bind(&dto.node_type)
    .bind(&dto.title)
    .bind(&dto.original_title)
    .bind(&dto.description)
    .bind(&dto.year_published)
    .bind(&dto.min_players)
    .bind(&dto.max_players)
    .bind(&dto.min_age)
    .bind(&dto.play_time_min)
    .bind(&dto.play_time_max)
    .bind(&dto.difficulty)
    .bind(&dto.status)
    .fetch_one(&pool).await.map_err(|e| e.to_string())?;
    
    let game_id: i64 = result.get("id");
    
    for genre_id in &dto.genre_ids {
        sqlx::query("INSERT INTO game_genres (game_id, genre_id) VALUES (?, ?)")
            .bind(game_id).bind(genre_id).execute(&pool).await.map_err(|e| e.to_string())?;
    }
    
    for author_id in &dto.author_ids {
        sqlx::query("INSERT INTO game_authors (game_id, author_id, role) VALUES (?, ?, 'designer')")
            .bind(game_id).bind(author_id).execute(&pool).await.map_err(|e| e.to_string())?;
    }
    
    for publisher_id in &dto.publisher_ids {
        sqlx::query("INSERT INTO game_publishers (game_id, publisher_id, is_primary) VALUES (?, ?, 1)")
            .bind(game_id).bind(publisher_id).execute(&pool).await.map_err(|e| e.to_string())?;
    }
    
    Ok(GameRow::from_row(&result))
}

#[tauri::command]
pub async fn update_game(state: State<'_, AppState>, id: i64, dto: CreateGameDto) -> Result<GameRow, String> {
    let pool = get_db(&state).await?;
    
    sqlx::query(
        "UPDATE games SET title = ?, original_title = ?, description = ?, year_published = ?, min_players = ?, max_players = ?, min_age = ?, play_time_min = ?, play_time_max = ?, difficulty = ?, status = ?, updated_at = datetime('now') WHERE id = ?"
    ).bind(&dto.title).bind(&dto.original_title).bind(&dto.description).bind(&dto.year_published).bind(&dto.min_players).bind(&dto.max_players).bind(&dto.min_age).bind(&dto.play_time_min).bind(&dto.play_time_max).bind(&dto.difficulty).bind(&dto.status).bind(id).execute(&pool).await.map_err(|e| e.to_string())?;
    
    let result = sqlx::query("SELECT * FROM games WHERE id = ?").bind(id).fetch_one(&pool).await.map_err(|e| e.to_string())?;
    Ok(GameRow::from_row(&result))
}

#[tauri::command]
pub async fn delete_game(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    let pool = get_db(&state).await?;
    
    sqlx::query("DELETE FROM games WHERE id = ?").bind(id).execute(&pool).await.map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn move_game(state: State<'_, AppState>, id: i64, dto: MoveGameDto) -> Result<(), String> {
    let pool = get_db(&state).await?;
    
    sqlx::query(
        "UPDATE games SET parent_id = ?, sort_order = ?, updated_at = datetime('now') WHERE id = ?"
    ).bind(dto.new_parent_id).bind(dto.sort_order).bind(id).execute(&pool).await.map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn search_games(state: State<'_, AppState>, query: String, limit: i64) -> Result<Vec<GameRow>, String> {
    let pool = get_db(&state).await?;
    
    let pattern = format!("%{}%", query);
    
    let rows = sqlx::query(
        "SELECT * FROM games WHERE title LIKE ? OR original_title LIKE ? ORDER BY title LIMIT ?"
    ).bind(&pattern).bind(&pattern).bind(limit).fetch_all(&pool).await.map_err(|e| e.to_string())?;
    
    Ok(rows.iter().map(|r| GameRow::from_row(r)).collect())
}

#[tauri::command]
pub async fn export_database(state: State<'_, AppState>) -> Result<String, String> {
    let pool = get_db(&state).await?;
    
    let rows = sqlx::query("SELECT * FROM games").fetch_all(&pool).await.map_err(|e| e.to_string())?;
    let games: Vec<GameRow> = rows.iter().map(|r| GameRow::from_row(r)).collect();
    
    serde_json::to_string_pretty(&games).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn import_database(state: State<'_, AppState>, json_data: String) -> Result<(), String> {
    #[derive(Deserialize)]
    struct ImportData {
        games: Vec<GameRow>,
    }
    
    let data: ImportData = serde_json::from_str(&json_data).map_err(|e| e.to_string())?;
    let pool = get_db(&state).await?;
    
    for game in data.games {
        sqlx::query(
            r#"INSERT INTO games (parent_id, series_id, node_type, sort_order, title, original_title, description, year_published, min_players, max_players, min_age, play_time_min, play_time_max, difficulty, cover_image, bgg_id, barcode, language, status, condition, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"#
        ).bind(game.parent_id).bind(game.series_id).bind(&game.node_type).bind(game.sort_order).bind(&game.title).bind(&game.original_title).bind(&game.description).bind(game.year_published).bind(game.min_players).bind(game.max_players).bind(game.min_age).bind(game.play_time_min).bind(game.play_time_max).bind(game.difficulty).bind(&game.cover_image).bind(game.bgg_id).bind(&game.barcode).bind(&game.language).bind(&game.status).bind(&game.condition).bind(&game.created_at).bind(&game.updated_at).execute(&pool).await.map_err(|e| e.to_string())?;
    }
    
    Ok(())
}