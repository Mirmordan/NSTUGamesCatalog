Отлично! Техническое задание довольно четкое. Учитывая 20-часовой лимит, структура должна быть простой, но расширяемой. Вот предлагаемая структура проекта для бэкенда на Node.js с использованием Express и SQLite, а также примеры скриптов.

**Структура Проекта:**

```
game-catalog-backend/
├── node_modules/         # Зависимости проекта (создается после npm install)
├── config/               # Файлы конфигурации
│   └── db.config.js      # Настройки подключения к БД (путь к файлу SQLite)
│   └── auth.config.js    # Настройки аутентификации (JWT секрет)
├── controllers/          # Контроллеры (обработка запросов, вызов сервисов)
│   ├── auth.controller.js
│   ├── game.controller.js
│   ├── review.controller.js
│   └── user.controller.js
├── db/                   # Логика взаимодействия с базой данных
│   ├── connection.js     # Установка соединения с SQLite
│   └── initDb.js         # (Опционально) Скрипт для создания таблиц
├── middleware/           # Промежуточное ПО (аутентификация, проверка ролей)
│   ├── authenticateToken.js
│   └── isAdmin.js
├── models/               # Описание моделей данных (не ORM, а скорее структуры)
│   ├── Game.js
│   ├── User.js
│   ├── Review.js
│   ├── Publisher.js
│   └── Developer.js
├── routes/               # Определение маршрутов API
│   ├── auth.routes.js
│   ├── game.routes.js
│   ├── review.routes.js
│   └── user.routes.js
├── services/             # Бизнес-логика (взаимодействие с БД, расчеты)
│   ├── auth.service.js
│   ├── game.service.js
│   ├── review.service.js
│   └── user.service.js
├── utils/                # Вспомогательные функции (хеширование, JWT)
│   ├── hash.util.js
│   └── jwt.util.js
├── .env                  # Переменные окружения (секреты, порт, путь к БД)
├── .gitignore            # Файлы, игнорируемые Git
├── package.json          # Описание проекта и зависимостей
└── server.js             # Главный файл запуска сервера
```

**Объяснение Компонентов:**

1.  **`config/`**: Хранит конфигурационные файлы. Легко менять настройки без копания в коде.
2.  **`controllers/`**: Принимает HTTP-запросы от `routes`, извлекает данные (из `req.body`, `req.params`, `req.query`), вызывает соответствующие методы `services` и отправляет HTTP-ответы (`res.send`, `res.json`, `res.status`).
3.  **`db/`**: Отвечает за подключение к SQLite и, возможно, за инициализацию структуры БД (создание таблиц).
4.  **`middleware/`**: Функции, выполняющиеся *между* получением запроса и его обработкой в контроллере. Используются для проверки токена, прав доступа (админ/пользователь).
5.  **`models/`**: Здесь можно просто описать ожидаемую структуру данных (хотя бы в комментариях или как простые классы/объекты), чтобы было понятно, с чем работают сервисы и контроллеры. В простом варианте без ORM, фактические SQL-запросы будут в `services` или выделенном слое Data Access Layer (DAL), который можно поместить в `db/` или `services/`. Для 20 часов, возможно, проще держать SQL прямо в сервисах.
6.  **`routes/`**: Определяет эндпоинты API (например, `/login`, `/games`, `/games/:id`) и связывает их с методами контроллеров. Группировка по функциональности (auth, games, etc.).
7.  **`services/`**: Содержит основную логику приложения: взаимодействие с базой данных (выполнение SQL-запросов), обработку данных, расчеты (например, рейтинга), валидацию бизнес-правил.
8.  **`utils/`**: Мелкие вспомогательные функции, используемые в разных частях приложения (например, хеширование паролей, генерация/проверка JWT).
9.  **`server.js`**: Точка входа. Инициализирует Express, подключает middleware (CORS, body-parser), подключает роуты, запускает сервер на прослушивание порта.
10. **`.env`**: Файл для хранения переменных окружения (секретный ключ JWT, порт сервера, путь к файлу БД SQLite). **Важно:** Добавьте `.env` в `.gitignore`!
11. **`package.json`**: Стандартный файл Node.js для управления зависимостями (`npm install`) и скриптами (`npm start`).

