// models/developer.js
const db = require('../db/connection'); 

const Developer = {
    create: (name) => {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO developers (name) VALUES (?)`;
            db.run(sql, [name], function (err) {
                if (err) {
                    console.error('Error creating developer:', err.message);
                    if (err.message.includes('UNIQUE constraint failed')) {
                        reject(new Error('Developer with this name already exists.'));
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
            const sql = `SELECT * FROM developers WHERE id = ?`;
            db.get(sql, [id], (err, row) => {
                if (err) {
                    console.error('Error finding developer by ID:', err.message);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    },

     findByName: (name) => {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM developers WHERE name = ?`;
            db.get(sql, [name], (err, row) => {
                if (err) {
                    console.error('Error finding developer by name:', err.message);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    },

    findAll: () => {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM developers ORDER BY name`;
            db.all(sql, [], (err, rows) => {
                if (err) {
                    console.error('Error fetching all developers:', err.message);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    },

    update: (id, name) => {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE developers SET name = ? WHERE id = ?`;
            db.run(sql, [name, id], function (err) {
                if (err) {
                    console.error('Error updating developer:', err.message);
                    if (err.message.includes('UNIQUE constraint failed')) {
                        reject(new Error('Another developer with this name already exists.'));
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
            const sql = `DELETE FROM developers WHERE id = ?`;
            db.run(sql, [id], function (err) {
                if (err) {
                    console.error('Error deleting developer:', err.message);
                    reject(err);
                } else {
                     // Игры с этим developer_id будут иметь developer_id = NULL из-за ON DELETE SET NULL
                    resolve(this.changes);
                }
            });
        });
    },

    findOrCreate: async (name) => {
        if (!name || name.trim() === '') {
            return null; // Не создаем разработчика без имени
        }
        let developer = await Developer.findByName(name.trim());
        if (!developer) {
            try{
                developer = await Developer.create(name.trim());
            } catch (error) {
                 if (!error.message.includes('already exists')) {
                   throw error;
                }
                developer = await Developer.findByName(name.trim());
                if (!developer) throw error;
            }
        }
        return developer;
    }
};

module.exports = Developer;