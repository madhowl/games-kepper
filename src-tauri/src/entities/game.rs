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
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}