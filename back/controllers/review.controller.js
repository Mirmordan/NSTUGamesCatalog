// --- START OF FILE review.controller.js ---

// controllers/review.controller.js
// --- Импорты ---
const reviewService = require('../services/review.service');
// УДАЛЕНО: const db = require('../db/connection');
// Импортируем dbGet ИЗ УТИЛИТ для проверки существования в updateReviewStatus
const { dbGet } = require('../utils/db.util');

// Локальное определение dbGet УДАЛЕНО

// --- Контроллеры (Пользователи) ---

const submitReview = async (req, res, next) => {
    const { rank, review_text } = req.body;
    const gameId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    // ... (валидация gameId, rank, review_text - без изменений) ...
    if (isNaN(gameId)) { /*...*/ }
    if (!rank || typeof rank !== 'number' || rank < 1 || rank > 10) { /*...*/ }
    if (review_text !== undefined && typeof review_text !== 'string') { /*...*/ }

    try {
        const newReview = await reviewService.createReview(userId, gameId, rank, review_text || '');
        res.status(201).json({ message: 'Отзыв успешно отправлен и ожидает одобрения.', review: newReview });
    } catch (error) {
        console.error("Ошибка в контроллере submitReview:", error.message);
        // ... (обработка ошибок - без изменений) ...
        if (error.message.includes('уже оставил отзыв')) { return res.status(409).json({ message: error.message }); }
        if (error.message.includes('Убедитесь, что игра существует') || error.message.includes('проверьте оценку')) { return res.status(400).json({ message: error.message }); }
        if (error.message.includes('Не удалось создать отзыв')) { return res.status(500).json({ message: 'Внутренняя ошибка сервера при отправке отзыва.' }); }
        res.status(500).json({ message: 'Произошла непредвиденная ошибка при отправке отзыва.' });
    }
};

const getGameReviews = async (req, res, next) => {
    const gameId = parseInt(req.params.id, 10);
    if (isNaN(gameId)) {
        return res.status(400).json({ message: 'Неверный формат ID игры.' });
    }
    try {
        // Вызываем сервис для получения отзывов
        const reviews = await reviewService.findApprovedReviewsByGameId(gameId);
        res.json(reviews);
    } catch (error) {
        console.error(`Ошибка при получении отзывов для игры ${gameId}:`, error);
        res.status(500).json({ message: 'Внутренняя ошибка сервера при получении отзывов игры.' });
    }
};

const getOwnReview = async (req, res, next) => {
    const gameId = parseInt(req.params.id, 10);
    const userId = req.user.id;
    if (isNaN(gameId)) { /*...*/ }
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

const updateOwnReview = async (req, res, next) => {
    const gameId = parseInt(req.params.id, 10);
    const userId = req.user.id;
    const { rank, review_text } = req.body;
    // ... (валидация - без изменений) ...
    if (isNaN(gameId)) { /*...*/ }
    if (rank !== undefined && (typeof rank !== 'number' || rank < 1 || rank > 10)) { /*...*/ }
    if (review_text !== undefined && typeof review_text !== 'string') { /*...*/ }
    if (rank === undefined && review_text === undefined) { /*...*/ }

    const updateData = {};
    if (rank !== undefined) updateData.rank = rank;
    if (review_text !== undefined) updateData.review_text = review_text;

    try {
        const updatedReview = await reviewService.updateUserReviewForGame(userId, gameId, updateData);
        // Сервис сам выбрасывает ошибку 404, если отзыв не найден
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

// --- Контроллеры (Модерация) ---

const getPendingReviews = async (req, res, next) => {
    try {
        const reviews = await reviewService.findPendingReviews();
        res.json(reviews);
    } catch (error) {
        console.error("Ошибка в контроллере getPendingReviews:", error);
        res.status(500).json({ message: 'Внутренняя ошибка сервера при получении отзывов на модерацию.' });
    }
};

const updateReviewStatus = async (req, res, next) => {
    const reviewId = parseInt(req.params.id, 10);
    const { status } = req.body;
    // ... (валидация - без изменений) ...
    if (isNaN(reviewId)) { /*...*/ }
    const allowedStatuses = ['approved', 'rejected', 'review'];
    if (!status || !allowedStatuses.includes(status)) { /*...*/ }

    try {
        // Вызываем сервис
        const result = await reviewService.updateStatus(reviewId, status);

        if (result.changes === 0) {
            // Проверяем существование с помощью ИМПОРТИРОВАННОЙ dbGet из utils/db.util.js
            const exists = await dbGet('SELECT 1 FROM reviews WHERE id = ?', [reviewId]);
            if (!exists) {
                return res.status(404).json({ message: `Отзыв с ID ${reviewId} не найден.` });
            } else {
                 res.json({ message: `Статус отзыва ${reviewId} уже установлен на '${status}' или изменение не требуется.` });
            }
        } else {
           res.json({ message: `Статус отзыва ${reviewId} обновлен на '${status}'.` });
        }
    } catch (error) {
        console.error("Ошибка в контроллере updateReviewStatus:", error);
        // ... (обработка ошибок - без изменений) ...
        if (error.message.startsWith('Недопустимое значение статуса')) { return res.status(400).json({ message: error.message }); }
        res.status(500).json({ message: 'Внутренняя ошибка сервера при обновлении статуса отзыва.' });
    }
};

const deleteReview = async (req, res, next) => {
    const reviewId = parseInt(req.params.id, 10);
    if (isNaN(reviewId)) { /*...*/ }

    try {
        // Вызываем сервис
        const result = await reviewService.deleteById(reviewId);
        if (result.changes === 0) {
            // Сервис сам проверяет существование, так что changes=0 означает "не найден"
            return res.status(404).json({ message: `Отзыв с ID ${reviewId} не найден.` });
        }
        res.json({ message: `Отзыв ${reviewId} успешно удален.` });
    } catch (error) {
        console.error("Ошибка в контроллере deleteReview:", error);
        res.status(500).json({ message: 'Внутренняя ошибка сервера при удалении отзыва.' });
    }
};

// --- Экспорт ---
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