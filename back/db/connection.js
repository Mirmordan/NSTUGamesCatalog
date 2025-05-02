const sqlite3 = require('sqlite3').verbose(); // verbose для более подробных логов об ошибках
const dotenv = require('dotenv');

dotenv.config(); // Загружаем переменные из .env

const dbPath = process.env.DATABASE_PATH || './games.sqlite'; // Путь к файлу БД

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        // Включаем поддержку внешних ключей (важно для связей)
        db.run("PRAGMA foreign_keys = ON;", function(err) {
            if (err) {
                console.error("Failed to enable foreign keys:", err.message);
            } else {
                console.log("Foreign key support enabled.");
            }
        });
    }
});

module.exports = db;