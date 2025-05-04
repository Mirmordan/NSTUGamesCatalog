// db/connection.js

const sqlite3 = require('sqlite3').verbose(); 
const dotenv = require('dotenv');

// Загружаем путь к БД из .env
dotenv.config(); 
const dbPath = process.env.DATABASE_PATH || './games.sqlite'; 

//Инициализируем подключение
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Ошибка открытия базы данных:', err.message);
    } else {
        console.log('База данных подключена.');


        db.run("PRAGMA foreign_keys = ON;", function(err) {
            if (err) {
                console.error("Ошибка подключения внешних ключей:", err.message);
            } else {
                console.log("Внешние ключи работают.");
            }
        });
    }
});

module.exports = db;