**Примеры Скриптов:**

**1. `package.json` (основные зависимости):**

```json
{
  "name": "game-catalog-backend",
  "version": "1.0.0",
  "description": "Backend for the game catalog website",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js" // Для удобной разработки (требует npm install nodemon --save-dev)
    // "init-db": "node db/initDb.js" // Пример скрипта для инициализации БД
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "bcrypt": "^5.1.1",      // Хеширование паролей
    "cors": "^2.8.5",        // Разрешение кросс-доменных запросов (для React фронтенда)
    "dotenv": "^16.3.1",     // Загрузка переменных окружения из .env
    "express": "^4.18.2",    // Фреймворк для создания веб-сервера
    "jsonwebtoken": "^9.0.2", // Работа с JWT токенами
    "sqlite3": "^5.1.6"     // Драйвер для SQLite
  },
  "devDependencies": {
    "nodemon": "^3.0.1"     // Утилита для перезапуска сервера при изменении кода
  }
}
```
*Не забудьте выполнить `npm install` после создания `package.json`.*

**2. `.env` (Пример):**

```bash
PORT=5000
JWT_SECRET=your_very_strong_secret_key_here_12345
DATABASE_PATH=./db/catalog.sqlite
```

**3. `db/connection.js`:**

```javascript
const sqlite3 = require('sqlite3').verbose(); // verbose для более подробных логов об ошибках
const dotenv = require('dotenv');

dotenv.config(); // Загружаем переменные из .env

const dbPath = process.env.DATABASE_PATH || './catalog.sqlite'; // Путь к файлу БД

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    // Включаем поддержку внешних ключей (важно для связей)
    db.run("PRAGMA foreign_keys = ON;", function(err) {
        if (err) {
            console.error("Failed to enable foreign keys:", err.message);
        } else {
            console.log("Foreign key support enabled.");
        }
    });
  }
});

module.exports = db;
```

**4. `db/initDb.js` (Опционально, для первого запуска):**

