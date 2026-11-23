# Пользователи

## Требования
* Пользователь может зарегистрироваться с корректными email и паролем.
* Учётные данные пользователя сохраняются в PostgreSQL.
* Пароль хранится в виде хеша, а не открытого текста.
* HTTP-ответ не раскрывает пароль или его хеш.
* Email пользователя должен быть уникальным без учёта регистра.

## Сценарии

### 1. Успешная регистрация
Пользователь отправляет запрос:

```http
POST /users
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "correct-horse-battery-staple"
}
```

Сервер сохраняет пользователя и возвращает `201 Created`:

```json
{
  "id": 42,
  "email": "user@example.com"
}
```

### 2. Повторная регистрация с email в другом регистре
Если пользователь с email `user@example.com` уже существует, пользователь отправляет запрос:

```http
POST /users
Content-Type: application/json

{
  "email": "USER@example.com",
  "password": "another-password"
}
```

Сервер возвращает `409 Conflict`:

```json
{
  "error": "Email already exists"
}
```
