use sea_orm::{DbConn, EntityTrait, Order, QueryOrder, Set, ActiveModelTrait, ColumnTrait, QueryFilter, QuerySelect};
use tauri::State;
use serde::{Deserialize, Serialize};

use crate::entities::game::{self, Entity as GameEntity};
use crate::entities::genre::{self, Entity as GenreEntity};
use crate::entities::author::{self, Entity as AuthorEntity};
use crate::entities::publisher::{self, Entity as PublisherEntity};
use crate::entities::series::{self, Entity as SeriesEntity};
use crate::entities::game_genres;
use crate::entities::game_authors;
use crate::entities::game_publishers;
use crate::models::dto::*;
use crate::AppState;

async fn get_db(state: &State<'_, AppState>) -> Result<DbConn, String> {
    let db_lock = state.db.lock().await;
    db_lock.clone().ok_or_else(|| "Database not initialized".to_string())
}

fn build_tree(games: Vec<game::Model>, parent_id: Option<i64>) -> Vec<GameNode> {
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
    let db = get_db(&state).await?;
    
    let games = GameEntity::find()
        .order_by(game::Column::SortOrder, Order::Asc)
        .order_by(game::Column::Title, Order::Asc)
        .all(&db)
        .await
        .map_err(|e| e.to_string())?;
    
    Ok(build_tree(games, None))
}

