# Games Keeper — Проект "Notion для настольщиков с AI-суперсилами"

## Описание проекта

Амбициозный проект по созданию профессионального инструмента для каталогизации, управления компонентами и печати настольных игр. Приложение объединяет функции каталогизатора, конструктора карт, OCR-системы и генератора PDF в едином нативном приложении.

**Рыночная ниша:** На данный момент абсолютно не закрыта существующими решениями. Все инструменты — либо ужасные веб-каталогизаторы, либо прототипные инструменты из 90-х вроде NanDeck.

---

# Технический стек

## Выбор технологий

| Слой | Инструмент | Обоснование |
|---|---|---|
| **Десктоп фреймворк** | Tauri 2.0 (Rust) | Бинарник 5-10 МБ (vs 150+ МБ у Electron). Полный доступ к ОС, файловой системе, GPU. Rust гарантирует отсутствие багов памяти. Нулевое потребление памяти в фоне |
| **Фронтенд** | SolidJS + TypeScript | Самый быстрый фреймворк. Реактивность "из коробки". Нет виртуального DOM, полностью предсказуемое поведение. Идеален для сложных таблиц и деревьев |
| **UI Компоненты** | shadcn-solid | Не библиотека, а набор копипаст-компонентов. Красиво, доступно, легко кастомизировать, не тянет лишних зависимостей |
| **Дерево и таблицы** | TanStack Virtual + TanStack Table | Единственная библиотека которая нормально отработает дерево из 10000 игр и список из 5000 карт без тормозов |
| **Редактор и конструктор карт** | Tldraw 2.0 (SDK) | Готовый Infinite Canvas, который можно превратить в конструктор карт. На порядок лучше любого самописного решения |
| **База данных** | SQLite (через SeaORM) | Вся база — один файл `collection.db`. Мгновенные запросы, транзакции, JSON-поля для гибкости. Пользователь владеет данными на 100% |
| **Бэкенд логика** | Rust | Вся тяжёлая работа: генерация PDF, раскладка карт, работа с файлами, запросы к LM Studio делается на нативном Расте |
| **OCR / LLM** | OpenAI Compatible API (LM Studio, Ollama, LlamaCpp, OpenRouter) | Стандартное API которое поддерживают все популярные локальные модели. Модель: `MiniCPM-V 2.6` или `llava-v1.5` |
| **PDF и Печать** | Rust (`printpdf` + `image`) | Нативная генерация PDF с точностью до 0.1 мм. Никогда не делайте генерацию PDF в браузере — это бесконечный ад с расхождениями DPI |

---

# Архитектура данных

## Ключевые архитектурные решения

1. **Нет жёсткой иерархии**
   - Не делай отдельные сущности Серия, Игра, Дополнение
   - Все это общий узел `Item` с типом
   - Любая вложенность любой глубины
   - Пользователи очень скоро попросят сделать дополнение к дополнению и серию внутри серии

2. **Система схем компонентов**
   - Универсальная система схем:
     - Пользователь создаёт схему: Карта, Кубик, Фишка, Правила
     - Добавляет к схеме любые поля любых типов
     - Сохраняет схему
     - После этого может создавать любое количество компонентов по этой схеме
   - Из коробки поставляется набор стандартных схем которые можно изменять как угодно

## Схема базы данных

