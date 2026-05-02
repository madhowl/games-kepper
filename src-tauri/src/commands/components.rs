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
pub struct ComponentType {
    pub id: i64,
    pub name: String,
    pub base_type: String,
    pub parent_type_id: Option<i64>,
    pub field_schema: String,
    pub icon: Option<String>,
    pub color: String,
    pub is_system: bool,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameComponent {
    pub id: i64,
    pub game_id: i64,
    pub component_type_id: i64,
    pub name: String,
    pub quantity: i32,
    pub data: String,
    pub images: String,
    pub notes: Option<String>,
    pub sort_order: i32,
    pub created_at: String,
    pub updated_at: String,
}

impl GameComponent {
    fn from_row(row: &sqlx::sqlite::SqliteRow) -> Self {
        Self {
            id: row.get("id"),
            game_id: row.get("game_id"),
            component_type_id: row.get("component_type_id"),
            name: row.get("name"),
            quantity: row.get("quantity"),
            data: row.get("data"),
            images: row.get("images"),
            notes: row.get("notes"),
            sort_order: row.get("sort_order"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        }
    }
}

impl ComponentType {
    fn from_row(row: &sqlx::sqlite::SqliteRow) -> Self {
        Self {
            id: row.get("id"),
            name: row.get("name"),
            base_type: row.get("base_type"),
            parent_type_id: row.get("parent_type_id"),
            field_schema: row.get("field_schema"),
            icon: row.get("icon"),
            color: row.get("color"),
            is_system: row.get("is_system"),
            created_at: row.get("created_at"),
        }
    }
}

fn seed_component_types(pool: &SqlitePool) -> Result<(), String> {
    let templates = vec![
        ("Стандартная карта", "card", r#"{"width": 63, "height": 88, "fields": [{"name": "cost", "type": "integer", "default": 0}, {"name": "type", "type": "string", "default": ""}]}"#, "🃏", "#3b82f6"),
        ("Фишка", "token", r#"{"width": 20, "height": 20, "fields": [{"name": "value", "type": "integer", "default": 1}]}"#, "🪙", "#f59e0b"),
        ("Игровое поле", "board", r#"{"width": 297, "height": 420, "fields": [{"name": "grid", "type": "string", "default": "none"}]}"#, "🗺️", "#10b981"),
        ("Кубик d6", "dice", r#"{"width": 15, "height": 15, "fields": []}"#, "🎲", "#ef4444"),
        ("Правила", "rulebook", r#"{"width": 148, "height": 210, "fields": []}"#, "📖", "#8b5cf6"),
        ("Плитка", "tile", r#"{"width": 40, "height": 40, "fields": [{"name": "terrain", "type": "string", "default": ""}]}"#, "⬜", "#6b7280"),
        ("Миниатюра", "miniature", r#"{"width": 25, "height": 25, "fields": []}"#, "♟️", "#ec4899"),
        ("Маркер", "marker", r#"{"width": 10, "height": 10, "fields": [{"name": "color", "type": "string", "default": "red"}]}"#, "🏷️", "#14b8a6"),
    ];

    for (name, base_type, field_schema, icon, color) in templates {
        let _ = sqlx::query(
            "INSERT OR IGNORE INTO component_types (name, base_type, field_schema, icon, color, is_system) VALUES (?, ?, ?, ?, ?, 1)"
        ).bind(name).bind(base_type).bind(field_schema).bind(icon).bind(color).execute(pool);
    }
    
    Ok(())
}

#[tauri::command]
pub async fn get_component_types(state: State<'_, AppState>) -> Result<Vec<ComponentType>, String> {
    let pool = get_db(&state).await?;
    
    let _ = seed_component_types(&pool);
    
    let rows = sqlx::query("SELECT id, name, base_type, parent_type_id, field_schema, icon, color, is_system, created_at FROM component_types ORDER BY is_system DESC, name")
        .fetch_all(&pool).await.map_err(|e| e.to_string())?;
    
    Ok(rows.iter().map(|r| ComponentType::from_row(r)).collect())
}

#[tauri::command]
pub async fn create_component_type(state: State<'_, AppState>, dto: CreateComponentTypeDto) -> Result<ComponentType, String> {
    let pool = get_db(&state).await?;
    
    let field_schema = dto.field_schema.unwrap_or_else(|| "{}".to_string());
    let color = dto.color.unwrap_or_else(|| "#6366f1".to_string());
    
    let result = sqlx::query(
        "INSERT INTO component_types (name, base_type, field_schema, icon, color, is_system, created_at) VALUES (?, ?, ?, ?, ?, 0, datetime('now')) RETURNING id, name, base_type, parent_type_id, field_schema, icon, color, is_system, created_at"
    ).bind(&dto.name).bind(&dto.base_type).bind(&field_schema).bind(&dto.icon).bind(&color).fetch_one(&pool).await.map_err(|e| e.to_string())?;
    
    Ok(ComponentType::from_row(&result))
}

#[tauri::command]
pub async fn update_component_type(state: State<'_, AppState>, id: i64, dto: UpdateComponentTypeDto) -> Result<ComponentType, String> {
    let pool = get_db(&state).await?;
    
    if let Some(name) = &dto.name {
        sqlx::query("UPDATE component_types SET name = ? WHERE id = ?")
            .bind(name).bind(id).execute(&pool).await.map_err(|e| e.to_string())?;
    }
    if let Some(field_schema) = &dto.field_schema {
        sqlx::query("UPDATE component_types SET field_schema = ? WHERE id = ?")
            .bind(field_schema).bind(id).execute(&pool).await.map_err(|e| e.to_string())?;
    }
    if let Some(icon) = &dto.icon {
        sqlx::query("UPDATE component_types SET icon = ? WHERE id = ?")
            .bind(icon).bind(id).execute(&pool).await.map_err(|e| e.to_string())?;
    }
    if let Some(color) = &dto.color {
        sqlx::query("UPDATE component_types SET color = ? WHERE id = ?")
            .bind(color).bind(id).execute(&pool).await.map_err(|e| e.to_string())?;
    }
    
    let result = sqlx::query("SELECT id, name, base_type, parent_type_id, field_schema, icon, color, is_system, created_at FROM component_types WHERE id = ?")
        .bind(id).fetch_one(&pool).await.map_err(|e| e.to_string())?;
    
    Ok(ComponentType::from_row(&result))
}

#[tauri::command]
pub async fn delete_component_type(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    let pool = get_db(&state).await?;
    
    sqlx::query("DELETE FROM component_types WHERE id = ? AND is_system = 0")
        .bind(id).execute(&pool).await.map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub async fn get_game_components(state: State<'_, AppState>, game_id: i64) -> Result<Vec<GameComponent>, String> {
    let pool = get_db(&state).await?;
    
    let rows = sqlx::query(
        "SELECT id, game_id, component_type_id, name, quantity, data, images, notes, sort_order, created_at, updated_at FROM game_components WHERE game_id = ? ORDER BY sort_order, name"
    ).bind(game_id).fetch_all(&pool).await.map_err(|e| e.to_string())?;
    
    Ok(rows.iter().map(|r| GameComponent::from_row(r)).collect())
}

#[tauri::command]
pub async fn create_game_component(state: State<'_, AppState>, dto: CreateGameComponentDto) -> Result<GameComponent, String> {
    let pool = get_db(&state).await?;
    
    let data = dto.data.unwrap_or_else(|| "{}".to_string());
    let images = dto.images.unwrap_or_else(|| "[]".to_string());
    let quantity = dto.quantity.unwrap_or(1);
    
    let result = sqlx::query(
        "INSERT INTO game_components (game_id, component_type_id, name, quantity, data, images, notes, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 0, datetime('now'), datetime('now')) RETURNING id, game_id, component_type_id, name, quantity, data, images, notes, sort_order, created_at, updated_at"
    ).bind(dto.game_id).bind(dto.component_type_id).bind(&dto.name).bind(quantity).bind(&data).bind(&images).bind(&dto.notes).fetch_one(&pool).await.map_err(|e| e.to_string())?;
    
    Ok(GameComponent::from_row(&result))
}

#[tauri::command]
pub async fn update_game_component(state: State<'_, AppState>, id: i64, dto: UpdateGameComponentDto) -> Result<GameComponent, String> {
    let pool = get_db(&state).await?;
    
    if let Some(name) = &dto.name {
        sqlx::query("UPDATE game_components SET name = ? WHERE id = ?")
            .bind(name).bind(id).execute(&pool).await.map_err(|e| e.to_string())?;
    }
    if let Some(quantity) = dto.quantity {
        sqlx::query("UPDATE game_components SET quantity = ? WHERE id = ?")
            .bind(quantity).bind(id).execute(&pool).await.map_err(|e| e.to_string())?;
    }
    if let Some(data) = &dto.data {
        sqlx::query("UPDATE game_components SET data = ? WHERE id = ?")
            .bind(data).bind(id).execute(&pool).await.map_err(|e| e.to_string())?;
    }
    if let Some(images) = &dto.images {
        sqlx::query("UPDATE game_components SET images = ? WHERE id = ?")
            .bind(images).bind(id).execute(&pool).await.map_err(|e| e.to_string())?;
    }
    if let Some(notes) = &dto.notes {
        sqlx::query("UPDATE game_components SET notes = ? WHERE id = ?")
            .bind(notes).bind(id).execute(&pool).await.map_err(|e| e.to_string())?;
    }
    if let Some(sort_order) = dto.sort_order {
        sqlx::query("UPDATE game_components SET sort_order = ? WHERE id = ?")
            .bind(sort_order).bind(id).execute(&pool).await.map_err(|e| e.to_string())?;
    }
    
    let result = sqlx::query("SELECT id, game_id, component_type_id, name, quantity, data, images, notes, sort_order, created_at, updated_at FROM game_components WHERE id = ?")
        .bind(id).fetch_one(&pool).await.map_err(|e| e.to_string())?;
    
    Ok(GameComponent::from_row(&result))
}

#[tauri::command]
pub async fn delete_game_component(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    let pool = get_db(&state).await?;
    
    sqlx::query("DELETE FROM game_components WHERE id = ?")
        .bind(id).execute(&pool).await.map_err(|e| e.to_string())?;
    
    Ok(())
}