-- Миграция 001: Базовая структура игр
CREATE TABLE IF NOT EXISTS genres (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL UNIQUE,
    created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS authors (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    bio         TEXT,
    created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS publishers (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    country     TEXT,
    website    TEXT,
    created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS series (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    description TEXT,
    image_path TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS games (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_id       INTEGER REFERENCES games(id) ON DELETE SET NULL,
    series_id       INTEGER REFERENCES series(id) ON DELETE SET NULL,
    node_type       TEXT NOT NULL DEFAULT 'game',
    sort_order      INTEGER DEFAULT 0,
    title           TEXT NOT NULL,
    original_title  TEXT,
    description    TEXT,
    year_published INTEGER,
    min_players   INTEGER,
    max_players   INTEGER,
    min_age       INTEGER,
    play_time_min INTEGER,
    play_time_max INTEGER,
    difficulty    REAL,
    cover_image   TEXT,
    bgg_id      INTEGER,
    barcode     TEXT,
    language    TEXT DEFAULT 'ru',
    status      TEXT DEFAULT 'owned',
    condition   TEXT,
    created_at   TEXT DEFAULT (datetime('now')),
    updated_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS game_genres (
    game_id  INTEGER REFERENCES games(id) ON DELETE CASCADE,
    genre_id INTEGER REFERENCES genres(id) ON DELETE CASCADE,
    PRIMARY KEY (game_id, genre_id)
);

CREATE TABLE IF NOT EXISTS game_authors (
    game_id   INTEGER REFERENCES games(id) ON DELETE CASCADE,
    author_id INTEGER REFERENCES authors(id) ON DELETE CASCADE,
    role      TEXT DEFAULT 'designer',
    PRIMARY KEY (game_id, author_id, role)
);

CREATE TABLE IF NOT EXISTS game_publishers (
    game_id      INTEGER REFERENCES games(id) ON DELETE CASCADE,
    publisher_id INTEGER REFERENCES publishers(id) ON DELETE CASCADE,
    is_primary  INTEGER DEFAULT 1,
    PRIMARY KEY (game_id, publisher_id)
);

CREATE TRIGGER IF NOT EXISTS games_updated_at
    AFTER UPDATE ON games
    BEGIN
        UPDATE games SET updated_at = datetime('now')
        WHERE id = NEW.id;
    END;