# Введение
Тема - разработка программного  обеспечения каталога компьютерных игр<br/>
Рабочее время - 20 часов<br/>
Итог - рабочий сайт и сервер, отчет по проделанной работе

Чтобы запустить API-сервер или WEB-сервер, перейдите в папку и запустите там deploy.sh

## Стек
- Общий стек
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
!!!Добавить
