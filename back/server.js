// Импортируем Express
const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
require('./db/connection');
dotenv.config();

const authRoutes = require('./routes/auth.routes');
const gameRoutes = require('./routes/game.routes');
const userRoutes = require('./routes/user.routes');
const reviewRoutes = require('./routes/review.routes');

// Создаем экземпляр приложения Express
const app = express();

// Определяем порт, на котором будет работать сервер
// Используем переменную окружения PORT или 3001 по умолчанию
const PORT = process.env.PORT || 3001;

app.use(cors()); // Разрешаем запросы с других доменов (настройте более строго для продакшена)
app.use(express.json()); // Для парсинга JSON тел запросов
app.use(express.urlencoded({ extended: true })); // Для парсинга URL-encoded тел

const staticPath = path.join(__dirname, 'img');
app.use('/api/img', express.static(staticPath));


app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);

app.get('/', (req, res) => {
  res.send('Ухади');
});


app.use((err, req, res, next) => {
  console.error("Необработанная ошибка:", err.stack);
  res.status(500).json({ message: 'Произошла ошибка' });
});

// Запускаем сервер и начинаем слушать указанный порт
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log(`Полный адрес http://localhost:${PORT}/`);
  console.log('Сервер отправляет изображения в /img из:', staticPath); 
});

