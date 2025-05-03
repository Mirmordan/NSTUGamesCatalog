// models/review.js
const db = require('../db/connection');

const Review = {
    /**
     * Creates a new review.
     * @param {number} userId - The ID of the user writing the review.
     * @param {number} gameId - The ID of the game being reviewed.
     * @param {number} rank - The rating given (1-10).
     * @param {string} [reviewText=''] - The text content of the review.
     * @param {string} [status='review'] - The initial status of the review (e.g., 'review', 'approved', 'rejected'). DB defaults to 'review'.
     * @returns {Promise<object>} A promise that resolves with the created review object.
     */
    create: (userId, gameId, rank, reviewText = '', status = 'review') => {
        return new Promise((resolve, reject) => {
             // Basic validation before hitting DB
             if (typeof rank !== 'number' || rank < 1 || rank > 10) {
                return reject(new Error('Rank must be a number between 1 and 10.'));
             }
             if (!userId || !gameId) {
                 return reject(new Error('User ID and Game ID are required.'));
             }

            const sql = `
                INSERT INTO reviews (user_id, game_id, rank, review_text, status)
                VALUES (?, ?, ?, ?, ?)
            `;
            // Note: CHECK constraints for rank are handled by the DB schema
            // Note: FOREIGN KEY constraints are handled by the DB schema

            db.run(sql, [userId, gameId, rank, reviewText, status], function (err) {
                if (err) {
                    console.error('Error creating review:', err.message);
                     if (err.message.includes('CHECK constraint failed')) {
                        // This could be rank or potentially status if CHECK was still there
                        reject(new Error('Review data failed validation (check rank).'));
                    } else if (err.message.includes('FOREIGN KEY constraint failed')) {
                        reject(new Error('Invalid User ID or Game ID.'));
                    }
                    else {
                        reject(err);
                    }
                } else {
                     // Retrieve the created review to include default timestamp etc.
                    Review.findById(this.lastID)
                        .then(resolve)
                        .catch(reject); // Should ideally not fail, but handle just in case
                }
            });
        });
    },

    /**
     * Finds a review by its ID.
     * @param {number} id - The review's ID.
     * @returns {Promise<object|null>} A promise that resolves with the review object or null if not found.
     */
    findById: (id) => {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM reviews WHERE id = ?`;
            db.get(sql, [id], (err, row) => {
                if (err) {
                    console.error('Error finding review by ID:', err.message);
                    reject(err);
                } else {
                    resolve(row || null); // Return null if not found
                }
            });
        });
    },

    /**
     * Finds all reviews, optionally filtered by game ID and/or user ID and/or status.
     * @param {object} [filters={}] - Optional filters.
     * @param {number} [filters.gameId] - Filter by game ID.
     * @param {number} [filters.userId] - Filter by user ID.
     * @param {string} [filters.status] - Filter by status.
     * @returns {Promise<Array<object>>} A promise that resolves with an array of review objects.
     */
    findAll: (filters = {}) => {
        return new Promise((resolve, reject) => {
            let sql = `SELECT r.*, u.login as userLogin FROM reviews r JOIN users u ON r.user_id = u.id`; // Join to get user login
            const whereClauses = [];
            const params = [];

            if (filters.gameId) {
                whereClauses.push('r.game_id = ?');
                params.push(filters.gameId);
            }
            if (filters.userId) {
                whereClauses.push('r.user_id = ?');
                params.push(filters.userId);
            }
             if (filters.status) {
                whereClauses.push('r.status = ?');
                params.push(filters.status);
            }


            if (whereClauses.length > 0) {
                sql += ' WHERE ' + whereClauses.join(' AND ');
            }

            sql += ' ORDER BY r.created_at DESC'; // Order by most recent first

            db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('Error fetching reviews:', err.message);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    },

    /**
     * Finds all reviews for a specific game, optionally filtered by status.
     * @param {number} gameId - The ID of the game.
     * @param {string} [statusFilter] - Optional status to filter by (e.g., 'approved').
     * @returns {Promise<Array<object>>} A promise that resolves with an array of review objects for the game.
     */
    findByGameId: (gameId, statusFilter = null) => {
         const filters = { gameId };
         if (statusFilter) {
             filters.status = statusFilter;
         }
         return Review.findAll(filters);
    },

     /**
     * Finds all reviews written by a specific user.
     * @param {number} userId - The ID of the user.
     * @returns {Promise<Array<object>>} A promise that resolves with an array of review objects by the user.
     */
    findByUserId: (userId) => {
        return Review.findAll({ userId });
    },

    /**
     * Updates a review's details (rank, text, status).
     * Triggers will automatically update the game's rating if status changes to/from 'approved' or rank changes on an 'approved' review.
     * @param {number} id - The ID of the review to update.
     * @param {object} updates - An object containing fields to update (e.g., { rank, review_text, status }).
     * @returns {Promise<number>} A promise that resolves with the number of rows affected.
     */
    update: (id, updates) => {
        return new Promise((resolve, reject) => {
            const allowedFields = ['rank', 'review_text', 'status'];
            const fieldsToUpdate = [];
            const values = [];

             // Basic validation for rank if present
            if (updates.rank !== undefined) {
                 const rank = updates.rank;
                 if (typeof rank !== 'number' || rank < 1 || rank > 10) {
                    return reject(new Error('Rank must be a number between 1 and 10.'));
                 }
            }


            // Build the query dynamically
            for (const field of allowedFields) {
                if (updates[field] !== undefined) {
                    // Use snake_case for column names in SQL
                    const columnName = field === 'reviewText' ? 'review_text' : field;
                    fieldsToUpdate.push(`${columnName} = ?`);
                    values.push(updates[field]);
                }
            }

            if (fieldsToUpdate.length === 0) {
                return resolve(0); // No changes specified
            }

            values.push(id); // Add the ID for the WHERE clause

            const sql = `UPDATE reviews SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;

            db.run(sql, values, function (err) {
                if (err) {
                    console.error('Error updating review:', err.message);
                    if (err.message.includes('CHECK constraint failed')) {
                         reject(new Error('Review update failed validation (check rank).'));
                    } else {
                        reject(err);
                    }
                } else {
                    // Rating update is handled by DB triggers
                    resolve(this.changes);
                }
            });
        });
    },

    /**
     * Updates the status of a specific review.
     * @param {number} id - The ID of the review.
     * @param {string} newStatus - The new status (e.g., 'approved', 'rejected').
     * @returns {Promise<number>} A promise resolving with the number of affected rows.
     */
    updateStatus: (id, newStatus) => {
        return Review.update(id, { status: newStatus });
    },


    /**
     * Deletes a review by its ID.
     * Triggers will automatically update the game's rating if the deleted review was 'approved'.
     * @param {number} id - The ID of the review to delete.
     * @returns {Promise<number>} A promise that resolves with the number of rows affected.
     */
    remove: (id) => {
        return new Promise((resolve, reject) => {
            const sql = `DELETE FROM reviews WHERE id = ?`;
            db.run(sql, [id], function (err) {
                if (err) {
                    console.error('Error deleting review:', err.message);
                    reject(err);
                } else {
                    // Rating update is handled by DB triggers
                    resolve(this.changes);
                }
            });
        });
    }
};

module.exports = Review;