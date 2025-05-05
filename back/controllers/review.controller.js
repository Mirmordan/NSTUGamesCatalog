// --- START OF FILE review.controller.js ---

const reviewService = require('../services/review.service');

// --- Вспомогательная функция dbGet ---
const db = require('../db/connection');
const dbGet = (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
        if (err) reject(err); else resolve(row);
    });
});
// ---

/**
 * Обрабатывает POST /api/reviews/game/:id
 * Отправляет новый отзыв.
 */
const submitReview = async (req, res, next) => {
    // ... (без изменений) ...
    const { rank, review_text } = req.body;
    const gameId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    if (isNaN(gameId)) {
         return res.status(400).json({ message: 'Неверный формат ID игры.' });
    }
    if (!rank || typeof rank !== 'number' || rank < 1 || rank > 10) {
        return res.status(400).json({ message: 'Оценка обязательна и должна быть числом от 1 до 10.' });
    }
    if (review_text !== undefined && typeof review_text !== 'string') {
        return res.status(400).json({ message: 'Текст отзыва должен быть строкой.' });
    }

    try {
        const newReview = await reviewService.createReview(userId, gameId, rank, review_text || '');
        res.status(201).json({ message: 'Отзыв успешно отправлен и ожидает одобрения.', review: newReview });
    } catch (error) {
        console.error("Ошибка в контроллере submitReview:", error.message);
        if (error.message.includes('уже оставил отзыв')) {
             return res.status(409).json({ message: error.message });
        }
        if (error.message.includes('Убедитесь, что игра существует') || error.message.includes('Неверный ID пользователя или игры')) {
             return res.status(404).json({ message: 'Не удалось отправить отзыв. Игра не найдена или пользователь недействителен.' });
        }
         if (error.message.includes('Не удалось создать отзыв')) {
             return res.status(500).json({ message: 'Внутренняя ошибка сервера при отправке отзыва.' });
        }
        res.status(500).json({ message: 'Произошла непредвиденная ошибка при отправке отзыва.' });
    }
};

/**
 * Обрабатывает GET /api/reviews/game/:id
 * Получает все одобренные ('approved') отзывы для игры.
 */
const getGameReviews = async (req, res, next) => {
    // ... (без изменений, вызывает сервис, который теперь ищет 'approved') ...
    const gameId = parseInt(req.params.id, 10);

    if (isNaN(gameId)) {
        return res.status(400).json({ message: 'Неверный формат ID игры.' });
    }

    try {
        // Сервис findApprovedReviewsByGameId теперь ищет статус 'approved'
        const reviews = await reviewService.findApprovedReviewsByGameId(gameId);
        res.json(reviews);
    } catch (error) {
        console.error(`Ошибка при получении отзывов для игры ${gameId}:`, error);
        res.status(500).json({ message: 'Внутренняя ошибка сервера при получении отзывов игры.' });
    }
};

/**
 * Обрабатывает GET /api/reviews/game/:id/my
 * Получает собственный отзыв пользователя.
 */
const getOwnReview = async (req, res, next) => {
    // ... (без изменений) ...
    const gameId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    if (isNaN(gameId)) {
        return res.status(400).json({ message: 'Неверный формат ID игры.' });
    }

    try {
        const review = await reviewService.findUserReviewForGame(userId, gameId);
        if (!review) {
            return res.status(404).json({ message: 'Вы еще не оставляли отзыв для этой игры.' });
        }
        res.json(review);
    } catch (error) {
        console.error(`Ошибка при получении собственного отзыва для игры ${gameId}, пользователь ${userId}:`, error);
        res.status(500).json({ message: 'Внутренняя ошибка сервера при получении вашего отзыва.' });
    }
};

/**
 * Обрабатывает PUT /api/reviews/game/:id/my
 * Обновляет собственный отзыв пользователя. Статус сбрасывается на 'review'.
 */