```sql
-- ============================================
-- МИГРАЦИЯ 001: Базовая структура игр
-- ============================================

-- Жанры (отдельная таблица для нормализации)
CREATE TABLE genres (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL UNIQUE,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Авторы
CREATE TABLE authors (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    bio         TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Издательства
CREATE TABLE publishers (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    country     TEXT,
    website     TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Серии игр
CREATE TABLE series (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    description TEXT,
    image_path  TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Основная таблица игр (иерархическая структура)
CREATE TABLE games (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Иерархия
    parent_id       INTEGER REFERENCES games(id) ON DELETE SET NULL,
    series_id       INTEGER REFERENCES series(id) ON DELETE SET NULL,
    node_type       TEXT NOT NULL DEFAULT 'game'
                    CHECK(node_type IN ('game', 'expansion', 'promo')),
    sort_order      INTEGER DEFAULT 0,

    -- Основная информация
    title           TEXT NOT NULL,
    original_title  TEXT,
    description     TEXT,
    year_published  INTEGER,
    min_players     INTEGER,
    max_players     INTEGER,
    min_age         INTEGER,
    play_time_min   INTEGER,
    play_time_max   INTEGER,
    difficulty      REAL CHECK(difficulty BETWEEN 1 AND 5),

    -- Медиа
    cover_image     TEXT,

    -- Метаданные
    bgg_id          INTEGER,
    barcode         TEXT,
    language        TEXT DEFAULT 'ru',

    -- Статус коллекции
    status          TEXT DEFAULT 'owned'
                    CHECK(status IN ('owned', 'wishlist', 'preorder', 'sold')),
    condition       TEXT CHECK(condition IN ('mint', 'good', 'fair', 'poor')),

    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Связи игр с жанрами (M:N)
CREATE TABLE game_genres (
    game_id     INTEGER REFERENCES games(id) ON DELETE CASCADE,
    genre_id    INTEGER REFERENCES genres(id) ON DELETE CASCADE,
    PRIMARY KEY (game_id, genre_id)
);

-- Связи игр с авторами (M:N)
CREATE TABLE game_authors (
    game_id     INTEGER REFERENCES games(id) ON DELETE CASCADE,
    author_id   INTEGER REFERENCES authors(id) ON DELETE CASCADE,
    role        TEXT DEFAULT 'designer'
                CHECK(role IN ('designer', 'artist', 'developer')),
    PRIMARY KEY (game_id, author_id, role)
);

-- Связи игр с издательствами (M:N)
CREATE TABLE game_publishers (
    game_id         INTEGER REFERENCES games(id) ON DELETE CASCADE,
    publisher_id    INTEGER REFERENCES publishers(id) ON DELETE CASCADE,
    is_primary      BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (game_id, publisher_id)
);

-- FTS5 индекс для поиска
CREATE VIRTUAL TABLE games_fts USING fts5(
    title,
    original_title,
    description,
    content='games',
    content_rowid='id'
);

-- ============================================
-- МИГРАЦИЯ 002: Система компонентов
-- ============================================

-- Типы компонентов (конструктор форм)
CREATE TABLE component_types (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL,
    base_type       TEXT NOT NULL
                    CHECK(base_type IN (
                        'card', 'token', 'board',
                        'dice', 'rulebook', 'tile',
                        'miniature', 'marker', 'custom'
                    )),
    parent_type_id  INTEGER REFERENCES component_types(id),
    field_schema    TEXT NOT NULL DEFAULT '{}',
    icon            TEXT,
    color           TEXT DEFAULT '#6366f1',
    is_system       BOOLEAN DEFAULT FALSE,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Компоненты игры (экземпляры типов)
CREATE TABLE game_components (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id         INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    component_type_id INTEGER NOT NULL REFERENCES component_types(id),
    name            TEXT NOT NULL,
    quantity        INTEGER DEFAULT 1,
    data            TEXT NOT NULL DEFAULT '{}',
    images          TEXT DEFAULT '[]',
    notes           TEXT,
    sort_order      INTEGER DEFAULT 0,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- МИГРАЦИЯ 003: Расширенная система карт
-- ============================================

-- Размеры карт (стандартные)
CREATE TABLE card_sizes (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    width_mm    REAL NOT NULL,
    height_mm   REAL NOT NULL,
    is_standard BOOLEAN DEFAULT TRUE
);

-- Вставка стандартных размеров
INSERT INTO card_sizes (name, width_mm, height_mm) VALUES
    ('Mini American',   41,  63),
    ('American',       57,  89),
    ('Poker',         63,  88),
    ('Euro',          59,  92),
    ('Tarot',         70, 121),
    ('Square Small',  70,  70),
    ('Square Large', 100, 100);

-- Шаблоны карт
CREATE TABLE card_templates (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL,
    card_size_id    INTEGER REFERENCES card_sizes(id),
    front_template  TEXT NOT NULL DEFAULT '{}',
    back_template   TEXT DEFAULT NULL,
    variables       TEXT NOT NULL DEFAULT '[]',
    thumbnail       TEXT,
    is_system       BOOLEAN DEFAULT FALSE,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Карты (конкретные экземпляры в компоненте)
CREATE TABLE cards (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    component_id        INTEGER NOT NULL
                        REFERENCES game_components(id) ON DELETE CASCADE,
    card_size_id        INTEGER REFERENCES card_sizes(id),
    template_id         INTEGER REFERENCES card_templates(id),
    name                TEXT NOT NULL,
    card_type           TEXT DEFAULT 'single'
                        CHECK(card_type IN ('single', 'double_sided')),
    quantity            INTEGER DEFAULT 1,
    front_data          TEXT NOT NULL DEFAULT '{}',
    back_data           TEXT DEFAULT NULL,
    effects             TEXT DEFAULT '[]',
    stat_modifiers      TEXT DEFAULT '{}',
    conditions          TEXT DEFAULT '{}',
    sort_order          INTEGER DEFAULT 0,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ТРИГГЕРЫ
-- ============================================

-- Автообновление updated_at
CREATE TRIGGER games_updated_at
    AFTER UPDATE ON games
    BEGIN
        UPDATE games SET updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.id;
    END;

CREATE TRIGGER cards_updated_at
    AFTER UPDATE ON cards
    BEGIN
        UPDATE cards SET updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.id;
    END;

-- Синхронизация FTS индекса
CREATE TRIGGER games_fts_insert
    AFTER INSERT ON games
    BEGIN
        INSERT INTO games_fts(rowid, title, original_title, description)
        VALUES (NEW.id, NEW.title, NEW.original_title, NEW.description);
    END;

CREATE TRIGGER games_fts_update
    AFTER UPDATE ON games
    BEGIN
        UPDATE games_fts
        SET title = NEW.title,
            original_title = NEW.original_title,
            description = NEW.description
        WHERE rowid = NEW.id;
    END;
```

