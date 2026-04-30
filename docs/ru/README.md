# Games Keeper

Каталогизатор настольных игр с современным интерфейсом.

## Возможности (v0.1.0)

- **Древовидная структура** — игры, дополнения и промо-материалы в иерархическом виде
- **Поиск** — быстрое нахождение игр по названию
- **SQLite база** — все данные хранятся локально в одном файле `collection.db`
- **Кроссплатформенность** — нативное приложение на Tauri 2.0

## Установка

### Linux (AppImage)
```bash
chmod +x GamesKeeper.AppImage
./GamesKeeper.AppImage
```

### Linux (DEB)
```bash
sudo dpkg -i GamesKeeper_0.1.0_amd64.deb
```

### Linux (RPM)
```bash
sudo rpm -i GamesKeeper-0.1.0-1.x86_64.rpm
```

## Системные требования

- Linux Mint 22.3 / Ubuntu 22.04+ / Fedora 38+
- 50 МБ свободного места
- Минимум 2 ГБ ОЗУ

## Разработка

```bash
npm install
npm run tauri dev
```

## Технологии

- **Frontend:** SolidJS + TypeScript + Tailwind 4
- **UI:** shadcn-solid
- **Backend:** Tauri 2.0 (Rust)
- **База данных:** SQLite (SeaORM)

## Лицензия

MIT
