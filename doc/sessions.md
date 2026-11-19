# Сессии

## Требования
* Зарегистрированный пользователь может войти с корректными учётными данными.
* При успешном входе сервер устанавливает cookie `jwt` с JWT.
* Атрибут `HttpOnly` запрещает клиентскому JavaScript читать cookie `jwt` через `document.cookie`.
* Пользователь с действительной сессией может получить свой идентификатор и email.
* Без действительной сессии доступ к текущему пользователю запрещён.
* При выходе сервер отправляет указание удалить cookie авторизации.

## Сценарии

### 1. Успешный вход
Пользователь отправляет запрос:

```http
POST /sessions
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "correct-horse-battery-staple"
}
```

Сервер возвращает `200 OK`:

```http
Set-Cookie: jwt=<условный-JWT>; HttpOnly; SameSite=Lax; Path=/
```

```json
{
  "ok": true
}
```


### 2. Получение текущего пользователя
Пользователь с действительной сессией отправляет запрос:

```http
GET /sessions/current
Cookie: jwt=<условный-JWT>
```

Сервер возвращает `200 OK`:

```json
{
  "id": 42,
  "email": "user@example.com"
}
```


### 3. Выход
Пользователь отправляет запрос:

```http
POST /logout
```

Сервер возвращает `200 OK` и удаляет cookie авторизации:

```http
Set-Cookie: jwt=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0
```

```json
{
  "ok": true
}
```
