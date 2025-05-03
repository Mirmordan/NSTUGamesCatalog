// --- START OF FILE initDb.js ---

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./games.sqlite'); // Путь к файлу БД

function initDb(callback) { // Add callback for completion
    db.serialize(() => {
        // Создание таблицы издателей
        db.run(`
      CREATE TABLE IF NOT EXISTS publishers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      )
    `, (err) => {
            if (err) console.error('Error creating publishers:', err);
        });

        // Создание таблицы разработчиков
        db.run(`
      CREATE TABLE IF NOT EXISTS developers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      )
    `, (err) => {
            if (err) console.error('Error creating developers:', err);
        });

        // --- ИЗМЕНЕНО: убран image_url, убран CHECK для genre ---
        // Создание таблицы игр
        db.run(`
      CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        genre TEXT, -- Убран CHECK, теперь просто TEXT
        year INTEGER NOT NULL,
        platforms TEXT NOT NULL,
        publisher_id INTEGER,
        developer_id INTEGER,
        rating REAL DEFAULT 0.0,
        description TEXT,
        -- image_url TEXT, -- Колонка удалена
        FOREIGN KEY(publisher_id) REFERENCES publishers(id) ON DELETE SET NULL,
        FOREIGN KEY(developer_id) REFERENCES developers(id) ON DELETE SET NULL
      )
    `, (err) => {
            if (err) console.error('Error creating games:', err);
        });
        // --- КОНЕЦ ИЗМЕНЕНИЯ ---

        // Создание таблицы пользователей (CHECK оставлены)
        db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        login TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        status TEXT CHECK(status IN ('blocked', 'active')) DEFAULT 'active', -- CHECK оставлен
        role TEXT CHECK(role IN ('admin', 'user')) DEFAULT 'user' -- CHECK оставлен
      )
    `, (err) => {
            if (err) console.error('Error creating users:', err);
        });

        // --- ИЗМЕНЕНО: убран CHECK для status ---
        // Создание таблицы отзывов
        db.run(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        game_id INTEGER NOT NULL,
        rank INTEGER CHECK(rank >= 1 AND rank <= 10), -- CHECK для rank оставлен
        review_text TEXT,
        status TEXT DEFAULT 'review', -- Убран CHECK, теперь просто TEXT с DEFAULT
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (game_id) REFERENCES games (id) ON DELETE CASCADE
      )
    `, (err) => {
            if (err) {
                console.error("Error creating reviews table:", err.message);
            }
            if (typeof callback === 'function') {
                 console.log("All tables checked/created.");
                 callback();
            }
        });
        // --- КОНЕЦ ИЗМЕНЕНИЯ ---
    });
}

// Триггеры для автоматического пересчета рейтинга игры (без изменений)
// Логика триггеров все еще корректна, она опирается на значение 'approved'
const createRatingUpdateTriggers = (callback) => {
    let triggersCreated = 0;
    const totalTriggers = 3;

    const checkCompletion = () => {
        triggersCreated++;
        if (triggersCreated === totalTriggers && typeof callback === 'function') {
            callback();
        }
    };

    const insertTriggerSQL = `
      CREATE TRIGGER IF NOT EXISTS update_game_rating_on_insert
      AFTER INSERT ON reviews
      WHEN NEW.status = 'approved'
      BEGIN
          UPDATE games
          SET rating = (
              SELECT COALESCE(AVG(CAST(rank AS REAL)), 0.0)
              FROM reviews
              WHERE game_id = NEW.game_id AND status = 'approved'
          )
          WHERE id = NEW.game_id;
      END;
  `;

    const updateTriggerSQL = `
      CREATE TRIGGER IF NOT EXISTS update_game_rating_on_update
      AFTER UPDATE OF status, rank ON reviews
      WHEN NEW.status = 'approved' OR OLD.status = 'approved'
      BEGIN
          UPDATE games
          SET rating = (
              SELECT COALESCE(AVG(CAST(rank AS REAL)), 0.0)
              FROM reviews
              WHERE game_id = NEW.game_id AND status = 'approved'
          )
          WHERE id = NEW.game_id;
      END;
  `;

    const deleteTriggerSQL = `
      CREATE TRIGGER IF NOT EXISTS update_game_rating_on_delete
      AFTER DELETE ON reviews
      WHEN OLD.status = 'approved'
      BEGIN
          UPDATE games
          SET rating = (
              SELECT COALESCE(AVG(CAST(rank AS REAL)), 0.0)
              FROM reviews
              WHERE game_id = OLD.game_id AND status = 'approved'
          )
          WHERE id = OLD.game_id;
      END;
  `;

    db.exec(insertTriggerSQL, (err) => {
        if (err) console.error("Error creating insert rating trigger:", err.message);
        else console.log("Insert rating trigger checked/created successfully.");
        checkCompletion();
    });

    db.exec(updateTriggerSQL, (err) => {
        if (err) console.error("Error creating update rating trigger:", err.message);
        else console.log("Update rating trigger checked/created successfully.");
        checkCompletion();
    });

    db.exec(deleteTriggerSQL, (err) => {
        if (err) console.error("Error creating delete rating trigger:", err.message);
        else console.log("Delete rating trigger checked/created successfully.");
        checkCompletion();
    });
};

// --- Execution ---

console.log("Initializing database schema...");
initDb(() => {
    console.log("Creating/Checking triggers...");
    createRatingUpdateTriggers(() => {
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            } else {
                console.log('Database connection closed.');
            }
        });
        console.log('Database initialization and trigger creation complete.');
    });
});

// --- END OF FILE initDb.js ---