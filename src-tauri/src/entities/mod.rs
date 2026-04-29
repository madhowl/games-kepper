pub mod author;
pub mod game;
pub mod game_authors;
pub mod game_genres;
pub mod game_publishers;
pub mod genre;
pub mod publisher;
pub mod series;

pub use author::Entity as AuthorEntity;
pub use game::Entity as GameEntity;
pub use game_authors::Entity as GameAuthorsEntity;
pub use game_genres::Entity as GameGenresEntity;
pub use game_publishers::Entity as GamePublishersEntity;
pub use genre::Entity as GenreEntity;
pub use publisher::Entity as PublisherEntity;
pub use series::Entity as SeriesEntity;