```javascript
// Этот скрипт нужно запускать отдельно: node db/initDb.js
const db = require('./connection');

const createTables = () => {
  console.log("Creating database tables...");

  db.serialize(() => {
    // Важно: порядок создания таблиц важен из-за FK
    db.run(`CREATE TABLE IF NOT EXISTS publishers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS developers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      login TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      status TEXT CHECK(status IN ('active', 'blocked')) DEFAULT 'active',
      role TEXT CHECK(role IN ('admin', 'user')) DEFAULT 'user'
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      genre TEXT, -- Храним как JSON строку '["Action", "RPG"]'
      year INTEGER,
      platform TEXT, -- Храним как JSON строку '["PC", "PS5"]'
      publisher_id INTEGER,
      developer_id INTEGER,
      rating REAL DEFAULT 0.0, -- Будет обновляться триггером или сервисом
      description TEXT,
      image_url TEXT,
      FOREIGN KEY (publisher_id) REFERENCES publishers (id),
      FOREIGN KEY (developer_id) REFERENCES developers (id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      game_id INTEGER NOT NULL,
      rank INTEGER CHECK(rank >= 1 AND rank <= 10), -- Оценка от 1 до 10
      review_text TEXT,
      status TEXT CHECK(status IN ('review', 'approved', 'rejected')) DEFAULT 'review',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE, -- Удалять отзывы при удалении пользователя
      FOREIGN KEY (game_id) REFERENCES games (id) ON DELETE CASCADE  -- Удалять отзывы при удалении игры
    )`, (err) => {
        if (err) {
            console.error("Error creating reviews table:", err.message);
        } else {
            console.log("Tables created successfully (if they didn't exist).");
            // Можно добавить создание триггера для обновления рейтинга игры
            createRatingUpdateTrigger();
        }
        // Закрываем соединение после выполнения всех команд
        // db.close(); // Не закрываем здесь, если connection.js экспортирует открытое соединение
    });
  });
};

// Триггер для автоматического пересчета рейтинга игры при добавлении/изменении/удалении ОДОБРЕННОГО отзыва
const createRatingUpdateTrigger = () => {
    const triggerSQL = `
        CREATE TRIGGER IF NOT EXISTS update_game_rating
        AFTER INSERT OR UPDATE OF status, rank ON reviews
        WHEN NEW.status = 'approved' OR (OLD.status = 'approved' AND NEW.status != 'approved') OR (OLD.status = 'approved' AND NEW.rank != OLD.rank)
        BEGIN
            UPDATE games
            SET rating = (
                SELECT AVG(rank)
                FROM reviews
                WHERE game_id = NEW.game_id AND status = 'approved'
            )
            WHERE id = NEW.game_id;
        END;
    `;
    // Добавить аналогичный триггер для DELETE
    const deleteTriggerSQL = `
        CREATE TRIGGER IF NOT EXISTS update_game_rating_on_delete
        AFTER DELETE ON reviews
        WHEN OLD.status = 'approved'
        BEGIN
            UPDATE games
            SET rating = (
                SELECT COALESCE(AVG(rank), 0.0) -- Используем COALESCE для случая, когда не осталось одобренных отзывов
                FROM reviews
                WHERE game_id = OLD.game_id AND status = 'approved'
            )
            WHERE id = OLD.game_id;
        END;
    `;

    db.exec(triggerSQL, (err) => {
        if (err) console.error("Error creating update rating trigger:", err.message);
        else console.log("Update rating trigger created successfully.");
    });
    db.exec(deleteTriggerSQL, (err) => {
        if (err) console.error("Error creating delete rating trigger:", err.message);
        else console.log("Delete rating trigger created successfully.");
    });
};


// Проверяем, запускается ли скрипт напрямую
if (require.main === module) {
    createTables();
}

module.exports = { createTables }; // Экспортируем, если нужно вызвать из другого места
```
*Примечание: Использование JSON для `genre` и `platform` - это компромисс для SQLite, чтобы избежать сложных M2M таблиц в рамках 20 часов. Фильтрация по ним будет чуть сложнее (использовать `LIKE '%"Action"%'`). Альтернатива - отдельные таблицы `genres`, `platforms` и связующие таблицы `game_genres`, `game_platforms`.*
*Триггеры в SQLite могут быть полезны для автоматического обновления рейтинга, но добавляют сложности. Альтернатива - пересчитывать рейтинг в `review.service.js` при изменении статуса отзыва.*

**5. `utils/hash.util.js`:**

```javascript
const bcrypt = require('bcrypt');
const saltRounds = 10; // Степень сложности хеширования

const hashPassword = async (plainPassword) => {
  try {
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(plainPassword, salt);
    return hash;
  } catch (error) {
    console.error("Error hashing password:", error);
    throw new Error("Password hashing failed"); // Пробрасываем ошибку выше
  }
};

const comparePassword = async (plainPassword, hashedPassword) => {
  try {
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
    return isMatch;
  } catch (error) {
    console.error("Error comparing password:", error);
    return false; // В случае ошибки сравнения считаем, что пароли не совпадают
  }
};

module.exports = {
  hashPassword,
  comparePassword,
};
```

**6. `utils/jwt.util.js`:**

```javascript
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const secret = process.env.JWT_SECRET;
if (!secret) {
    throw new Error('JWT_SECRET is not defined in .env file!');
}

const generateToken = (payload) => {
  // Payload должен содержать id пользователя и его роль
  // Устанавливаем срок жизни токена, например, 1 час
  return jwt.sign(payload, secret, { expiresIn: '1h' });
};

const verifyToken = (token) => {
  try {
    // Верифицируем токен и возвращаем payload (данные пользователя)
    return jwt.verify(token, secret);
  } catch (error) {
    // Если токен невалидный (истек, подделан) - вернется null или ошибка
    console.error("JWT verification failed:", error.message);
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken,
};
```

