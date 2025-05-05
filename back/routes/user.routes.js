// routes/user.routes.js

//                                                          --- Зависимости ---
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authenticateToken = require('../middleware/authenticateToken');
const isAdmin = require('../middleware/isAdmin');

//                                           --- Маршруты для управления пользователями (Администратор) ---

// GET /api/users - Получение списка всех пользователей
router.get(
    '/',
    authenticateToken,
    isAdmin,
    userController.getAllUsers
);

// PUT /api/users/:id - Обновление статуса пользователя (active/blocked)
router.put(
    '/:id',
    authenticateToken,
    isAdmin,
    userController.updateUserStatus
);

//                                                          --- Экспорт ---
module.exports = router;