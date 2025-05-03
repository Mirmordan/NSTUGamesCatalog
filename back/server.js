// Импортируем Express
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
require('./db/connection');
dotenv.config();

const authRoutes = require('./routes/auth.routes');
const gameRoutes = require('./routes/game.routes');
const reviewRoutes = require('./routes/review.routes');

// Создаем экземпляр приложения Express
const app = express();

// Определяем порт, на котором будет работать сервер
// Используем переменную окружения PORT или 3001 по умолчанию
const PORT = process.env.PORT || 3001;

app.use(cors()); // Разрешаем запросы с других доменов (настройте более строго для продакшена)
app.use(express.json()); // Для парсинга JSON тел запросов
app.use(express.urlencoded({ extended: true })); // Для парсинга URL-encoded тел

app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/reviews', reviewRoutes);

// Простой маршрут для корневого URL ('/')
// Когда кто-то зайдет на http://localhost:3001/, он получит это сообщение
app.get('/', (req, res) => {
  res.send('Привет от простого Node.js сервера!');
});

// Добавляем еще один пример маршрута
app.get('/api/message', (req, res) => {
  res.json({ message: 'Это сообщение от API бэкенда!' });
});

// Простой обработчик ошибок (можно сделать более сложным)
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack);
  res.status(500).json({ message: 'Something went wrong on the server!' });
});

// Запускаем сервер и начинаем слушать указанный порт
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log(`Перейдите по адресу http://localhost:${PORT}/`);
});