---

# План разработки

Общая оценка времени для одного разработчика: **~5-6 месяцев до полного релиза**

---

## Милистоун 1: Ядро и каталог

**Оценка: 3-4 недели**

На выходе получаешь каталогизатор который уже лучше чем 90% существующих решений.

### Задачи

1. **Setup**
   - Бутстрап Tauri 2 + SolidJS (или Svelte 5) + SQLite
   - Настройка окружения разработки
   - Подключение sqlx с миграциями

2. **DB Layer**
   - Реализация миграций (001_games.sql, 002_components.sql, 003_cards.sql)
   - CRUD для таблицы `games`
   - Рекурсивный запрос для дерева (WITH RECURSIVE)
   - Реализация Drag-n-Drop (обновление `parent_id`)

3. **UI**
   - Левая панель: Дерево (используй TanStack Virtual для производительности)
   - Правая панель: Форма редактирования игры (название, год, автор)
   - Поиск, фильтры, сортировка (через FTS5)
   - Перетаскивание узлов в дереве

4. **JSON IO**
   - Кнопки Экспорт/Импорт всей базы в JSON

5. **Релиз**
   - Сборка релизов под Windows, MacOS и Linux

### Критерии завершения

- [ ] Приложение запускается и показывает пустое дерево
- [ ] Можно добавить игру, создать папку
- [ ] Перетащить игру в папку
- [ ] Экспорт/импорт JSON работает

---

## Милистоун 2: Компоненты и конструктор схем

**Оценка: 3 недели**

### Задачи

1. **UI Конструктора схем**
   - Форма "Добавить поле"
   - Выбор типа поля (число, текст, выпадающий список, булево)
   - Сохранение схемы

2. **Динамическая форма**
   - Когда юзер нажимает "Добавить компонент", фронт запрашивает схему полей и рендерит форму динамически

3. **Список компонентов**
   - Таблица всех компонентов игры
   - Фильтрация, сортировка
   - Массовое добавление и редактирование

4. **Глобальные компоненты**
   - "Жетон раны" используется в 10 играх
   - Одна запись в `components`, линкуется ко многим `games` (Many-to-Many)

5. **Глобальный поиск**
   - Поиск по всем компонентам всех игр

### Критерии завершения

- [ ] Создание кастомных схем (Карта, Фишка, Кубик)
- [ ] Добавление полей разных типов
- [ ] Создание компонентов по схеме
- [ ] Просмотр списка компонентов с фильтрацией

---

## Милистоун 3: OCR и импорт изображений

**Оценка: 2 недели**

Самая важная уникальная фича которой нет ни в одном другом приложении.

### Задачи

1. **Rust Backend**
   - Написание сервиса, который пингует `http://localhost:1234/v1/chat/completions` (API LM Studio / Ollama)
   - Автоматическое обнаружение запущенного LM Studio / Ollama

2. **Промпт-инжиниринг**
   ```text
   You are a board game card parser. Extract data from the image.
   Schema: { "name": string, "cost": int, "type": string, "text": string, "attributes": { "atk": int, "def": int } }
   Return ONLY valid JSON, no markdown, no explanations.
   ```

3. **Пайплайн**
   - Фронт отправляет массив картинок
   - Rust ресайзит их (чтобы не грузить LLM) и шлёт по одной в LM Studio
   - Парсит JSON ответ
   - Создаёт записи в `components`

4. **UI**
   - Экран "Import Scans"
   - Зона дропа
   - Прогресс-бар
   - Таблица результатов с возможностью правки перед сохранением
   - Кнопка "Исправить" обязательна

### Критерии завершения

- [ ] Перетащил 50 сканов карт → получил 50 готовых компонентов
- [ ] Распознанное название, текст, стоимость и другие поля
- [ ] Ручная корректировка результатов OCR
- [ ] Поддержка разных LLM провайдеров (LM Studio, Ollama, OpenRouter)

---

## Милистоун 4: Редактор и конструктор карт

**Оценка: 4 недели**

### Задачи

1. **Интеграция Tldraw**
   - Встроить Tldraw как компонент
   - Настройка под нужды редактора карт

2. **Система шаблонов**
   - Режим "Редактор Шаблонов": Создать "Карточку-Мастер"
   - На ней нарисовать рамку, фон, логотип
   - Залочить эти слои

