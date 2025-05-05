const { verifyToken } = require('../utils/jwt.util');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 

    if (token == null) {
        console.log('Ошибка авторизации, нет токена.');
        return res.sendStatus(401); // Unauthorized - нет токена
    }

    const userData = verifyToken(token);

    if (!userData) {
        console.log('Ошибка авторизации, неверный токен.');
        return res.sendStatus(403); // Forbidden - токен невалидный или истек
    }

    // Добавляем данные пользователя в объект запроса для дальнейшего использования
    req.user = userData; 
    console.log('Пользователь авторизован:', req.user);
    next(); 
};

module.exports = authenticateToken;