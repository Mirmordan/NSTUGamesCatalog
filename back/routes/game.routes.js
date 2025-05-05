// routes/game.routes.js

// --- Зависимости ---
const express = require('express');
const router = express.Router();
const gameController = require('../controllers/game.controller');

// --- Публичные маршруты ---

// GET /api/games - Получение списка игр
router.get('/', gameController.getGamesList);

// GET /api/games/:id - Получение детальной информации об игре
router.get('/:id', gameController.getGameDetails);

// --- Экспорт ---
module.exports = router;