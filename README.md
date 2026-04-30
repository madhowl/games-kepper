# Games Keeper

Desktop board games cataloger with modern UI.

## Features (v0.1.0)

- **Tree structure** — games, expansions and promos in hierarchical view
- **Search** — quick game lookup by title
- **SQLite database** — all data stored locally in single `collection.db` file
- **Cross-platform** — native app powered by Tauri 2.0

## Installation

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

## System Requirements

- Linux Mint 22.3 / Ubuntu 22.04+ / Fedora 38+
- 50 MB free disk space
- 2 GB RAM minimum

## Development

```bash
npm install
npm run tauri dev
```

## Tech Stack

- **Frontend:** SolidJS + TypeScript + Tailwind 4
- **UI:** shadcn-solid
- **Backend:** Tauri 2.0 (Rust)
- **Database:** SQLite (SeaORM)

## License

MIT
