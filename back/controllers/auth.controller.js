// controllers/auth.controller.js
// --- Импорты ---
const authService = require('../services/auth.service');

// Обрабатывает запрос на регистрацию нового пользователя.
const register = async (req, res, next) => {
    const { login, password } = req.body;

    if (!login || !password) {
        return res.status(400).json({ message: 'Login and password are required' });
    }

    try {
        const result = await authService.registerUser(login, password);
        res.status(201).json({ message: 'User registered successfully. Please log in.' });
    } catch (error) {
        if (error.message === 'Login already exists') {
            return res.status(409).json({ message: error.message }); // Conflict
        }
        console.error("Registration error:", error);
        res.status(500).json({ message: 'Internal server error during registration' });
    }
};

// Обрабатывает запрос на аутентификацию пользователя.
const login = async (req, res, next) => {
    const { login, password } = req.body;

    if (!login || !password) {
        return res.status(400).json({ message: 'Login and password are required' });
    }

    try {
        const result = await authService.loginUser(login, password);
        if (!result) {
            return res.status(401).json({ message: 'Invalid login credentials or user blocked' });
        }
        res.json({ token: result.token });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: 'Internal server error during login' });
    }
};

// --- Экспорт ---
module.exports = {
    register,
    login,
};