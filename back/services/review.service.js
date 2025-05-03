const db = require('../db/connection');

// --- Database Helper Functions (Promisified) ---
const dbRun = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
        if (err) {
            console.error('DB Run Error:', err.message, 'SQL:', sql, 'Params:', params);
            reject(err);
        } else {
            resolve({ lastID: this.lastID, changes: this.changes });
        }
    });
});

const dbGet = (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
        if (err) {
            console.error('DB Get Error:', err.message, 'SQL:', sql, 'Params:', params);
            reject(err);
        } else {
            resolve(row);
        }
    });
});

const dbAll = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error('DB All Error:', err.message, 'SQL:', sql, 'Params:', params);
            reject(err);
        } else {
            resolve(rows);
        }
    });
});

// --- Service Functions ---

/**
 * Creates a new review. Called when a user submits a review for a game.
 * Status defaults to 'review' (На рассмотрении).
 * Note: Assumes game_id validation happens before calling this (e.g., in controller or route).
 * Note: Relies on DB triggers (defined in initDb.js) to update game rating when status becomes 'ok'.
 */
const createReview = async (userId, gameId, rank, reviewText) => {
    const sql = `INSERT INTO reviews (user_id, game_id, rank, review_text, status)
                 VALUES (?, ?, ?, ?, 'review')`;
    try {
        // Optional: Check if user already reviewed this game, if needed
        // const existingReview = await dbGet('SELECT id FROM reviews WHERE user_id = ? AND game_id = ?', [userId, gameId]);
        // if (existingReview) {
        //    throw new Error('User has already reviewed this game');
        // }

        const result = await dbRun(sql, [userId, gameId, rank, reviewText]);
        if (result.lastID) {
             // Fetch the created review to return it (optional, good for confirmation)
             return await dbGet('SELECT * FROM reviews WHERE id = ?', [result.lastID]);
        } else {
            throw new Error('Review could not be created.');
        }
    } catch (error) {
        console.error(`Error creating review for user ${userId} on game ${gameId}:`, error);
        // Re-throw specific errors if needed, otherwise a generic one
        if (error.code === 'SQLITE_CONSTRAINT') {
             throw new Error('Failed to create review due to constraint violation (e.g., invalid user or game ID).');
        }
        throw error; // Re-throw other errors
    }
};

/**
 * Retrieves all reviews currently pending moderation (status = 'review').
 * Includes user login and game title for context.
 */
const findPendingReviews = async () => {
    const sql = `
        SELECT
            r.id,
            r.rank,
            r.review_text,
            r.status,
            r.created_at,
            u.login AS userLogin,
            g.name AS gameTitle, -- <<< ИСПРАВЛЕНО ЗДЕСЬ (было g.title)
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
        console.error("Error fetching pending reviews:", error);
        // Выбрасываем ошибку, чтобы контроллер мог ее поймать и обработать
        throw new Error('Could not fetch pending reviews.');
    }
};


/**
 * Updates the status of a specific review.
 * Allowed statuses: 'review', 'ok', 'delete' (as per tz.md, но в initDb было 'approved', 'rejected' - используем 'ok', 'delete' согласно ТЗ API).
 * Важно: ТЗ API указывает статусы review, ok, delete. initDb указывает review, approved, rejected.
 * Будем следовать ТЗ API: 'review', 'ok', 'delete'. Если триггеры настроены на 'approved', их нужно будет адаптировать или использовать 'approved' вместо 'ok'.
 * Выбираем вариант ТЗ API ('ok', 'delete').
 * Note: Relies on DB triggers to update game rating if status changes involve 'ok' (или 'approved' если триггер использует это).
 */
const updateStatus = async (reviewId, newStatus) => {
    // Validate status against the enum defined in tz.md API section
    const allowedStatuses = ['review', 'ok', 'delete']; // Используем статусы из ТЗ API
    if (!allowedStatuses.includes(newStatus)) {
        throw new Error(`Invalid status value: ${newStatus}. Must be one of ${allowedStatuses.join(', ')}.`);
    }

     // Проверка на существование отзыва перед обновлением (опционально, но полезно)
     const reviewExists = await dbGet('SELECT id FROM reviews WHERE id = ?', [reviewId]);
     if (!reviewExists) {
         // Не выбрасываем ошибку, а возвращаем 0 изменений, как и делает dbRun
         return { changes: 0 };
     }


    const sql = `UPDATE reviews SET status = ? WHERE id = ?`;
    try {
        const result = await dbRun(sql, [newStatus, reviewId]);
        return result; // Contains { changes: number }
    } catch (error) {
        console.error(`Error updating status for review ${reviewId} to ${newStatus}:`, error);
        throw new Error('Could not update review status.');
    }
};

/**
 * Deletes a review by its ID.
 * Note: Relies on DB triggers to update game rating if the deleted review had status 'ok' (or 'approved').
 */
const deleteById = async (reviewId) => {
    // Optional: Check if review exists before deleting (returns { changes: 0 } if not found)
    const reviewExists = await dbGet('SELECT id FROM reviews WHERE id = ?', [reviewId]);
    if (!reviewExists) {
        return { changes: 0 }; // Already deleted or never existed
    }

    const sql = `DELETE FROM reviews WHERE id = ?`;
    try {
        const result = await dbRun(sql, [reviewId]);
        return result; // Contains { changes: number }
    } catch (error) {
        console.error(`Error deleting review ${reviewId}:`, error);
        throw new Error('Could not delete review.');
    }
};

// Helper function if triggers aren't used (Example, not currently needed if triggers work)
/*
const recalculateGameRating = async (gameId) => {
    const ratingResult = await dbGet(
        // Важно использовать правильный статус ('ok' или 'approved')
        `SELECT COALESCE(AVG(rank), 0.0) as averageRating
         FROM reviews
         WHERE game_id = ? AND status = 'ok'`,
        [gameId]
    );
    await dbRun('UPDATE games SET rating = ? WHERE id = ?', [ratingResult.averageRating, gameId]);
    console.log(`Recalculated rating for game ${gameId}: ${ratingResult.averageRating}`);
};
*/


module.exports = {
    createReview,
    findPendingReviews,
    updateStatus,
    deleteById,
    // recalculateGameRating, // Export if needed
};