3. **Редактор Карты**
   - Юзер создает новую карту → создается копия "Мастера"
   - Поверх мастера рендерятся текстовые поля из БД (название, стоимость)
   - Tldraw позволяет биндить текст к данным

4. **Массовое редактирование**
   - Самая важная фича: если ты изменил шаблон карты, все 300 карт в игре автоматически обновляются

5. **Экспорт**
   - Кнопка "Export PNG" (нативно из Tldraw)
   - Экспорт отдельных компонентов

### Критерии завершения

- [ ] Tldraw интегрирован и работает
- [ ] Создание и редактирование шаблонов
- [ ] Создание карт из шаблонов
- [ ] Автоматическое обновление всех карт при изменении шаблона
- [ ] Экспорт в PNG

---

## Милистоун 5: Печать и экспорт в PDF

**Оценка: 3 недели**

Та часть которую абсолютно все делают очень плохо.

### Задачи

1. **Алгоритм упаковки (Bin Packing)**
   - Реализация на Rust (MaxRects)
   - Впихнуть карты 63x88 мм на лист А4 с отступами
   - Поддержка любых размеров листов и карт

2. **Генерация PDF**
   - Использовать крейт `printpdf`
   - Рисуем прямоугольник листа
   - Для каждой карты: `draw_rectangle` (карта) + `draw_rectangle` (bleed/обрез)
   - Метки реза: внутренние, кровавые, крестики по углам

3. **UI настройки**
   - Выбор размера карт
   - Выбор размера листа
   - Настраиваемые отступы
   - Двусторонняя печать (смещение back-side)
   - Компенсация растяжения бумаги

4. **Preview**
   - Показать PDF перед печатью

### Критерии завершения

- [ ] Генерация PDF с правильной раскладкой карт
- [ ] Настраиваемые параметры (размеры, отступы)
- [ ] Метки реза
- [ ] Предпросмотр печати

---

## Милистоун 6: Полировка и фичи первого релиза

**Оценка: 3-4 недели**

### Задачи

1. **Импорт из BGG**
   - Импорт коллекции из BoardGameGeek в один клик
   - Парсинг XML API от BoardGameGeek
   - Заполняет поля `name`, `year`, `publisher`

2. **Инвентаризация**
   - Чеклист всех компонентов игры

3. **Резервное копирование**

4. **UI/UX**
   - Тёмная / светлая тема
   - Глобальные ярлыки
   - Локализация

5. **Синхронизация**
   - Синхронизация базы через любой облачный диск
   - Никакого собственного сервера
   - Приложение просто работает с одним файлом который можно положить в Dropbox, Nextcloud, Google Drive

### Критерии завершения

- [ ] BGG импорт работает
- [ ] Инвентаризация компонентов
- [ ] Тёмная/светлая тема
- [ ] Облачная синхронизация

---

# Фичи, которые убьют конкурентов (Must Have)

| Фича | Зачем это нужно | Как реализовать |
| :--- | :--- | :--- |
| **1. Режим "Мастер" (Fog of War)** | Для ГМов. Скрывать текст/цифры на картах при показе игрокам. | В Tldraw просто скрываем слой с текстом или накладываем полупрозрачный оверлей |
| **2. Синхронизация через облако** | Не терять данные. | Приложение работает с локальным файлом. Юзер кладет файл `collection.db` в Google Drive/Dropbox. Приложение просто следит за изменением файла |
| **3. Калькулятор "Стоимость сбора"** | Сколько стоит моя коллекция? | В схеме компонента добавить поле `price`. Дашборд суммирует `price * quantity` |
| **4. Глобальные компоненты** | "Жетон раны" используется в 10 играх. | Одна запись в `components`, линкуется ко многим `games` (Many-to-Many) |
| **5. BGG Импортер** | Не вводить данные руками. | Парсинг XML API от BoardGameGeek. Заполняет поля `name`, `year`, `publisher` |

---

# Дополнительные фичи (V2+)

1. **Версионирование игр** — сохраняй снимки прототипа, возвращайся на любую версию, сравнивай версии
2. **Генерация карт по описанию** — отправь текст карты в LLM и он сам отформатирует и разобьёт текст по шаблону
3. **Сканер штрихкодов** — отсканируй штрихкод коробки и приложение само подтянет все данные из BGG
4. **Список желаемого**
5. **Плагинная система** — для добавления новых типов экспорта и новых схем компонентов

---

# Подводные камни (Боль и страдания)

1. **OCR галлюцинирует**
   - Модель будет выдумывать цифры
   - **Решение**: Всегда показывать превью картинки рядом с распознанным текстом. Кнопка "Исправить" обязательна

2. **PDF DPI Ад**
   - Браузеры и принтеры считают в дюймах, а карты в мм
   - **Решение**: Никакого `window.print()`. Только нативная генерация PDF в Rust, где 1 юнит = 1 мм или 1/72 дюйма

