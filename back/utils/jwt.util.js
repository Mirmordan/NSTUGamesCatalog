const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const secret = process.env.JWT_SECRET;
if (!secret) {
    throw new Error('Отсутствует .env переменная JWT_SECRET ');
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
        console.error("JWT неверный токен",token, error.message);
        return null;
    }
};

module.exports = {
    generateToken,
    verifyToken,
};