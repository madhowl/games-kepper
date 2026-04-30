# Начало работы

Добро пожаловать в Games Keeper! Этот руководство поможет вам установить и настроить приложение.

## Установка

### Linux (AppImage) - Рекомендуется

1. Скачайте последний AppImage со [страницы релизов](https://github.com/madhowl/games-keeper/releases).
2. Сделайте AppImage исполняемым:
   ```bash
   chmod +x GamesKeeper.AppImage
   ```
3. Запустите AppImage:
   ```bash
   ./GamesKeeper.AppImage
   ```

### Linux (DEB-пакет)

1. Скачайте пакет `.deb` со [страницы релизов](https://github.com/madhowl/games-keeper/releases).
2. Установите пакет:
   ```bash
   sudo dpkg -i GamesKeeper_*.deb
   ```
3. Если есть недостающие зависимости, выполните:
   ```bash
   sudo apt-get install -f
   ```

### Linux (RPM-пакет)

1. Скачайте пакет `.rpm` со [страницы релизов](https://github.com/madhowl/games-keeper/releases).
2. Установите пакет:
   ```bash
   sudo rpm -i GamesKeeper-*.rpm
   ```

## Первый запуск

При первом запуске Games Keeper вы увидите пустую коллекцию. Вы можете начать, добавив свою первую игру.

### Добавление игры

1. Нажмите кнопку "+" в правом верхнем углу.
2. Заполните детали игры (название и т.д.).
3. Нажмите "Сохранить", чтобы добавить игру в вашу коллекцию.

## Следующие шаги

- Узнайте о [Функциях](features.md) Games Keeper.
- Посмотрите [ЧАВО](faq.md) для ответов на частые вопросы.