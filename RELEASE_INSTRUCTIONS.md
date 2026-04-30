# Инструкция по созданию GitHub Release v0.1.0

## Шаг 1: Создание тега (если ещё не создан)
```bash
git tag -a v0.1.0 -m "Games Keeper v0.1.0 - Initial Release"
git push origin v0.1.0
```

## Шаг 2: Создание Release через GitHub CLI (требует аутентификацию)
```bash
# Установка gh (если нет)
# sudo apt install gh

# Аутентификация
gh auth login

# Создание релиза с файлами
gh release create v0.1.0 \
  --title "Games Keeper v0.1.0" \
  --notes-file RELEASE_NOTES.md \
  src-tauri/target/release/bundle/appimage/GamesKeeper.AppImage \
  src-tauri/target/release/bundle/deb/*.deb \
  src-tauri/target/release/bundle/rpm/*.rpm
```

## Шаг 3: Или через веб-интерфейс GitHub
1. Зайти на https://github.com/madhowl/games-keeper/releases
2. Нажать "Create new release"
3. Выбрать тег: `v0.1.0`
4. Заголовок: `Games Keeper v0.1.0`
5. Описание: скопировать из RELEASE_NOTES.md
6. Прикрепить файлы:
   - `GamesKeeper.AppImage`
   - `Games Keeper_0.1.0_amd64.deb`
   - `Games Keeper-0.1.0-1.x86_64.rpm`

## Файлы для релиза
- **AppImage:** `/home/user/qwen-project/games-kepper/src-tauri/target/release/bundle/appimage/GamesKeeper.AppImage` (6.2 MB)
- **DEB:** `/home/user/qwen-project/games-kepper/src-tauri/target/release/bundle/deb/Games Keeper_0.1.0_amd64.deb`
- **RPM:** `/home/user/qwen-project/games-kepper/src-tauri/target/release/bundle/rpm/Games Keeper-0.1.0-1.x86_64.rpm`

## Содержание релиза (RELEASE_NOTES.md)
См. файл RELEASE_NOTES.md в корне проекта.