**7. `middleware/authenticateToken.js`:**

```javascript
const { verifyToken } = require('../utils/jwt.util');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) {
    console.log('Authentication failed: No token provided.');
    return res.sendStatus(401); // Unauthorized - нет токена
  }

  const userData = verifyToken(token);

  if (!userData) {
     console.log('Authentication failed: Invalid token.');
    return res.sendStatus(403); // Forbidden - токен невалидный или истек
  }

  // Добавляем данные пользователя в объект запроса для дальнейшего использования
  req.user = userData; // userData содержит { id, role }
  console.log('User authenticated:', req.user);
  next(); // Передаем управление следующему middleware или контроллеру
};

module.exports = authenticateToken;
```

**8. `middleware/isAdmin.js`:**

```javascript
const isAdmin = (req, res, next) => {
  // Этот middleware должен вызываться ПОСЛЕ authenticateToken
  if (!req.user || req.user.role !== 'admin') {
    console.log(`Authorization failed: User ${req.user?.id} is not an admin. Role: ${req.user?.role}`);
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' }); // Forbidden
  }
  console.log(`Admin access granted for user: ${req.user.id}`);
  next(); // Пользователь - админ, разрешаем доступ
};

module.exports = isAdmin;
```

**9. `routes/auth.routes.js`:**

```javascript
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/login
router.post('/login', authController.login);

module.exports = router;
```

**10. `controllers/auth.controller.js`:**

```javascript
const authService = require('../services/auth.service');

const register = async (req, res, next) => {
  const { login, password } = req.body;

  if (!login || !password) {
    return res.status(400).json({ message: 'Login and password are required' });
  }

  try {
    const result = await authService.registerUser(login, password);
    // Не отправляем токен при регистрации, требуем логина
    res.status(201).json({ message: 'User registered successfully. Please log in.' });
  } catch (error) {
     // Ловим специфичные ошибки из сервиса
     if (error.message === 'Login already exists') {
        return res.status(409).json({ message: error.message }); // Conflict
     }
     console.error("Registration error:", error);
     // Передаем общую ошибку в центральный обработчик (если он есть) или отправляем 500
     // next(error); // Если есть центральный обработчик
     res.status(500).json({ message: 'Internal server error during registration' });
  }
};

const login = async (req, res, next) => {
  const { login, password } = req.body;

  if (!login || !password) {
    return res.status(400).json({ message: 'Login and password are required' });
  }

  try {
    const result = await authService.loginUser(login, password);
    if (!result) {
      // Сервис вернул null, значит логин/пароль неверны или юзер заблокирован
      return res.status(401).json({ message: 'Invalid login credentials or user blocked' });
    }
    // Отправляем токен клиенту
    res.json({ token: result.token });
  } catch (error) {
    console.error("Login error:", error);
    // next(error); // Если есть центральный обработчик
    res.status(500).json({ message: 'Internal server error during login' });
  }
};

module.exports = {
  register,
  login,
};
```

**11. `services/auth.service.js` (Пример с SQL):**

