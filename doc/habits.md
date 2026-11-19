# Привычки

## Требования
* Запросы к привычкам выполняются с действительной cookie `jwt` авторизованного пользователя.
* Привычка принадлежит авторизованному пользователю.
* Сервер создаёт, возвращает, изменяет и удаляет только привычки пользователя.
* Тело запросов создания и редактирования использует `goalPeriod` и `goalTarget`.
* Ответы используют поля PostgreSQL `goal_period` и `goal_target`.
* Поле `goal_target` типа `BIGINT` возвращается строкой.

## Сценарии

### 1. Создание привычки
Пользователь с действительной сессией отправляет запрос:

```http
POST /habits
Content-Type: application/json
Cookie: jwt=<условный-JWT>

{
  "name": "Read 20 minutes",
  "color": "#DDEA7C",
  "goalPeriod": "week",
  "goalTarget": 3
}
```

Сервер создаёт привычку пользователя и возвращает `201 Created`:

```json
{
  "id": "42",
  "user_id": "42",
  "active": true,
  "name": "Read 20 minutes",
  "color": "#DDEA7C",
  "goal_period": "week",
  "goal_target": "3"
}
```

### 2. Получение списка своих привычек
Пользователь с действительной сессией отправляет запрос:

```http
GET /habits
Cookie: jwt=<условный-JWT>
```

Сервер возвращает `200 OK` со списком привычек пользователя:

```json
[
  {
    "id": "42",
    "user_id": "42",
    "active": true,
    "name": "Read 20 minutes",
    "color": "#DDEA7C",
    "goal_period": "week",
    "goal_target": "3"
  }
]
```

### 3. Редактирование привычки
Пользователь с действительной сессией отправляет запрос:

```http
PATCH /habits/42
Content-Type: application/json
Cookie: jwt=<условный-JWT>

{
  "name": "Read 30 minutes",
  "color": "#F2A9A0",
  "goalPeriod": "month",
  "goalTarget": 10
}
```

Сервер изменяет привычку пользователя и возвращает `200 OK`:

```json
{
  "id": "42",
  "user_id": "42",
  "active": true,
  "name": "Read 30 minutes",
  "color": "#F2A9A0",
  "goal_period": "month",
  "goal_target": "10"
}
```

### 4. Удаление привычки
Пользователь с действительной сессией отправляет запрос:

```http
DELETE /habits/42
Cookie: jwt=<условный-JWT>
```

Сервер удаляет привычку пользователя и возвращает `200 OK`:

```json
{
  "id": "42",
  "user_id": "42",
  "active": true,
  "name": "Read 30 minutes",
  "color": "#F2A9A0",
  "goal_period": "month",
  "goal_target": "10"
}
```

Значение JWT в примерах условно и создаётся сервером.
