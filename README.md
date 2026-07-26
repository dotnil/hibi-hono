# Hibi

## Db migrations
```
dbmate create
dbmate up
```

```
npm install
npm run dev
```

```
open http://localhost:3000
```

# Hibi Backend

Backend веб-приложения **Hibi** — трекера привычек.
Hibi состоит из двух независимых репозиториев, которые вместе образуют одно приложение.

```
        Hibi

┌───────────────────────────┐
│ hibi-vue                  │
│ Frontend (Vue 3)          │
└───────────┬───────────────┘
            │ REST API
┌───────────▼───────────────┐
│ hibi-hono                 │
│ Backend (этот репозиторий)│
└───────────┬───────────────┘
            │
       PostgreSQL
```

Frontend: **hibi-vue**  
Backend: **hibi-hono**

> 📷 GIF с демонстрацией приложения

## Возможности

- регистрация и авторизация пользователей;
- JWT-аутентификация через cookies;
- CRUD привычек;
- ежедневные отметки выполнения;
- REST API для frontend;
- хранение данных в PostgreSQL.

## Запуск

```bash
git clone ...
cd hibi-hono

npm install

cp .env.example .env

npm run dev
```

## Связанные репозитории

- **hibi-vue** — frontend приложения;
- **nixos-server** — конфигурация сервера и деплой;
- `ARCHITECTURE.md` — описание архитектуры проекта.