```javascript
const db = require('../db/connection');
const { hashPassword, comparePassword } = require('../utils/hash.util');
const { generateToken } = require('../utils/jwt.util');

// Промисификация методов db для использования async/await
const dbRun = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function (err) { // Используем function для доступа к this.lastID
    if (err) reject(err);
    else resolve({ lastID: this.lastID, changes: this.changes });
  });
});

const dbGet = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => {
    if (err) reject(err);
    else resolve(row);
  });
});

const registerUser = async (login, password) => {
  // 1. Проверить, существует ли пользователь
  const existingUser = await dbGet('SELECT id FROM users WHERE login = ?', [login]);
  if (existingUser) {
    throw new Error('Login already exists');
  }

  // 2. Хешировать пароль
  const hashedPassword = await hashPassword(password);

  // 3. Сохранить пользователя в БД (роль по умолчанию 'user', статус 'active')
  const sql = `INSERT INTO users (login, password, role, status) VALUES (?, ?, 'user', 'active')`;
  try {
    const result = await dbRun(sql, [login, hashedPassword]);
    return { id: result.lastID, login }; // Возвращаем id и логин нового пользователя
  } catch (dbError) {
      console.error("DB Error on user insert:", dbError);
      throw new Error("Failed to register user"); // Обобщенная ошибка для контроллера
  }
};

const loginUser = async (login, password) => {
  // 1. Найти пользователя по логину
  const sql = 'SELECT id, password, role, status FROM users WHERE login = ?';
  const user = await dbGet(sql, [login]);

  if (!user) {
    return null; // Пользователь не найден
  }

  // 2. Проверить статус пользователя
  if (user.status === 'blocked') {
      console.log(`Login attempt failed: User ${login} is blocked.`);
      return null; // Заблокированный пользователь не может войти
  }

  // 3. Сравнить хеш пароля
  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    return null; // Пароль неверный
  }

  // 4. Сгенерировать JWT токен
  const payload = { id: user.id, role: user.role };
  const token = generateToken(payload);

  return { token }; // Возвращаем токен
};

module.exports = {
  registerUser,
  loginUser,
};
```

**12. `server.js`:**

```javascript
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
require('./db/connection'); // Инициализируем подключение к БД

// Загрузка переменных окружения
dotenv.config();

// Импорт роутов
const authRoutes = require('./routes/auth.routes');
const gameRoutes = require('./routes/game.routes');
const reviewRoutes = require('./routes/review.routes');
const userRoutes = require('./routes/user.routes');

// Создание приложения Express
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Разрешаем запросы с других доменов (настройте более строго для продакшена)
app.use(express.json()); // Для парсинга JSON тел запросов
app.use(express.urlencoded({ extended: true })); // Для парсинга URL-encoded тел

// Подключение роутов
app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/reviews', reviewRoutes); // Исправлено с 'rewiews' на 'reviews'
app.use('/api/users', userRoutes);

// Базовый маршрут
app.get('/', (req, res) => {
  res.send('Game Catalog API is running!');
});

// Простой обработчик ошибок (можно сделать более сложным)
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack);
  res.status(500).json({ message: 'Something went wrong on the server!' });
});


// Запуск сервера
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
```

**Дальнейшие Шаги:**

1.  **Реализовать остальные роуты, контроллеры и сервисы** по аналогии с `auth`.
2.  **Написать SQL-запросы** в сервисах для получения/изменения данных игр, отзывов, пользователей, учитывая пагинацию, поиск, фильтры. Для сложных запросов (фильтрация, пагинация) может потребоваться динамическое построение SQL.
3.  **Использовать `authenticateToken` и `isAdmin`** в файлах роутов для защиты эндпоинтов. Например:
    ```javascript
    // В review.routes.js
    const authenticateToken = require('../middleware/authenticateToken');
    const isAdmin = require('../middleware/isAdmin');
    const reviewController = require('../controllers/review.controller');

    // Получение отзывов на модерацию (только админ)
    router.get('/', authenticateToken, isAdmin, reviewController.getPendingReviews);
    // Изменение статуса отзыва (только админ)
    router.put('/:id/status', authenticateToken, isAdmin, reviewController.updateReviewStatus);
    // Удаление отзыва (только админ)
    router.delete('/:id', authenticateToken, isAdmin, reviewController.deleteReview);

    // В game.routes.js
    // Оставить отзыв (только авторизованный пользователь)
    router.post('/:id/review', authenticateToken, gameController.submitReview); // isAdmin не нужен
    ```
4.  **Продумать обработку ошибок** более детально (например, возвращать 404 Not Found, если игра или пользователь не найдены).
5.  **Написать отчет**, описывающий архитектуру, API, структуру БД и принятые решения.

Эта структура и примеры дают хороший старт для выполнения вашего ТЗ в рамках 20 часов. Удачи!