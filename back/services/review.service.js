// --- START OF FILE review.service.js ---

const db = require('../db/connection');

// --- Вспомогательные функции для работы с БД (Промисифицированные) ---
// ... (dbRun, dbGet, dbAll - без изменений) ...
const dbRun = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
        if (err) {
            console.error('Ошибка выполнения DB Run:', err.message, 'SQL:', sql, 'Параметры:', params);
            reject(err);
        } else {
            resolve({ lastID: this.lastID, changes: this.changes });
        }
    });
});
const dbGet = (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
        if (err) {
            console.error('Ошибка выполнения DB Get:', err.message, 'SQL:', sql, 'Параметры:', params);
            reject(err);
        } else {
            resolve(row);
        }
    });
});
const dbAll = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error('Ошибка выполнения DB All:', err.message, 'SQL:', sql, 'Параметры:', params);
            reject(err);
        } else {
            resolve(rows);
        }
    });
});


// --- Сервисные функции ---

/**
 * Создает новый отзыв.
 * Статус по умолчанию 'review'.
 */
const createReview = async (userId, gameId, rank, reviewText) => {
    // ... (логика без изменений) ...
    const existingReview = await dbGet('SELECT id FROM reviews WHERE user_id = ? AND game_id = ?', [userId, gameId]);
    if (existingReview) {
       throw new Error('Пользователь уже оставил отзыв на эту игру');
    }

    if (typeof rank !== 'number' || rank < 1 || rank > 10) {
        throw new Error('Оценка должна быть числом от 1 до 10.');
    }
    if (typeof reviewText !== 'string') {
         throw new Error('Текст отзыва должен быть строкой.');
    }

    const sql = `INSERT INTO reviews (user_id, game_id, rank, review_text, status, created_at)
                 VALUES (?, ?, ?, ?, 'review', CURRENT_TIMESTAMP)`;
    try {
        const result = await dbRun(sql, [userId, gameId, rank, reviewText]);
        if (result.lastID) {
             return await dbGet('SELECT id, user_id, game_id, rank, review_text, status, created_at FROM reviews WHERE id = ?', [result.lastID]);
        } else {
            throw new Error('Отзыв не был создан.');
        }
    } catch (error) {
        console.error(`Ошибка создания отзыва для пользователя ${userId} на игру ${gameId}:`, error);
        if (error.code === 'SQLITE_CONSTRAINT') {
             if (error.message.includes('FOREIGN KEY')) {
                 throw new Error('Не удалось создать отзыв. Убедитесь, что игра существует и пользователь действителен.');
             } else if (error.message.includes('CHECK constraint failed')) {
                  // Теперь ошибка CHECK может быть и из-за статуса, если он проверяется в БД
                 throw new Error('Данные отзыва не прошли проверку (проверьте оценку или статус).');
             }
        } else if (error.message === 'Пользователь уже оставил отзыв на эту игру') {
            throw error;
        }
        throw new Error('Не удалось создать отзыв из-за ошибки базы данных.');
    }
};


/**
 * Получает все отзывы, ожидающие модерации (статус = 'review').
 * Включает логин пользователя и название игры. (Администратор)
 */
const findPendingReviews = async () => {
    // ... (SQL запрос без изменений, так как ищет 'review') ...
    const sql = `
        SELECT
            r.id,
            r.rank,
            r.review_text,
            r.status,
            r.created_at,
            u.login AS userLogin,
            g.name AS gameTitle,
            r.user_id,
            r.game_id
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        JOIN games g ON r.game_id = g.id
        WHERE r.status = 'review'
        ORDER BY r.created_at DESC
    `;
    try {
        return await dbAll(sql);
    } catch (error) {
        console.error("Ошибка при получении отзывов на модерацию:", error);
        throw new Error('Не удалось получить отзывы на модерацию.');
    }
};

/**
 * Получает все *одобренные* (статус = 'approved') отзывы для конкретной игры.
 * Включает логин пользователя. (Публично)
 */
const findApprovedReviewsByGameId = async (gameId) => {
    // Заменили 'ok' на 'approved' в условии WHERE
    const sql = `
        SELECT
            r.id,
            r.rank,
            r.review_text,
            r.created_at,
            u.login AS userLogin,
            r.user_id
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.game_id = ? AND r.status = 'approved' -- ИЗМЕНЕНО ЗДЕСЬ
        ORDER BY r.created_at DESC
    `;
    try {
        const reviews = await dbAll(sql, [gameId]);
        return reviews;
    } catch (error) {
        console.error(`Ошибка при получении одобренных отзывов для игры ${gameId}:`, error);
        throw new Error('Не удалось получить отзывы для игры.');
    }
};

/**
 * Находит конкретный отзыв, оставленный указанным пользователем для указанной игры.
 */
