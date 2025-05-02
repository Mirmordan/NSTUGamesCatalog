const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./games.sqlite'); // Путь к файлу БД

function initDb() {
    db.serialize(() => {
        // Создание таблицы издателей
        db.run(`
      CREATE TABLE IF NOT EXISTS publishers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      )
    `, (err) => {
            if (err) console.error('Error creating publishers:', err);
            else console.log('Table "publishers" created');
        });

        // Создание таблицы разработчиков
        db.run(`
      CREATE TABLE IF NOT EXISTS developers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      )
    `, (err) => {
            if (err) console.error('Error creating developers:', err);
            else console.log('Table "developers" created');
        });

        // Создание таблицы игр
        db.run(`
      CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT CHECK(type IN ('rpg', 'action', 'arcade', 'strategy', 'simulator', 'adventure', 'other')),
        year INTEGER NOT NULL,
        platforms TEXT NOT NULL,
        publisher_id INTEGER,
        developer_id INTEGER,
        rating REAL DEFAULT 0,
        description TEXT,
        image_url TEXT,
        FOREIGN KEY(publisher_id) REFERENCES publishers(id),
        FOREIGN KEY(developer_id) REFERENCES developers(id)
      )
    `, (err) => {
            if (err) console.error('Error creating games:', err);
            else console.log('Table "games" created');
        });

        // Создание таблицы пользователей
        db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        login TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        status TEXT CHECK(status IN ('blocked', 'active')) DEFAULT 'active',
        role TEXT CHECK(role IN ('admin', 'user')) DEFAULT 'user'
      )
    `, (err) => {
            if (err) console.error('Error creating users:', err);
            else console.log('Table "users" created');
        });

        // Создание таблицы отзывов
        db.run(`
      CREATE TABLE IF NOT EXISTS reviews (
        user_id INTEGER NOT NULL,
        game_id INTEGER NOT NULL,
        rank INTEGER CHECK(rank BETWEEN 1 AND 5),
        review TEXT,
        status TEXT CHECK(status IN ('review', 'ok', 'delete')) DEFAULT 'review',
        PRIMARY KEY(user_id, game_id),
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(game_id) REFERENCES games(id)
      )
    `, (err) => {
            if (err) console.error('Error creating reviews:', err);
            else console.log('Table "reviews" created');
        });
    });

    db.close();
}

initDb();