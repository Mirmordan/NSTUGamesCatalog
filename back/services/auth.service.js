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