// utils/db.util.js

// Импортируем СЫРОЙ экземпляр db из connection.js
const db = require('../db/connection');

/**
 * Выполняет SQL-запрос, который не возвращает строки (INSERT, UPDATE, DELETE).
 * @param {string} sql - SQL-запрос.
 * @param {Array} [params=[]] - Параметры для запроса.
 * @returns {Promise<{lastID: number, changes: number}>} Промис.
 */
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

/**
 * Выполняет SQL-запрос и возвращает первую найденную строку.
 * @param {string} sql - SQL-запрос.
 * @param {Array} [params=[]] - Параметры для запроса.
 * @returns {Promise<object|undefined>} Промис.
 */
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

/**
 * Выполняет SQL-запрос и возвращает все найденные строки.
 * @param {string} sql - SQL-запрос.
 * @param {Array} [params=[]] - Параметры для запроса.
 * @returns {Promise<Array<object>>} Промис.
 */
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

module.exports = {
    dbRun,
    dbGet,
    dbAll
};