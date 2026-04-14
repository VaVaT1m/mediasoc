# Frontend architecture

## Что изменено

Фронтенд был разрезан на независимые слои без изменения backend-части.

### Core (`project/js/core`)
- `data.js` — константы, справочники, fallback-данные.
- `utils.js` — нормализация данных, ссылки, форматирование, HTML-экранирование.
- `api.js` — единая обёртка над `fetch`.
- `storage.js` — работа с `localStorage`.
- `ui.js` — toast, cookie banner, how-it-works modal, глобальные UI-хуки.
- `layout.js` — header / hero / footer.
- `templates.js` — повторно используемые HTML-шаблоны.
- `app.js` — сборка публичного `window.MediaSok` API.

### Add channel (`project/js/add-channel`)
- `context.js` — контекст страницы, DOM-ссылки, базовые UI-хелперы.
- `renderers.js` — рендер списков, регионов, стоковых логотипов, заполнение формы.
- `submission.js` — сбор payload, валидация, загрузка логотипа, submit.
- `../add-channel.js` — только orchestration и привязка событий.

## Что это даёт
- Меньше скрытых зависимостей между страницами.
- Общая логика больше не лежит в одном огромном файле.
- Форму добавления канала проще поддерживать и расширять.
- Backend не менялся.

## Точка входа страниц
Теперь HTML-страницы подключают core-слой по частям, а затем свой page-script.
