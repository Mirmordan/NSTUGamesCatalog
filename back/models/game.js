// models/game.js
const db = require('../db/connection'); // Используем ваш файл

const Game = {
    // gameData = { name, genre, year, platforms, publisher_id, developer_id, description }
    create: (gameData) => {
        return new Promise((resolve, reject) => {
            // Проверка обязательных полей
            if (!gameData.name || !gameData.year || !gameData.platforms) {
                 return reject(new Error('Missing required fields: name, year, platforms are required.'));
            }

            const sql = `INSERT INTO games (name, genre, year, platforms, publisher_id, developer_id, description, rating)
                         VALUES (?, ?, ?, ?, ?, ?, ?, 0.0)`; // Начинаем с рейтинга 0.0
            const params = [
                gameData.name,
                gameData.genre || null, // Позволяем быть null
                gameData.year,
                gameData.platforms,
                gameData.publisher_id || null, // Позволяем быть null
                gameData.developer_id || null, // Позволяем быть null
                gameData.description || null
            ];
            db.run(sql, params, function (err) {
                if (err) {
                    console.error('Error creating game:', err.message);
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    },

    findById: (id) => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT
                    g.*,
                    p.name AS publisher_name,
                    d.name AS developer_name
                FROM games g
                LEFT JOIN publishers p ON g.publisher_id = p.id
                LEFT JOIN developers d ON g.developer_id = d.id
                WHERE g.id = ?
            `;
            db.get(sql, [id], (err, row) => {
                if (err) {
                    console.error('Error finding game by ID:', err.message);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    },

    findAll: (options = {}) => {
         return new Promise((resolve, reject) => {
            let sql = `
                SELECT
                    g.id, g.name, g.genre, g.year, g.platforms, g.rating,
                    p.name AS publisher_name,
                    d.name AS developer_name
                FROM games g
                LEFT JOIN publishers p ON g.publisher_id = p.id
                LEFT JOIN developers d ON g.developer_id = d.id
            `;
            const params = [];
            const whereClauses = [];

            // Фильтрация
            if (options.genre) {
                whereClauses.push(`LOWER(g.genre) = LOWER(?)`); // Регистронезависимое сравнение
                params.push(options.genre);
            }
            if (options.year) {
                whereClauses.push(`g.year = ?`);
                params.push(options.year);
            }
            if (options.publisherId) {
                whereClauses.push(`g.publisher_id = ?`);
                params.push(options.publisherId);
            }
             if (options.developerId) {
                whereClauses.push(`g.developer_id = ?`);
                params.push(options.developerId);
            }
            if (options.minRating) {
                 whereClauses.push(`g.rating >= ?`);
                 params.push(options.minRating);
            }
            if (options.search) {
                 whereClauses.push(`(LOWER(g.name) LIKE LOWER(?) OR LOWER(g.description) LIKE LOWER(?))`);
                 params.push(`%${options.search}%`, `%${options.search}%`);
             }

            if (whereClauses.length > 0) {
                sql += ` WHERE ${whereClauses.join(' AND ')}`;
            }

            // Сортировка
            const validSortColumns = ['g.name', 'g.year', 'g.rating', 'publisher_name', 'developer_name'];
            let sortBy = options.sortBy || 'g.name';
            if (!validSortColumns.includes(sortBy)) {
                sortBy = 'g.name'; // Сортировка по умолчанию, если передана некорректная колонка
            }
            const sortOrder = options.sortOrder === 'DESC' ? 'DESC' : 'ASC';
            sql += ` ORDER BY ${sortBy} ${sortOrder}`;

            // Пагинация
            if (options.limit && options.limit > 0) {
                sql += ` LIMIT ?`;
                params.push(options.limit);
                if (options.offset && options.offset >= 0) {
                    sql += ` OFFSET ?`;
                    params.push(options.offset);
                }
            } else {
                // Ограничение по умолчанию, чтобы избежать выборки всей базы
                sql += ` LIMIT 50`;
            }

            db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('Error fetching games:', err.message);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    },

    // Подсчет общего количества игр (для пагинации)
    countAll: (options = {}) => {
        return new Promise((resolve, reject) => {
            let sql = `SELECT COUNT(*) as count FROM games g`;
            const params = [];
            const whereClauses = [];

             // Копируем логику фильтрации из findAll
            if (options.genre) { whereClauses.push(`LOWER(g.genre) = LOWER(?)`); params.push(options.genre); }
            if (options.year) { whereClauses.push(`g.year = ?`); params.push(options.year); }
            if (options.publisherId) { whereClauses.push(`g.publisher_id = ?`); params.push(options.publisherId); }
            if (options.developerId) { whereClauses.push(`g.developer_id = ?`); params.push(options.developerId); }
             if (options.minRating) { whereClauses.push(`g.rating >= ?`); params.push(options.minRating); }
            if (options.search) { whereClauses.push(`(LOWER(g.name) LIKE LOWER(?) OR LOWER(g.description) LIKE LOWER(?))`); params.push(`%${options.search}%`, `%${options.search}%`); }

            if (whereClauses.length > 0) {
                sql += ` WHERE ${whereClauses.join(' AND ')}`;
            }

            db.get(sql, params, (err, row) => {
                if (err) {
                    console.error('Error counting games:', err.message);
                    reject(err);
                } else {
                    resolve(row ? row.count : 0);
                }
            });
        });
    },

    update: (id, gameData) => {
        return new Promise((resolve, reject) => {
            const fields = [];
            const params = [];
            const allowedFields = ['name', 'genre', 'year', 'platforms', 'publisher_id', 'developer_id', 'description'];

            Object.keys(gameData).forEach(key => {
                 if (allowedFields.includes(key)) {
                    fields.push(`${key} = ?`);
                    // Обрабатываем возможность установки publisher_id/developer_id в null
                    params.push(gameData[key] === null ? null : gameData[key]);
                 }
            });

            if (fields.length === 0) {
                return resolve(0); // Нет полей для обновления
            }

            params.push(id);
            const sql = `UPDATE games SET ${fields.join(', ')} WHERE id = ?`;

            db.run(sql, params, function (err) {
                if (err) {
                    console.error('Error updating game:', err.message);
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });
    },

    remove: (id) => {
        return new Promise((resolve, reject) => {
            const sql = `DELETE FROM games WHERE id = ?`;
            db.run(sql, [id], function (err) {
                if (err) {
                    console.error('Error deleting game:', err.message);
                    reject(err);
                } else {
                    // Отзывы удалятся автоматически (ON DELETE CASCADE)
                    console.log(`Game ${id} deleted, changes: ${this.changes}`);
                    resolve(this.changes);
                }
            });
        });
    },

     // Отдельный метод для обновления рейтинга (используется внутри Review модели, но может быть вызван и вручную)
    updateRating: (gameId) => {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE games
                SET rating = (
                    SELECT COALESCE(AVG(CAST(rank AS REAL)), 0.0)
                    FROM reviews
                    WHERE game_id = ? AND status = 'approved'
                )
                WHERE id = ?
            `;
            db.run(sql, [gameId, gameId], function (err) {
                if (err) {
                    console.error(`Error updating rating for game ${gameId}:`, err.message);
                    reject(err);
                } else {
                    // console.log(`Rating updated for game ${gameId}, changes: ${this.changes}`);
                    resolve(this.changes);
                }
            });
        });
    },


    // findByPublisher, findByDeveloper можно реализовать через findAll с опциями
    findByPublisher: (publisherId) => {
        return Game.findAll({ publisherId: publisherId });
    },

    findByDeveloper: (developerId) => {
        return Game.findAll({ developerId: developerId });
    }
};

module.exports = Game;