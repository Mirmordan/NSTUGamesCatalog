// models/publisher.js
const db = require('../db/connection'); // Используем ваш файл

const Publisher = {
    create: (name) => {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO publishers (name) VALUES (?)`;
            db.run(sql, [name], function (err) {
                if (err) {
                    console.error('Error creating publisher:', err.message);
                    // Обработка ошибки уникальности
                    if (err.message.includes('UNIQUE constraint failed')) {
                        reject(new Error('Publisher with this name already exists.'));
                    } else {
                        reject(err);
                    }
                } else {
                    resolve({ id: this.lastID, name });
                }
            });
        });
    },

    findById: (id) => {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM publishers WHERE id = ?`;
            db.get(sql, [id], (err, row) => {
                if (err) {
                    console.error('Error finding publisher by ID:', err.message);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    },

    findByName: (name) => {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM publishers WHERE name = ?`;
            db.get(sql, [name], (err, row) => {
                if (err) {
                    console.error('Error finding publisher by name:', err.message);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    },


    findAll: () => {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM publishers ORDER BY name`;
            db.all(sql, [], (err, rows) => {
                if (err) {
                    console.error('Error fetching all publishers:', err.message);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    },

    update: (id, name) => {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE publishers SET name = ? WHERE id = ?`;
            db.run(sql, [name, id], function (err) {
                if (err) {
                    console.error('Error updating publisher:', err.message);
                     // Обработка ошибки уникальности при обновлении
                    if (err.message.includes('UNIQUE constraint failed')) {
                        reject(new Error('Another publisher with this name already exists.'));
                    } else {
                        reject(err);
                    }
                } else {
                    resolve(this.changes);
                }
            });
        });
    },

    remove: (id) => {
        return new Promise((resolve, reject) => {
            const sql = `DELETE FROM publishers WHERE id = ?`;
            db.run(sql, [id], function (err) {
                if (err) {
                    console.error('Error deleting publisher:', err.message);
                    reject(err);
                } else {
                    // Игры с этим publisher_id будут иметь publisher_id = NULL из-за ON DELETE SET NULL
                    resolve(this.changes);
                }
            });
        });
    },

    findOrCreate: async (name) => {
        if (!name || name.trim() === '') {
            return null; // Не создаем издателя без имени
        }
        let publisher = await Publisher.findByName(name.trim());
        if (!publisher) {
             try {
                 publisher = await Publisher.create(name.trim());
             } catch (error) {
                // Если ошибка не в уникальности, пробрасываем дальше
                if (!error.message.includes('already exists')) {
                   throw error;
                }
                // Если все же гонка запросов и издатель появился, пытаемся найти еще раз
                publisher = await Publisher.findByName(name.trim());
                if (!publisher) throw error; // Если все еще нет, что-то пошло не так
             }
        }
        return publisher;
    }
};

module.exports = Publisher;