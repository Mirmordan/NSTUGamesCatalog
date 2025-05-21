# Введение
Тема - разработка программного  обеспечения каталога компьютерных игр<br/>
Итог - рабочий сайт и сервер, отчет по проделанной работе.

## Стек
- Общий стек
	1. JavaScript
	2. Node.js
	3. NPM
- Стек Бэкенда
	1. SQLite
  2. Express
- Стек Фронтенда
	1. HTML
	2. СSS
	3. React



## Функционал сайта (фронт)
- Предоставить возможность авторизации и предоставления привилегий 
- Предоставлять список игр с пагинацией, поиском и фильтрацией
- Переход на страницу отдельной игры
- Получить список отзывов игры
- Для авторизованного пользователя : оставить отзыв
- Для авторизованного администратора : принять отзыв, удалить отзыв, заблокировать пользователя
## Функционал сервера (бэк)
- Предоставление авторизации (логин,пароль)
- Предоставление списка игр с пагинацией, поиском и фильтрацией
- Предоставление данных конкретной игры
- Обработка данных в SQLite
- Предоставление возможности оставлять отзыв и рейтинг от пользователя
- Предоставление администрирования (список отзывов на одобрение, функционал одобрения/отклонения отзыва, блокировка пользователя)
- Расчёт рейтинга по игре на основе оценок пользователей (триггер в бд)

# Функционирование
## Модели
- game Игра
    - id INTEGER Primary Key, Autoincrement
    - name TEXT Название (Обязательное)
    - genre TEXT Жанр
    - year INTEGER Год выпуска (Обязательное)
    - platforms TEXT Платформы (Обязательное)
    - publisher_id INTEGER Внешний ключ (publishers.id), может быть NULL (ON DELETE SET NULL)
    - developer_id INTEGER Внешний ключ (developers.id), может быть NULL (ON DELETE SET NULL)
    - rating REAL Рейтинг (По умолчанию 0.0, обновляется триггерами)
    - description TEXT Описание

- user Пользователь 
    - id INTEGER Primary Key, Autoincrement
    - login TEXT Логин 
    - password TEXT Пароль 
    - status TEXT Статус ('active', 'blocked')
    - role TEXT Роль ('admin', 'user')

- review Отзыв 
    - id INTEGER Primary Key, Autoincrement
    - user_id INTEGER Внешний ключ по users.id
    - game_id INTEGER Внешний ключ по games.id
    - rank INTEGER Оценка 
    - review_text TEXT Текст отзыва
    - status TEXT Статус ('review', 'approved', 'rejected')
    - created_at DATETIME Время создания 

- developer Разработчик 
    - id INTEGER Primary Key, Autoincrement
    - name TEXT Имя (Уникальное, Обязательное)

- publisher Издатель 
    - id INTEGER Primary Key, Autoincrement
    - name TEXT Имя (Уникальное, Обязательное)

## API

API запросы идут по адресу `domain_name/api/` <br>

**Аутентификация** (`/auth`)
-   Регистрация пользователя `POST /auth/register`
    -   Запрос:
        -   `login` (string)
        -   `password` (string)
    -   Ответ:
        -   `message` (string, e.g., "User registered successfully. Please log in.")

-   Авторизация пользователя `POST /auth/login`
    -   Запрос:
        -   `login` (string)
        -   `password` (string)
    -   Ответ:
        -   `token` (string)

**Игры** (`/games`)
-   Получение списка игр `GET /games`
    -   Запрос (query параметры, опционально):
        -   `page`, `limit`, `search`, `year`, `publisher`, `developer`, `genre`, `platform`, `minRating`, `maxRating`, `sortBy`, `sortOrder`
    -   Ответ:
        -   `games` (array)
        -   `totalGames` (number)
        -   `totalPages` (number)
        -   `currentPage` (number)

-   Получение детальной информации об игре `GET /games/:id`
    -   Запрос (path параметр):
        -   `:id` (number, ID игры)
    -   Ответ:
        -   Объект с деталями игры (json)

**Отзывы** (`/reviews`)

-   Отправить отзыв к игре `POST /reviews/game/:gameId` (Требует аутентификации)
    -   Запрос (path параметр + тело):
        -   `:gameId` (number, ID игры)
        -   `rank` (number, 1-10)
        -   `review_text` (string, опционально)
    -   Ответ:
        -   `message` (string)
        -   `review` (объект нового отзыва)

-   Получить отзывы по игре `GET /reviews/game/:gameId`
    -   Запрос (path параметр):
        -   `:gameId` (number, ID игры)
    -   Ответ:
        -   Массив объектов отзывов (json array)

-   Получить свой отзыв по игре `GET /reviews/game/:gameId/my` (Требует аутентификации)
    -   Запрос (path параметр):
        -   `:gameId` (number, ID игры)
    -   Ответ:
        -   Объект своего отзыва (json) или `404`

-   Обновить свой отзыв к игре `PUT /reviews/game/:gameId/my` (Требует аутентификации)
    -   Запрос (path параметр + тело):
        -   `:gameId` (number, ID игры)
        -   `rank` (number, 1-10, опционально)
        -   `review_text` (string, опционально)
    -   Ответ:
        -   `message` (string)
        -   `review` (объект обновленного отзыва)

-   Получить отзывы на модерацию `GET /reviews/pending` (Требует аутентификации, роль admin)
    -   Запрос: Нет
    -   Ответ:
        -   Массив объектов отзывов (json array)

-   Обновить статус отзыва `PUT /reviews/:reviewId/status` (Требует аутентификации, роль admin)
    -   Запрос (path параметр + тело):
        -   `:reviewId` (number, ID отзыва)
        -   `status` (string: "approved", "rejected", "review")
    -   Ответ:
        -   `message` (string)

-   Удалить отзыв `DELETE /reviews/:reviewId` (Требует аутентификации, роль admin)
    -   Запрос (path параметр):
        -   `:reviewId` (number, ID отзыва)
    -   Ответ:
        -   `message` (string)

**Пользователи** (`/users`)
-   Получить список всех пользователей `GET /users` (Требует аутентификации, роль admin)
    -   Запрос: Нет
    -   Ответ:
        -   Массив объектов пользователей (json array)

-   Обновить статус пользователя `PUT /users/:userId/status` (Требует аутентификации, роль admin)
    -   Запрос (path параметр + тело):
        -   `:userId` (number, ID пользователя)
        -   `status` (string: "active", "blocked")
    -   Ответ:
        -   `message` (string)