3. **Производительность Tldraw**
   - Если на канвасе 5000 карт — будет лагать
   - **Решение**: Не рендерить всё сразу. Использовать камеру Tldraw (viewport culling)

4. **Жёсткая иерархия**
   - Через две недели после релиза напишут минимум 50 человек которые хотят сделать дополнение к дополнению
   - **Решение**: Используй гибкую структуру с материализованным путём

5. **Производительность списков**
   - Любое приложение умрёт если попытаться отобразить список из 2000 карт без виртуализации
   - **Решение**: Всегда используй TanStack Virtual для всех списков

6. **Tesseract OCR бесполезен**
   - Он абсолютно бесполезен для текста на картах, декоративных шрифтов и текста на фоне
   - **Решение**: Только визуальные большие языковые модели (MiniCPM-V 2.6, llava-v1.5)

---

# Итог

Начни с **Милистоуна 1**. Если сделаешь просто удобный каталог с деревом и SQLite — это уже полезно. Остальное накручивай итеративно.

Каждый милистоун — это полностью работающее используемое приложение. Не пытайся сделать всё сразу.

---

## Следующие шаги

- [x] Детализировать схему базы данных
- [x] Написать пример рабочего промпта для распознавания карт
- [x] Детальный план первого милистоуна
- [ ] Настроить окружение разработки

---

## Структура SQL миграций

```
src-tauri/
└── migrations/
    ├── 001_initial.sql    -- Таблицы жанров, авторов, издательств, серий, игры
    ├── 002_components.sql -- Типы компонентов и компоненты игр
    └── 003_cards.sql     -- Размеры карт, шаблоны, карты
```

### 001_initial.sql

```sql
-- Миграция 001: Базовая структура игр

CREATE TABLE IF NOT EXISTS genres (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL UNIQUE,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS authors (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    bio         TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS publishers (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    country     TEXT,
    website    TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS series (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    description TEXT,
    image_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS games (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_id       INTEGER REFERENCES games(id) ON DELETE SET NULL,
    series_id       INTEGER REFERENCES series(id) ON DELETE SET NULL,
    node_type       TEXT NOT NULL DEFAULT 'game'
                    CHECK(node_type IN ('game', 'expansion', 'promo')),
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
    difficulty    REAL CHECK(difficulty BETWEEN 1 AND 5),

    cover_image   TEXT,
    bgg_id      INTEGER,
    barcode     TEXT,
    language    TEXT DEFAULT 'ru',

    status      TEXT DEFAULT 'owned'
                CHECK(status IN ('owned', 'wishlist', 'preorder', 'sold')),
    condition   TEXT CHECK(condition IN ('mint', 'good', 'fair', 'poor')),

    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS game_genres (
    game_id  INTEGER REFERENCES games(id) ON DELETE CASCADE,
    genre_id INTEGER REFERENCES genres(id) ON DELETE CASCADE,
    PRIMARY KEY (game_id, genre_id)
);

CREATE TABLE IF NOT EXISTS game_authors (
    game_id   INTEGER REFERENCES games(id) ON DELETE CASCADE,
    author_id INTEGER REFERENCES authors(id) ON DELETE CASCADE,
    role      TEXT DEFAULT 'designer'
              CHECK(role IN ('designer', 'artist', 'developer')),
    PRIMARY KEY (game_id, author_id, role)
);

CREATE TABLE IF NOT EXISTS game_publishers (
    game_id      INTEGER REFERENCES games(id) ON DELETE CASCADE,
    publisher_id INTEGER REFERENCES publishers(id) ON DELETE CASCADE,
    is_primary  BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (game_id, publisher_id)
);

-- FTS5 индекс
CREATE VIRTUAL TABLE IF NOT EXISTS games_fts USING fts5(
    title,
    original_title,
    description,
    content='games',
    content_rowid='id'
);

-- Триггеры
CREATE TRIGGER IF NOT EXISTS games_updated_at
    AFTER UPDATE ON games
    BEGIN
        UPDATE games SET updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS games_fts_insert
    AFTER INSERT ON games
    BEGIN
        INSERT INTO games_fts(rowid, title, original_title, description)
        VALUES (NEW.id, NEW.title, NEW.original_title, NEW.description);
    END;

CREATE TRIGGER IF NOT EXISTS games_fts_update
    AFTER UPDATE ON games
    BEGIN
        UPDATE games_fts
        SET title = NEW.title,
            original_title = NEW.original_title,
            description = NEW.description
        WHERE rowid = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS games_fts_delete
    AFTER DELETE ON games
    BEGIN
        DELETE FROM games_fts WHERE rowid = OLD.id;
    END;
```

### 002_components.sql

