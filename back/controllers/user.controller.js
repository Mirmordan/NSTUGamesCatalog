// controllers/user.controller.js
// --- Зависимости ---
const userService = require('../services/user.service');

// --- Контроллеры (Управление Пользователями) ---

// Получает список всех пользователей (только Администратор).
const getAllUsers = async (req, res, next) => {
    try {
        const users = await userService.findAllUsers();
        res.json(users);
    } catch (error) {
        console.error("Ошибка в userController.getAllUsers:", error);
        res.status(500).json({ message: 'Внутренняя ошибка сервера при получении пользователей.' });
    }
};

// Обновляет статус пользователя (active/blocked) (только Администратор).
const updateUserStatus = async (req, res, next) => {
    const userId = parseInt(req.params.id, 10);
    const { status } = req.body;

    if (isNaN(userId)) {
        return res.status(400).json({ message: 'Неверный формат ID пользователя.' });
    }
    if (!status) {
        return res.status(400).json({ message: 'Требуется новый статус в теле запроса.' });
    }
    if (status !== 'active' && status !== 'blocked') {
         return res.status(400).json({ message: "Неверное значение статуса. Должно быть 'active' или 'blocked'." });
    }

    try {
        await userService.updateUserStatus(userId, status);
        res.json({ message: `Статус пользователя ${userId} успешно обновлен на '${status}'.` });

    } catch (error) {
        console.error(`Ошибка в userController.updateUserStatus для пользователя ${userId}:`, error);

        if (error.message.startsWith('Invalid status value')) { // Исправлено на проверку, соответствующую исходному коду
            return res.status(400).json({ message: error.message });
        }
        if (error.message.includes('not found')) { // Исправлено на проверку, соответствующую исходному коду
             return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Внутренняя ошибка сервера при обновлении статуса пользователя.' });
    }
};

// --- Контроллеры (Профили Пользователей) ---

// Получает информацию о профиле пользователя (логин и статус).
const getUserProfile = async (req, res, next) => {
    const userId = parseInt(req.params.id, 10);

    if (isNaN(userId)) {
        return res.status(400).json({ message: 'Неверный формат ID пользователя.' });
    }

    try {
        const userProfile = await userService.getUserProfile(userId);
        res.json(userProfile);
    } catch (error) {
        console.error(`Ошибка в userController.getUserProfile для пользователя ${userId}:`, error);
        if (error.message.includes('not found')) {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Внутренняя ошибка сервера при получении профиля пользователя.' });
    }
};

// --- Экспорт ---
module.exports = {
    getAllUsers,
    updateUserStatus,
    getUserProfile, 
};