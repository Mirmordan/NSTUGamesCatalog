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