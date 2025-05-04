// db/check_db.js
const db = require('../db/connection'); 

const dbGet = (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
        if (err) {
            console.error(`Database query error for SQL: ${sql}`, err.message);
            reject(err);
        } else {
            resolve(row);
        }
    });
});

async function checkDatabaseStatus() {
    console.log('Attempting to check database status...');

    try {
        
        await dbGet('SELECT 1');
        console.log('[OK] Database connection seems active (ran SELECT 1 successfully).');

        
        console.log("Checking for 'users' table...");
        const result = await dbGet("SELECT name FROM sqlite_master WHERE type='table' AND name = ?", ['users']);

        if (result) {
            
            console.log(`[OK] Table 'users' exists in the database (found name: ${result.name}).`);
        } else {
            
            console.warn(`[WARN] Table 'users' does NOT exist in the database.`);
            console.log(" -> You might need to run your database initialization script (e.g., node db/initDb.js)");
        }

    } catch (error) {
        
        console.error('[FAIL] Failed to query database. There might be a connection issue or a more critical DB error.', error.message);
        
    } finally {
        
        console.log('Database status check finished.');
    }
}

// Запуск
checkDatabaseStatus();