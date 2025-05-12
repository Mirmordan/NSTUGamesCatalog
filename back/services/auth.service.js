// services/auth.service.js

// Импортируем хелперы из нового файла утилит
const { dbRun, dbGet } = require('../utils/db.util');
const { hashPassword, comparePassword } = require('../utils/hash.util');
const { generateToken } = require('../utils/jwt.util');

// Локальные определения dbRun, dbGet УДАЛЕНЫ

const registerUser = async (login, password) => {
    // Используем импортированную dbGet
    const existingUser = await dbGet('SELECT id FROM users WHERE login = ?', [login]);
    if (existingUser) {
        throw new Error('Login already exists');
    }

    const hashedPassword = await hashPassword(password);
    const sql = `INSERT INTO users (login, password, role, status) VALUES (?, ?, 'user', 'active')`;
    try {
        // Используем импортированную dbRun
        const result = await dbRun(sql, [login, hashedPassword]);
        return { id: result.lastID, login };
    } catch (dbError) {
        console.error("DB Error on user insert:", dbError);
        throw new Error("Failed to register user");
    }
};

const loginUser = async (login, password) => {
    const sql = 'SELECT id, password, role, status FROM users WHERE login = ?';
    // Используем импортированную dbGet
    const user = await dbGet(sql, [login]);

    if (!user || user.status === 'blocked') {
        if (user && user.status === 'blocked') {
             console.log(`Login attempt failed: User ${login} is blocked.`);
        }
        return null; // Пользователь не найден или заблокирован
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
        return null; // Пароль неверный
    }

    const payload = { id: user.id, role: user.role };
    const token = generateToken(payload);
    return { token };
};

module.exports = {
    registerUser,
    loginUser,
};