const authService = require('../services/auth.service');

const register = async (req, res, next) => {
    const { login, password } = req.body;
    // console.log("Login :",login, password);

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