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
    pub parent_id: Option<i64>,
    pub series_id: Option<i64>,
    pub node_type: Option<String>,
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
    pub condition: Option<String>,
    pub cover_image: Option<String>,
    pub bgg_id: Option<i32>,
    pub barcode: Option<String>,
    pub language: Option<String>,
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

#[derive(Debug, Serialize, Deserialize)]
pub struct MoveGameDto {
    pub new_parent_id: Option<i64>,
    pub sort_order: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateGenreDto {
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateAuthorDto {
    pub name: String,
    pub bio: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreatePublisherDto {
    pub name: String,
    pub country: Option<String>,
    pub website: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateSeriesDto {
    pub name: String,
    pub description: Option<String>,
}