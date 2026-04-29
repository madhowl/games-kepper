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
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}