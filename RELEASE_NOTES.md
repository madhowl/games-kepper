# Games Keeper v0.1.0 - Initial Release

Первый публичный релиз каталогизатора настольных игр.

## Основные возможности

- **Древовидная структура** — игры, дополнения и промо-материалы в иерархическом виде
- **Поиск** — быстрое нахождение игр по названию
- **SQLite база данных** — все данные хранятся локально в одном файле
- **Нативное приложение** — быстрое и легкое (Tauri 2.0 + Rust)

## Установка

### Linux (AppImage) — рекомендуется
```bash
chmod +x GamesKeeper.AppImage
./GamesKeeper.AppImage
```

### Linux (DEB)
```bash
sudo dpkg -i "Games Keeper_0.1.0_amd64.deb"
```

### Linux (RPM)
```bash
sudo rpm -i "Games Keeper-0.1.0-1.x86_64.rpm"
```

## Системные требования

- Linux Mint 22.3 / Ubuntu 22.04+ / Fedora 38+
- 50 МБ свободного места
- 2 ГБ ОЗУ

## Известные ограничения

- Нет автоматического обновления
- База данных локальная (нет синхронизации)
- Для AppImage база хранится в `~/.local/share/games-keeper/`

## Технологии

- **Frontend:** SolidJS + TypeScript + Tailwind 4
- **UI:** shadcn-solid
- **Backend:** Tauri 2.0 (Rust)
- **База данных:** SQLite

## Следующие шаги

План развития проекта доступен в файле [DEVELOPMENT.md](DEVELOPMENT.md).

---

**Полный исходный код доступен на GitHub:** https://github.com/madhowl/games-keeper
