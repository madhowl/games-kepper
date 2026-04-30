# Database Schema

## Overview

Games Keeper uses SQLite as its database, managed via SeaORM. The schema is designed to be flexible and extensible.

## Tables

### games
Stores all items in the collection (games, expansions, promos, custom items).

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY AUTOINCREMENT | Unique identifier |
| parent_id | INTEGER REFERENCES games(id) | Parent item (for expansions, etc.) |
| series_id | INTEGER REFERENCES series(id) | Series this item belongs to |
| node_type | TEXT NOT NULL | Type: 'game', 'expansion', 'promo', 'custom' |
| sort_order | INTEGER DEFAULT 0 | Order within siblings |
| title | TEXT NOT NULL | Main title |
| original_title | TEXT | Original language title |
| description | TEXT | Detailed description |
| release_year | INTEGER | Year of release |
| min_players | INTEGER | Minimum players |
| max_players | INTEGER | Maximum players |
| play_time | INTEGER | Average play time in minutes |
| min_age | INTEGER | Minimum age |
| image_path | TEXT | Path to cover image |
| created_at | DATETIME DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME DEFAULT CURRENT_TIMESTAMP | Last update timestamp |
| metadata | JSON | Flexible JSON field for extra data |

### Genres, Authors, Publishers, Series

These tables support normalization and are referenced by the games table via junction tables.

#### genres
| Column | Type |
|--------|------|
| id | INTEGER PRIMARY KEY |
| name | TEXT NOT NULL UNIQUE |

#### game_genres (junction)
| Column | Type |
|--------|------|
| game_id | INTEGER REFERENCES games(id) |
| genre_id | INTEGER REFERENCES genres(id) |

Similar structure exists for authors, publishers, and series.

## Extensibility

The `metadata` JSON field allows storing arbitrary data without schema changes. Future versions may introduce a formal schema system for custom fields.

## Indexes

- Primary keys on all `id` columns
- Foreign key indexes
- Index on `title` for search
- Index on `node_type` for filtering

## Schema Migrations

Migrations are managed via SeaORM migration system. See `src-tauri/migrations/` for SQL files.

## Example ER Diagram

```mermaid
erDiagram
    GAMES ||..|| GAMES : parent
    GAMES ||..|| SERIES : series
    GAMES }|..|{ GAME_GENRES : contains
    GAME_GENRES }o..|| GENRES : belongs to
    GAMES }|..|{ GAME_AUTHORS : has
    GAME_AUTHORS }o..|| AUTHORS : belongs to
    GAMES }|..|{ GAME_PUBLISHERS : published by
    GAME_PUBLISHERS }o..|| PUBLISHERS : belongs to
    SERIES ||..o{ GAMES : has
```

## Notes

- All timestamps are stored in UTC and converted to local time in the UI.
- The `metadata` field is indexed for efficient querying in SQLite (using JSON1 extension).