```sql
-- Миграция 002: Система компонентов

CREATE TABLE IF NOT EXISTS component_types (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    name           TEXT NOT NULL,
    base_type      TEXT NOT NULL
                   CHECK(base_type IN (
                       'card', 'token', 'board',
                       'dice', 'rulebook', 'tile',
                       'miniature', 'marker', 'custom'
                   )),
    parent_type_id INTEGER REFERENCES component_types(id),
    field_schema TEXT NOT NULL DEFAULT '{}',
    icon        TEXT,
    color       TEXT DEFAULT '#6366f1',
    is_system  BOOLEAN DEFAULT FALSE,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS game_components (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id           INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    component_type_id INTEGER NOT NULL REFERENCES component_types(id),
    name             TEXT NOT NULL,
    quantity         INTEGER DEFAULT 1,
    data             TEXT NOT NULL DEFAULT '{}',
    images           TEXT DEFAULT '[]',
    notes            TEXT,
    sort_order       INTEGER DEFAULT 0,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Триггер
CREATE TRIGGER IF NOT EXISTS game_components_updated_at
    AFTER UPDATE ON game_components
    BEGIN
        UPDATE game_components SET updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.id;
    END;
```

### 003_cards.sql

```sql
-- Миграция 003: Расширенная система карт

CREATE TABLE IF NOT EXISTS card_sizes (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    width_mm    REAL NOT NULL,
    height_mm   REAL NOT NULL,
    is_standard BOOLEAN DEFAULT TRUE
);

INSERT INTO card_sizes (name, width_mm, height_mm) VALUES
    ('Mini American', 41, 63),
    ('American', 57, 89),
    ('Poker', 63, 88),
    ('Euro', 59, 92),
    ('Tarot', 70, 121),
    ('Square Small', 70, 70),
    ('Square Large', 100, 100);

CREATE TABLE IF NOT EXISTS card_templates (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    name           TEXT NOT NULL,
    card_size_id   INTEGER REFERENCES card_sizes(id),
    front_template TEXT NOT NULL DEFAULT '{}',
    back_template  TEXT DEFAULT NULL,
    variables     TEXT NOT NULL DEFAULT '[]',
    thumbnail     TEXT,
    is_system    BOOLEAN DEFAULT FALSE,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cards (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    component_id   INTEGER NOT NULL
                     REFERENCES game_components(id) ON DELETE CASCADE,
    card_size_id  INTEGER REFERENCES card_sizes(id),
    template_id  INTEGER REFERENCES card_templates(id),
    name         TEXT NOT NULL,
    card_type   TEXT DEFAULT 'single'
                 CHECK(card_type IN ('single', 'double_sided')),
    quantity    INTEGER DEFAULT 1,
    front_data  TEXT NOT NULL DEFAULT '{}',
    back_data   TEXT DEFAULT NULL,
    effects    TEXT DEFAULT '[]',
    stat_modifiers TEXT DEFAULT '{}',
    conditions  TEXT DEFAULT '{}',
    sort_order  INTEGER DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER IF NOT EXISTS cards_updated_at
    AFTER UPDATE ON cards
    BEGIN
        UPDATE cards SET updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.id;
    END;
```

---

## Примеры Rust сервисов

### Game Service

```rust
// src-tauri/src/services/game_service.rs

use sqlx::SqlitePool;
use crate::models::game::*;

pub struct GameService {
    pool: SqlitePool,
}

impl GameService {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    // Получение дерева игр
    pub async fn get_game_tree(&self) -> Result<Vec<GameNode>, sqlx::Error> {
        let games = sqlx::query!(
            r#"
            WITH RECURSIVE game_tree AS (
                SELECT id, parent_id, title, node_type,
                       cover_image, sort_order, 0 as depth
                FROM games
                WHERE parent_id IS NULL

                UNION ALL

                SELECT g.id, g.parent_id, g.title, g.node_type,
                       g.cover_image, g.sort_order, gt.depth + 1
                FROM games g
                INNER JOIN game_tree gt ON g.parent_id = gt.id
                WHERE gt.depth < 10
            )
            SELECT * FROM game_tree
            ORDER BY sort_order, title
            "#
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(self.build_tree(games, None))
    }

    fn build_tree(
        &self,
        games: Vec<GameRow>,
        parent_id: Option<i64>
    ) -> Vec<GameNode> {
        games
            .iter()
            .filter(|g| g.parent_id == parent_id)
            .map(|g| GameNode {
                id:          g.id,
                title:       g.title.clone(),
                node_type:   g.node_type.clone(),
                cover_image: g.cover_image.clone(),
                sort_order:  g.sort_order,
                has_children: games.iter().any(|c| c.parent_id == Some(g.id)),
                children:    self.build_tree(games.clone(), Some(g.id)),
            })
            .collect()
    }

    // CRUD операции
    pub async fn create_game(
        &self,
        dto: CreateGameDto
    ) -> Result<Game, sqlx::Error> {
        let mut tx = self.pool.begin().await?;

        let game_id = sqlx::query!(
            r#"
            INSERT INTO games (
                parent_id, series_id, node_type, title,
                original_title, description, year_published,
                min_players, max_players, min_age,
                play_time_min, play_time_max, difficulty, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING id
            "#,
            dto.parent_id,
            dto.series_id,
            dto.node_type,
            dto.title,
            dto.original_title,
            dto.description,
            dto.year_published,
            dto.min_players,
            dto.max_players,
            dto.min_age,
            dto.play_time_min,
            dto.play_time_max,
            dto.difficulty,
            dto.status
        )
        .fetch_one(&mut *tx)
        .await?
        .id;

        for genre_id in &dto.genre_ids {
            sqlx::query!(
                "INSERT INTO game_genres (game_id, genre_id) VALUES (?, ?)",
                game_id, genre_id
            )
            .execute(&mut *tx)
            .await?;
        }

        tx.commit().await?;

        self.get_game(game_id).await
    }

    pub async fn search_games(
        &self,
        query: &str,
        limit: i64
    ) -> Result<Vec<Game>, sqlx::Error> {
        let fts_query = format!("{}*", query);

        sqlx::query_as!(
            Game,
            r#"
            SELECT g.* FROM games g
            JOIN games_fts fts ON g.id = fts.rowid
            WHERE games_fts MATCH ?
            ORDER BY rank
            LIMIT ?
            "#,
            fts_query,
            limit
        )
        .fetch_all(&self.pool)
        .await
    }
}
```

