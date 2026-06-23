# Аутентификация

## Регистрация

### `POST /users`

| Поле       | Тип    | Обязательное |
|------------|--------|--------------|
| `email`    | string | да           |
| `password` | string | да           |

- **201** → `{ id, email }`
- **409** → `{ error: "Email already exists" }`

## Вход

### `POST /sessions`

Тело: `{ email, password }`

- **200** → `{ ok: true }` + устанавливается httpOnly cookie `jwt`
- **401** → `{ error: "Invalid credentials" }`

## Выход

### `POST /logout`

Очищает cookie `jwt`.

- **200** → `{ ok: true }`

## Текущая сессия

### `GET /sessions/current`

Требует cookie `jwt`.

- **200** → `{ id, email }`
- **401** → `{ error: "Unauthorized" }`