const updateOwnReview = async (req, res, next) => {
    // ... (без изменений, сервис ставит 'review') ...
    const gameId = parseInt(req.params.id, 10);
    const userId = req.user.id;
    const { rank, review_text } = req.body;

    if (isNaN(gameId)) {
        return res.status(400).json({ message: 'Неверный формат ID игры.' });
    }
    if (rank !== undefined && (typeof rank !== 'number' || rank < 1 || rank > 10)) {
        return res.status(400).json({ message: 'Если оценка передана, она должна быть числом от 1 до 10.' });
    }
    if (review_text !== undefined && typeof review_text !== 'string') {
        return res.status(400).json({ message: 'Если текст отзыва передан, он должен быть строкой.' });
    }
    if (rank === undefined && review_text === undefined) {
        return res.status(400).json({ message: 'Нет данных для обновления. Передайте rank и/или review_text.' });
    }

    const updateData = {};
    if (rank !== undefined) updateData.rank = rank;
    if (review_text !== undefined) updateData.review_text = review_text;

    try {
        const updatedReview = await reviewService.updateUserReviewForGame(userId, gameId, updateData);
        if (!updatedReview) {
             return res.status(404).json({ message: 'Не удалось обновить отзыв. Вы еще не оставляли отзыв для этой игры или он был удален.' });
        }
         res.json({ message: 'Ваш отзыв был обновлен и отправлен на повторную модерацию.', review: updatedReview });
    } catch (error) {
        console.error(`Ошибка при обновлении собственного отзыва для игры ${gameId}, пользователь ${userId}:`, error);
         if (error.message === 'Отзыв для данного пользователя и игры не найден.') {
            return res.status(404).json({ message: 'Не удалось обновить отзыв. Отзыв не найден.' });
        }
         if (error.message.includes('Ошибка валидации')) {
             return res.status(400).json({ message: error.message });
         }
        res.status(500).json({ message: 'Внутренняя ошибка сервера при обновлении вашего отзыва.' });
    }
};


// --- Функции для модерации (Только Администратор) ---

/**
 * Обрабатывает GET /api/reviews/
 * Получает отзывы на модерацию ('review').
 */
const getPendingReviews = async (req, res, next) => {
    // ... (без изменений) ...
    try {
        const reviews = await reviewService.findPendingReviews();
        res.json(reviews);
    } catch (error) {
        console.error("Ошибка в контроллере getPendingReviews:", error);
        res.status(500).json({ message: 'Внутренняя ошибка сервера при получении отзывов на модерацию.' });
    }
};

/**
 * Обрабатывает PUT /api/reviews/:id/status
 * Обновляет статус отзыва. Допустимые значения: 'approved', 'rejected', 'review'.
 */
const updateReviewStatus = async (req, res, next) => {
    const reviewId = parseInt(req.params.id, 10);
    const { status } = req.body;

    if (isNaN(reviewId)) {
        return res.status(400).json({ message: 'Неверный формат ID отзыва.' });
    }
    // Заменили 'ok' на 'approved' в списке допустимых статусов и сообщении
    const allowedStatuses = ['approved', 'rejected', 'review'];
    if (!status || !allowedStatuses.includes(status)) {
         return res.status(400).json({ message: `Требуется новый статус, и он должен быть одним из: ${allowedStatuses.join(', ')}.` });
    }


    try {
        const result = await reviewService.updateStatus(reviewId, status);

        if (result.changes === 0) {
             const exists = await dbGet('SELECT 1 FROM reviews WHERE id = ?', [reviewId]);
             if (!exists) {
                 return res.status(404).json({ message: `Отзыв с ID ${reviewId} не найден.` });
             } else {
                  // Обновили сообщение для случая, когда статус не изменился
                  res.json({ message: `Статус отзыва ${reviewId} уже установлен на '${status}' или изменение не требуется.` });
             }
        } else {
            // Обновили сообщение об успехе
            res.json({ message: `Статус отзыва ${reviewId} обновлен на '${status}'.` });
        }
    } catch (error) {
        console.error("Ошибка в контроллере updateReviewStatus:", error);
        // Обновили проверку сообщения об ошибке из сервиса
        if (error.message.startsWith('Недопустимое значение статуса') || error.message.includes('не разрешено ограничением базы данных')) {
             return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Внутренняя ошибка сервера при обновлении статуса отзыва.' });
    }
};

/**
 * Обрабатывает DELETE /api/reviews/:id
 * Удаляет отзыв.
 */
const deleteReview = async (req, res, next) => {
    // ... (без изменений) ...
    const reviewId = parseInt(req.params.id, 10);

     if (isNaN(reviewId)) {
        return res.status(400).json({ message: 'Неверный формат ID отзыва.' });
    }

    try {
        const result = await reviewService.deleteById(reviewId);
        if (result.changes === 0) {
            return res.status(404).json({ message: `Отзыв с ID ${reviewId} не найден.` });
        }
         res.json({ message: `Отзыв ${reviewId} успешно удален.` });
    } catch (error) {
        console.error("Ошибка в контроллере deleteReview:", error);
        res.status(500).json({ message: 'Внутренняя ошибка сервера при удалении отзыва.' });
    }
};


module.exports = {
    submitReview,
    getGameReviews,
    getOwnReview,
    updateOwnReview,
    getPendingReviews,
    updateReviewStatus,
    deleteReview,
};
// --- END OF FILE review.controller.js ---