### OCR Service

```rust
// src-tauri/src/services/ocr_service.rs

use reqwest::Client;
use serde::{Deserialize, Serialize};
use base64::{engine::general_purpose, Engine};
use std::path::PathBuf;

pub struct OcrService {
    client:       Client,
    lm_studio_url: String,
    model:        String,
}

#[derive(Serialize)]
struct ChatRequest {
    model:      String,
    messages:   Vec<ChatMessage>,
    max_tokens: i32,
    temperature: f32,
}

#[derive(Serialize, Deserialize)]
struct ChatMessage {
    role:       String,
    content:    Vec<ContentPart>,
}

#[derive(Serialize, Deserialize)]
#[serde(tag = "type")]
enum ContentPart {
    #[serde(rename = "text")]
    Text { text: String },

    #[serde(rename = "image_url")]
    ImageUrl { image_url: ImageUrl },
}

#[derive(Serialize, Deserialize)]
struct ImageUrl {
    url: String,
}

#[derive(Deserialize)]
struct ChatResponse {
    choices: Vec<Choice>,
}

#[derive(Deserialize)]
struct Choice {
    message: ResponseMessage,
}

#[derive(Deserialize)]
struct ResponseMessage {
    content: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CardOcrResult {
    pub name:          Option<String>,
    pub card_type:     Option<String>,
    pub cost:         Option<String>,
    pub description:  Option<String>,
    pub effects:       Vec<OcrEffect>,
    pub stats:         Vec<OcrStat>,
    pub flavor_text:   Option<String>,
    pub confidence:   f32,
    pub raw_text:      String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OcrEffect {
    pub effect_type:  String,
    pub description: String,
    pub trigger:    Option<String>,
    pub value:     Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OcrStat {
    pub name:  String,
    pub value: String,
}

impl OcrService {
    pub fn new(lm_studio_url: String, model: String) -> Self {
        Self {
            client: Client::builder()
                .timeout(std::time::Duration::from_secs(120))
                .build()
                .unwrap(),
            lm_studio_url,
            model,
        }
    }

    pub async fn recognize_card(
        &self,
        image_path: PathBuf
    ) -> Result<CardOcrResult, Box<dyn std::error::Error>> {
        let image_b64 = self.load_image_as_base64(&image_path).await?;
        let data_url = format!("data:image/jpeg;base64,{}", image_b64);

        let system_prompt = r#"
            Ты - специализированный ассистент для распознавания карт настольных игр.
            Твоя задача - точно извлечь все данные с карты и вернуть их в JSON формате.

            Всегда возвращай ТОЛЬКО валидный JSON без дополнительного текста.
            Если значение не найдено - используй null.
        "#;

        let user_prompt = format!(r#"
            Распознай все текстовые данные на карте настольной игры.

            Верни JSON строго в следующем формате:
            {{
                "name": "название карты или null",
                "card_type": "тип карты или null",
                "cost": "стоимость/манакост или null",
                "description": "основной текст карты или null",
                "effects": [
                    {{
                        "effect_type": "тип эффекта",
                        "description": "описание эффекта",
                        "trigger": "условие срабатывания или null",
                        "value": "числовое значение или null"
                    }}
                ],
                "stats": [
                    {{
                        "name": "название характеристики",
                        "value": "значение"
                    }}
                ],
                "flavor_text": "художественный текст курсивом или null",
                "confidence": 0.95,
                "raw_text": "весь распознанный текст подряд"
            }}
        "#);

        let request = ChatRequest {
            model:      self.model.clone(),
            max_tokens: 2048,
            temperature: 0.1,
            messages: vec![
                ChatMessage {
                    role: "system".to_string(),
                    content: vec![ContentPart::Text {
                        text: system_prompt.to_string()
                    }],
                },
                ChatMessage {
                    role: "user".to_string(),
                    content: vec![
                        ContentPart::ImageUrl {
                            image_url: ImageUrl { url: data_url }
                        },
                        ContentPart::Text { text: user_prompt },
                    ],
                },
            ],
        };

        let response = self.client
            .post(format!("{}/v1/chat/completions", self.lm_studio_url))
            .json(&request)
            .send()
            .await?
            .json::<ChatResponse>()
            .await?;

        let content = &response.choices[0].message.content;
        let result: CardOcrResult = serde_json::from_str(content)?;

        Ok(result)
    }

    async fn load_image_as_base64(
        &self,
        path: &PathBuf
    ) -> Result<String, Box<dyn std::error::Error>> {
        let bytes = tokio::fs::read(path).await?;
        let optimized = self.optimize_for_ocr(bytes)?;
        Ok(general_purpose::STANDARD.encode(&optimized))
    }

    fn optimize_for_ocr(
        &self,
        bytes: Vec<u8>
    ) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
        use image::{ImageReader, imageops::FilterType};
        use std::io::Cursor;

        let img = ImageReader::new(Cursor::new(&bytes))
            .with_guessed_format()?
            .decode()?;

        let max_size = 1200;
        let (w, h) = (img.width(), img.height());

        let resized = if w > max_size || h > max_size {
            img.resize(max_size, max_size, FilterType::Lanczos3)
        } else {
            img
        };

        let mut output = vec![];
        resized.write_to(
            &mut Cursor::new(&mut output),
            image::ImageFormat::Jpeg
        )?;

        Ok(output)
    }
}
```