#[tauri::command]
pub async fn get_genres(state: State<'_, AppState>) -> Result<Vec<genre::Model>, String> {
    let db = get_db(&state).await?;
    
    GenreEntity::find()
        .order_by(genre::Column::Name, Order::Asc)
        .all(&db)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_genre(state: State<'_, AppState>, dto: CreateGenreDto) -> Result<genre::Model, String> {
    let db = get_db(&state).await?;
    
    let active_model = genre::ActiveModel {
        name: Set(dto.name),
        created_at: Set(chrono::Utc::now().to_rfc3339()),
        ..Default::default()
    };
    
    active_model.insert(&db)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_authors(state: State<'_, AppState>) -> Result<Vec<author::Model>, String> {
    let db = get_db(&state).await?;
    
    AuthorEntity::find()
        .order_by(author::Column::Name, Order::Asc)
        .all(&db)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_author(state: State<'_, AppState>, dto: CreateAuthorDto) -> Result<author::Model, String> {
    let db = get_db(&state).await?;
    
    let active_model = author::ActiveModel {
        name: Set(dto.name),
        bio: Set(dto.bio),
        created_at: Set(chrono::Utc::now().to_rfc3339()),
        ..Default::default()
    };
    
    active_model.insert(&db)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_publishers(state: State<'_, AppState>) -> Result<Vec<publisher::Model>, String> {
    let db = get_db(&state).await?;
    
    PublisherEntity::find()
        .order_by(publisher::Column::Name, Order::Asc)
        .all(&db)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_publisher(state: State<'_, AppState>, dto: CreatePublisherDto) -> Result<publisher::Model, String> {
    let db = get_db(&state).await?;
    
    let active_model = publisher::ActiveModel {
        name: Set(dto.name),
        country: Set(dto.country),
        website: Set(dto.website),
        created_at: Set(chrono::Utc::now().to_rfc3339()),
        ..Default::default()
    };
    
    active_model.insert(&db)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_series(state: State<'_, AppState>) -> Result<Vec<series::Model>, String> {
    let db = get_db(&state).await?;
    
    SeriesEntity::find()
        .order_by(series::Column::Name, Order::Asc)
        .all(&db)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_series(state: State<'_, AppState>, dto: CreateSeriesDto) -> Result<series::Model, String> {
    let db = get_db(&state).await?;
    
    let active_model = series::ActiveModel {
        name: Set(dto.name),
        description: Set(dto.description),
        created_at: Set(chrono::Utc::now().to_rfc3339()),
        ..Default::default()
    };
    
    active_model.insert(&db)
        .await
        .map_err(|e| e.to_string())
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
    
    let game = active_model.insert(&db).await.map_err(|e| e.to_string())?;
    
    for genre_id in &dto.genre_ids {
        let gg_active = game_genres::ActiveModel {
            game_id: Set(game.id),
            genre_id: Set(*genre_id),
            ..Default::default()
        };
        gg_active.insert(&db).await.map_err(|e| e.to_string())?;
    }
    
    for author_id in &dto.author_ids {
        let ga_active = game_authors::ActiveModel {
            game_id: Set(game.id),
            author_id: Set(*author_id),
            role: Set("designer".to_string()),
            ..Default::default()
        };
        ga_active.insert(&db).await.map_err(|e| e.to_string())?;
    }
    
    for publisher_id in &dto.publisher_ids {
        let gp_active = game_publishers::ActiveModel {
            game_id: Set(game.id),
            publisher_id: Set(*publisher_id),
            is_primary: Set(true),
            ..Default::default()
        };
        gp_active.insert(&db).await.map_err(|e| e.to_string())?;
    }
    
    Ok(game)
}

#[tauri::command]
pub async fn update_game(state: State<'_, AppState>, id: i64, dto: UpdateGameDto) -> Result<game::Model, String> {
    let db = get_db(&state).await?;
    
    let game = GameEntity::find_by_id(id)
        .one(&db)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Game not found".to_string())?;
    
    let mut active_model: game::ActiveModel = game.into();
    
    if let Some(title) = dto.title {
        active_model.title = Set(title);
    }
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
    if let Some(status) = dto.status {
        active_model.status = Set(status);
    }
    if let Some(condition) = dto.condition {
        active_model.condition = Set(Some(condition));
    }
    if let Some(cover_image) = dto.cover_image {
        active_model.cover_image = Set(Some(cover_image));
    }
    if let Some(parent_id) = dto.parent_id {
        active_model.parent_id = Set(Some(parent_id));
    }
    if let Some(series_id) = dto.series_id {
        active_model.series_id = Set(Some(series_id));
    }
    if let Some(node_type) = dto.node_type {
        active_model.node_type = Set(node_type);
    }
    if let Some(bgg_id) = dto.bgg_id {
        active_model.bgg_id = Set(Some(bgg_id));
    }
    if let Some(barcode) = dto.barcode {
        active_model.barcode = Set(Some(barcode));
    }
    if let Some(language) = dto.language {
        active_model.language = Set(language);
    }
    
    active_model.updated_at = Set(chrono::Utc::now().to_rfc3339());
    
    active_model.update(&db).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_game(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    let db = get_db(&state).await?;
    
    GameEntity::delete_by_id(id)
        .exec(&db)
        .await
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub async fn move_game(state: State<'_, AppState>, id: i64, dto: MoveGameDto) -> Result<game::Model, String> {
    let db = get_db(&state).await?;
    
    let game = GameEntity::find_by_id(id)
        .one(&db)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Game not found".to_string())?;
    
    let mut active_model: game::ActiveModel = game.into();
    active_model.parent_id = Set(dto.new_parent_id);
    active_model.sort_order = Set(dto.sort_order);
    active_model.updated_at = Set(chrono::Utc::now().to_rfc3339());
    
    active_model.update(&db).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn search_games(state: State<'_, AppState>, query: String, limit: i64) -> Result<Vec<game::Model>, String> {
    let db = get_db(&state).await?;
    
    let search_pattern = format!("%{}%", query);
    
    GameEntity::find()
        .filter(
            game::Column::Title.like(&search_pattern)
            .or(game::Column::OriginalTitle.like(&search_pattern))
        )
        .order_by(game::Column::Title, Order::Asc)
        .limit(limit as u64)
        .all(&db)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn export_database(state: State<'_, AppState>) -> Result<String, String> {
    let db = get_db(&state).await?;
    
    let games = GameEntity::find()
        .all(&db)
        .await
        .map_err(|e| e.to_string())?;
    
    let genres = GenreEntity::find()
        .all(&db)
        .await
        .map_err(|e| e.to_string())?;
    
    let authors = AuthorEntity::find()
        .all(&db)
        .await
        .map_err(|e| e.to_string())?;
    
    let publishers = PublisherEntity::find()
        .all(&db)
        .await
        .map_err(|e| e.to_string())?;
    
    let series = SeriesEntity::find()
        .all(&db)
        .await
        .map_err(|e| e.to_string())?;
    
    #[derive(Serialize)]
    struct ExportData {
        games: Vec<game::Model>,
        genres: Vec<genre::Model>,
        authors: Vec<author::Model>,
        publishers: Vec<publisher::Model>,
        series: Vec<series::Model>,
    }
    
    let export_data = ExportData {
        games,
        genres,
        authors,
        publishers,
        series,
    };
    
    serde_json::to_string_pretty(&export_data)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn import_database(state: State<'_, AppState>, json_data: String) -> Result<(), String> {
    #[derive(Deserialize)]
    struct ImportData {
        games: Vec<game::Model>,
        genres: Vec<genre::Model>,
        authors: Vec<author::Model>,
        publishers: Vec<publisher::Model>,
        series: Vec<series::Model>,
    }
    
    let data: ImportData = serde_json::from_str(&json_data)
        .map_err(|e| e.to_string())?;
    
    let db = get_db(&state).await?;
    
    for genre in data.genres {
        let active = genre::ActiveModel {
            name: Set(genre.name),
            created_at: Set(genre.created_at),
            ..Default::default()
        };
        let _ = genre::ActiveModel::insert(active, &db).await;
    }
    
    for author in data.authors {
        let active = author::ActiveModel {
            name: Set(author.name),
            bio: Set(author.bio),
            created_at: Set(author.created_at),
            ..Default::default()
        };
        let _ = author::ActiveModel::insert(active, &db).await;
    }
    
    for publisher in data.publishers {
        let active = publisher::ActiveModel {
            name: Set(publisher.name),
            country: Set(publisher.country),
            website: Set(publisher.website),
            created_at: Set(publisher.created_at),
            ..Default::default()
        };
        let _ = publisher::ActiveModel::insert(active, &db).await;
    }
    
    for s in data.series {
        let active = series::ActiveModel {
            name: Set(s.name),
            description: Set(s.description),
            created_at: Set(s.created_at),
            ..Default::default()
        };
        let _ = series::ActiveModel::insert(active, &db).await;
    }
    
    for game in data.games {
        let active = game::ActiveModel {
            parent_id: Set(game.parent_id),
            series_id: Set(game.series_id),
            node_type: Set(game.node_type),
            sort_order: Set(game.sort_order),
            title: Set(game.title),
            original_title: Set(game.original_title),
            description: Set(game.description),
            year_published: Set(game.year_published),
            min_players: Set(game.min_players),
            max_players: Set(game.max_players),
            min_age: Set(game.min_age),
            play_time_min: Set(game.play_time_min),
            play_time_max: Set(game.play_time_max),
            difficulty: Set(game.difficulty),
            cover_image: Set(game.cover_image),
            bgg_id: Set(game.bgg_id),
            barcode: Set(game.barcode),
            language: Set(game.language),
            status: Set(game.status),
            condition: Set(game.condition),
            created_at: Set(game.created_at),
            updated_at: Set(game.updated_at),
            ..Default::default()
        };
        let _ = game::ActiveModel::insert(active, &db).await;
    }
    
    Ok(())
}