const findUserReviewForGame = async (userId, gameId) => {
    // ... (SQL запрос без изменений) ...
    const sql = `
        SELECT
            id, user_id, game_id, rank, review_text, status, created_at
        FROM reviews
        WHERE user_id = ? AND game_id = ?
    `;
    try {
        const review = await dbGet(sql, [userId, gameId]);
        return review || null;
    } catch (error) {
        console.error(`Ошибка при поиске отзыва для пользователя ${userId} и игры ${gameId}:`, error);
        throw new Error('Не удалось получить отзыв пользователя для игры.');
    }
};


/**
 * Обновляет собственный отзыв пользователя для конкретной игры.
 * Сбрасывает статус на 'review'.
 */
const updateUserReviewForGame = async (userId, gameId, updateData) => {
    // ... (логика без изменений, всегда ставит 'review') ...
    const { rank, review_text } = updateData;

     if (rank !== undefined && (typeof rank !== 'number' || rank < 1 || rank > 10)) {
         throw new Error('Ошибка валидации обновления: Оценка должна быть числом от 1 до 10.');
     }
     if (review_text !== undefined && typeof review_text !== 'string') {
         throw new Error('Ошибка валидации обновления: Текст отзыва должен быть строкой.');
     }

    const existingReview = await findUserReviewForGame(userId, gameId);
    if (!existingReview) {
        throw new Error('Отзыв для данного пользователя и игры не найден.');
    }

    const fieldsToUpdate = [];
    const params = [];

    if (rank !== undefined) {
        fieldsToUpdate.push('rank = ?');
        params.push(rank);
    }
    if (review_text !== undefined) {
        fieldsToUpdate.push('review_text = ?');
        params.push(review_text);
    }

    if (fieldsToUpdate.length === 0) {
        console.warn(`Попытка обновления отзыва (user: ${userId}, game: ${gameId}) без данных для обновления.`);
        return existingReview;
    }

     fieldsToUpdate.push("status = 'review'");

    params.push(userId);
    params.push(gameId);

    const sql = `UPDATE reviews SET ${fieldsToUpdate.join(', ')} WHERE user_id = ? AND game_id = ?`;

    try {
        const result = await dbRun(sql, params);
        if (result.changes > 0) {
             return await findUserReviewForGame(userId, gameId);
        } else {
             console.warn(`Обновление отзыва (user: ${userId}, game: ${gameId}) не привело к изменениям.`);
             return await findUserReviewForGame(userId, gameId);
        }
    } catch (error) {
        console.error(`Ошибка при обновлении отзыва для пользователя ${userId}, игра ${gameId}:`, error);
        if (error.code === 'SQLITE_CONSTRAINT' && error.message.includes('CHECK constraint failed')) {
             throw new Error('Обновление отзыва не удалось из-за ошибки валидации (проверьте оценку или статус).'); // Уточнили сообщение
         }
        throw new Error('Не удалось обновить отзыв из-за ошибки базы данных.');
    }
};


/**
 * Обновляет статус конкретного отзыва. (Администратор)
 * Допустимые статусы: 'approved', 'rejected', 'review'.
 */
const updateStatus = async (reviewId, newStatus) => {
     // Заменили 'ok' на 'approved' в списке допустимых статусов
     const allowedStatuses = ['approved', 'rejected', 'review'];
    if (!allowedStatuses.includes(newStatus)) {
        // Обновили сообщение об ошибке
        throw new Error(`Недопустимое значение статуса: ${newStatus}. Статус должен быть одним из: ${allowedStatuses.join(', ')}.`);
    }

     const reviewExists = await dbGet('SELECT id FROM reviews WHERE id = ?', [reviewId]);
     if (!reviewExists) {
         return { changes: 0 };
     }

    const sql = `UPDATE reviews SET status = ? WHERE id = ?`;
    try {
        const result = await dbRun(sql, [newStatus, reviewId]);
        return result;
    } catch (error) {
        console.error(`Ошибка при обновлении статуса отзыва ${reviewId} на ${newStatus}:`, error);
        // Добавили проверку на ошибку CHECK constraint, если БД ее вернет
        if (error.code === 'SQLITE_CONSTRAINT' && error.message.includes('CHECK constraint failed')) {
            throw new Error(`Не удалось обновить статус: значение '${newStatus}' не разрешено ограничением базы данных.`);
        }
        throw new Error('Не удалось обновить статус отзыва.');
    }
};

/**
 * Удаляет отзыв по его ID. (Администратор)
 */
const deleteById = async (reviewId) => {
    // ... (логика без изменений) ...
    const reviewExists = await dbGet('SELECT id FROM reviews WHERE id = ?', [reviewId]);
    if (!reviewExists) {
        return { changes: 0 };
    }

    const sql = `DELETE FROM reviews WHERE id = ?`;
    try {
        const result = await dbRun(sql, [reviewId]);
        return result;
    } catch (error) {
        console.error(`Ошибка при удалении отзыва ${reviewId}:`, error);
        throw new Error('Не удалось удалить отзыв.');
    }
};

module.exports = {
    createReview,
    findPendingReviews,
    findApprovedReviewsByGameId,
    findUserReviewForGame,
    updateUserReviewForGame,
    updateStatus,
    deleteById,
};
// --- END OF FILE review.service.js ---