### PDF Service

```rust
// src-tauri/src/services/pdf_service.rs

use printpdf::*;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct PrintConfig {
    pub page_size:      PageSize,
    pub bleed_mm:       f64,
    pub margin_mm:      f64,
    pub gap_mm:         f64,
    pub show_crop_marks: bool,
    pub show_bleed:     bool,
    pub duplex:         bool,
    pub cards_per_row:  Option<u32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum PageSize {
    A4,
    A3,
    Letter,
    Legal,
    Custom { width_mm: f64, height_mm: f64 },
}

impl PageSize {
    fn dimensions_mm(&self) -> (f64, f64) {
        match self {
            PageSize::A4      => (210.0, 297.0),
            PageSize::A3       => (297.0, 420.0),
            PageSize::Letter     => (215.9, 279.4),
            PageSize::Legal    => (215.9, 355.6),
            PageSize::Custom { width_mm, height_mm } => (*width_mm, *height_mm),
        }
    }
}

pub struct PdfService;

impl PdfService {
    pub fn generate_print_sheet(
        cards: &[CardPrintData],
        config: &PrintConfig
    ) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
        let (page_w, page_h) = config.page_size.dimensions_mm();
        let mm_to_pt = 2.8346;

        let (doc, page1, layer1) = PdfDocument::new(
            "Print Sheet",
            Mm(page_w).into(),
            Mm(page_h).into(),
            "Layer 1"
        );

        let current_layer = doc.get_page(page1).get_layer(layer1);

        for (i, card) in cards.iter().enumerate() {
            let x = (i as u32 % 3) as f64;
            let y = (i as u32 / 3) as f64;

            let card_x = config.margin_mm + x * (card.width_mm + config.gap_mm);
            let card_y = page_h - config.margin_mm - config.bleed_mm
                - y * (card.height_mm + 2.0 * config.bleed_mm + config.gap_mm)
                - card.height_mm;

            current_layer.add shape(Rect::new(
                Mm(card_x).into(),
                Mm(card_x + card.width_mm).into(),
                Mm(card_y).into(),
                Mm(card_y + card.height_mm).into(),
            ));

            if config.show_crop_marks {
                Self::add_crop_marks(&current_layer, card_x, card_y,
                    card.width_mm, card.height_mm, config.bleed_mm);
            }
        }

        Ok(doc.save_to_vec()?)
    }

    fn add_crop_marks(
        layer: &PdfLayerReference,
        x: f64, y: f64,
        w: f64, h: f64,
        bleed: f64
    ) {
        let len = 5.0;
        layer.add shape(Rect::new(
            Mm(x - bleed - len).into(),
            Mm(x - bleed).into(),
            Mm(y - bleed - len).into(),
            Mm(y - bleed).into(),
        ));
    }
}

pub struct CardPrintData {
    pub width_mm:  f64,
    pub height_mm: f64,
    pub image_data: Vec<u8>,
}
