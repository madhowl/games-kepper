# Games Keeper - Инструкция по установке иконки в Linux Mint

## Текущее состояние
- ✅ Приложение установлено через .deb пакет
- ✅ В меню приложений есть название "Games Keeper"
- ❌ Нет иконки в меню
- ❌ Нет иконки и названия на панели Cinnamon

## Решение

### 1. Установить иконку в систему (нужен пароль sudo)
Откройте терминал и выполните:

```bash
sudo cp /home/user/qwen-project/games-kepper/src-tauri/icons/128x128.png /usr/share/icons/hicolor/128x128/apps/games-keeper.png && sudo gtk-update-icon-cache -f -t /usr/share/icons/hicolor
```

### 2. Установить .desktop файл (нужен пароль sudo)
```bash
sudo cp /home/user/qwen-project/games-kepper/games-keeper.desktop /usr/share/applications/
sudo update-desktop-database /usr/share/applications/
```

### 3. Перезапустить Cinnamon
Нажмите `Alt+F2`, введите `r` и нажмите Enter для перезапуска Cinnamon.

### 4. Или просто выйти и войти в систему

## Альтернативное решение (если не работает)
Установите приложение заново из менеджера приложений после выполнения шагов 1-2.