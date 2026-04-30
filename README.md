# harcatertik — Axiom Synergy Group survey

Հարցաթերթիկ + admin panel + statistics for Axiom Synergy Group.

## Stack

- **Frontend** — статический `index.html` (форма) + `admin.html` (админка) с шрифтом Noto Sans Armenian.
- **Backend** — Vercel Serverless Functions в `api/` (Node 20).
- **БД** — [Neon Postgres](https://neon.tech) через `@neondatabase/serverless`.

## Структура

```
.
├── api/
│   ├── submit.js     # POST /api/submit  — сохраняет ответы в БД
│   └── stats.js      # GET  /api/stats   — статистика + список (Bearer auth)
├── lib/
│   └── db.js         # подключение к Neon + автосоздание таблицы
├── index.html        # форма опроса
├── admin.html        # админ-панель: статистика, таблица, CSV-экспорт
├── package.json
├── vercel.json
├── .env.example
└── README.md
```

## Переменные окружения

| Variable         | Назначение                                                      |
| ---------------- | ----------------------------------------------------------------|
| `DATABASE_URL`   | Connection string Neon Postgres (даётся автоматически Vercel-Marketplace интеграцией). |
| `ADMIN_PASSWORD` | Пароль для входа в `/admin`. Задайте длинную случайную строку.   |

## Деплой на Vercel (рекомендуемый путь)

```bash
# 1) Установить Vercel CLI и залогиниться
npm i -g vercel
vercel login

# 2) Привязать проект (создаст .vercel/)
vercel link

# 3) Подключить Neon Postgres из Marketplace — DATABASE_URL появится автоматически
vercel integration add neon

# 4) Задать пароль админки
vercel env add ADMIN_PASSWORD production
# (введите длинный пароль; повторите для preview/development при желании)

# 5) Подтянуть env-переменные локально (для разработки)
vercel env pull .env.local

# 6) Боевой деплой
vercel --prod
```

После деплоя:

- Опросник доступен по адресу `https://<project>.vercel.app/`
- Админка — `https://<project>.vercel.app/admin` (вход по `ADMIN_PASSWORD`)

## Локальная разработка

```bash
npm install
vercel env pull .env.local
vercel dev
# открыть http://localhost:3000
```

## Что сохраняется в БД

Таблица `submissions` (создаётся автоматически при первом обращении):

- `organization_name`, `main_phone`
- `q1`…`q15` (значения вариантов ответа)
- `contact_name`, `contact_email`, `contact_phone`, `comments` (опционально)
- `user_agent`, `ip`, `created_at`

## Админ-панель

`/admin` показывает:

- Общее число заполнений и сколько участников оставили контакт.
- По каждому из 15 вопросов — распределение ответов (count + %).
- Таблицу всех заполнений с поиском.
- Кнопку **CSV экспорт** (UTF-8 BOM, Excel-friendly).
