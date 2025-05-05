// routes/review.routes.js

//                                                              --- Зависимости ---
const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const authenticateToken = require('../middleware/authenticateToken'); // Middleware для проверки токена
const isAdmin = require('../middleware/isAdmin'); // Middleware для проверки прав администратора

//                                                  --- Маршруты для отзывов конкретной игры ---

// POST /api/reviews/game/:id - Отправка отзыва для игры
// Требуется аутентификация пользователя.
router.post(
    '/game/:id',
    authenticateToken,
    reviewController.submitReview
);

// GET /api/reviews/game/:id - Получение одобренных отзывов для игры (Публичный доступ)
router.get(
    '/game/:id',
    reviewController.getGameReviews
);

// GET /api/reviews/game/:id/my - Получение *своего* отзыва для игры
// Требуется аутентификация пользователя.
router.get(
    '/game/:id/my',
    authenticateToken,
    reviewController.getOwnReview // Контроллер для получения своего отзыва
);

// PUT /api/reviews/game/:id/my - Обновление *своего* отзыва для игры
// Требуется аутентификация пользователя.
router.put(
    '/game/:id/my',
    authenticateToken,
    reviewController.updateOwnReview
);


//                                              --- Маршруты для модерации отзывов (Только Администратор) ---

// GET /api/reviews/ - Получение отзывов на модерацию
// Требуется аутентификация и права администратора.
router.get(
    '/',
    authenticateToken,
    isAdmin,
    reviewController.getPendingReviews
);

// PUT /api/reviews/:id/status - Обновление статуса отзыва (Администратор)
// Требуется аутентификация и права администратора.
router.put(
    '/:id/status',
    authenticateToken,
    isAdmin,
    reviewController.updateReviewStatus
);

// DELETE /api/reviews/:id - Удаление отзыва (Администратор)
// Требуется аутентификация и права администратора.
router.delete(
    '/:id',
    authenticateToken,
    isAdmin,
    reviewController.deleteReview
);

//                                                              --- Экспорт ---
module.exports = router;