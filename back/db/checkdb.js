// check_db.js
const db = require('./connection'); // Импортируем объект соединения из вашего файла

// --- Важно: Операции с БД асинхронны ---
// Используем Promise для удобства работы с асинхронными запросами db.get

// Вспомогательная функция для "промисификации" db.get
const dbGet = (sql, params = []) => new Promise((resolve, reject) => {
    // db.get получает одну строку. Если таблицы нет, ошибки не будет,
    // просто row будет undefined. Ошибка будет при проблемах с самой БД/запросом.
    db.get(sql, params, (err, row) => {
        if (err) {
            // Ошибка при выполнении запроса (проблемы с соединением, синтаксис SQL и т.д.)
            console.error(`Database query error for SQL: ${sql}`, err.message);
            reject(err);
        } else {
            // Запрос выполнен успешно, возвращаем результат (строку или undefined)
            resolve(row);
        }
    });
});

async function checkDatabaseStatus() {
    console.log('Attempting to check database status...');

    try {
        // 1. Проверка соединения (косвенная)
        // Попытка выполнить простейший запрос. Если он не удался, то соединения нет или оно нерабочее.
        // Сам факт импорта 'db' не гарантирует успешное соединение, т.к. оно асинхронное.
        // Запрос 'SELECT 1' просто проверяет, отвечает ли база данных.
        await dbGet('SELECT 1');
        console.log('[OK] Database connection seems active (ran SELECT 1 successfully).');

        // 2. Проверка наличия таблицы 'users'
        // Запрашиваем системную таблицу sqlite_master (или sqlite_schema),
        // которая содержит информацию обо всех объектах БД.
        console.log("Checking for 'users' table...");
        const result = await dbGet("SELECT name FROM sqlite_master WHERE type='table' AND name = ?", ['users']);

        if (result) {
            // Если запрос вернул строку (result не undefined/null), значит таблица найдена
            console.log(`[OK] Table 'users' exists in the database (found name: ${result.name}).`);
        } else {
            // Если запрос ничего не вернул (result is undefined/null), таблицы нет
            console.warn(`[WARN] Table 'users' does NOT exist in the database.`);
            console.log(" -> You might need to run your database initialization script (e.g., node db/initDb.js)");
        }

    } catch (error) {
        // Сюда попадем, если произошла ошибка при выполнении любого из await dbGet()
        console.error('[FAIL] Failed to query database. There might be a connection issue or a more critical DB error.', error.message);
        // Можно добавить более детальную диагностику ошибки, если нужно
    } finally {
        // Важно: Закрывать соединение здесь нужно, только если этот скрипт
        // используется как отдельная утилита проверки.
        // Если это часть вашего основного приложения, закрывать соединение не нужно,
        // оно должно оставаться открытым для обработки запросов.
        // db.close((err) => {
        //     if (err) {
        //         return console.error('Error closing database:', err.message);
        //     }
        //     console.log('Database connection closed.');
        // });
        console.log('Database status check finished.');
    }
}

// Запускаем проверку
checkDatabaseStatus();

// Если нужно экспортировать функцию для использования в другом месте:
// module.exports = { checkDatabaseStatus };