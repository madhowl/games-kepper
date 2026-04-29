use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "game_publishers")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub game_id: i64,
    #[sea_orm(primary_key, auto_increment = false)]
    pub publisher_id: i64,
    #[sea_orm(default = true)]
    pub is_primary: bool,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}