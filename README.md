# Введение
Тема - разработка программного  обеспечения каталога компьютерных игр
Рабочее время - 20 часов
Итог - рабочий сайт и сервер, отчет по проделанной работе

## Стек
* Общий стек
	1. JS
	2. Node.js
	3. NPM
- Стек Бэкенда
	1. SQLite
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
- developer Разработчик 
    - id INTEGER Primary Key, Autoincrement
    - name TEXT Имя (Уникальное, Обязательное)

- publisher Издатель 
    - id INTEGER Primary Key, Autoincrement
    - name TEXT Имя (Уникальное, Обязательное)

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
## API
API запросы идут по адресу domain_name/api/запрос
- Регистрация пользователя POST (Domain/api/auth/register) 
  - Запрос:
    - Пароль string
    - Логин string
  - Ответ
    - Токен string

- Авторизация POST (Domain/api/auth/login)
  - Запрос
    - Пароль string
    - Логин string

  - Ответ
    - Токен string

- Получение списка игр GET (Domain/games)

- Название
- Издатель
- Жанр
- Разработчик
  Параметры запроса:
- Номер страницы
- Поисковая строка
- Фильтры:
    - Издатель enum
    - Разработчик enum
    - Диапазон рейтинга
    - Жанр string

3. Страница игры GET (Domain name/games/id)
   Параметры ответа:
- Название string
- Жанр type enum`[]`
- Год year int
- Платформы platform enum`[]`
- Издатель FK Издатели
- Разработчик FK Разработчики
- Оценка double
- Описание text
- Изображение imgurl
  Параметры запроса:
- id

3. Отправка оценки и отзыва POST (Domain name/games/id/review)
   Параметры запроса:
- review text
- rank int
3. Получение отзывов на модерацию GET(Domain name/rewiews)
4. Изменение статуса отзыва PUT (Domain name/rewiews/id/status)
5. Удаление отзыва DELETE (Domain name/rewiews/id)
6. Получение списка пользователей GET (Domain name/users)
7. Изменение статуса пользователей PUT (Domain name/users/id)

