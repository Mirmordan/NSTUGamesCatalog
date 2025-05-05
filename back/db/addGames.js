// db/add.js
const db = require('../db/connection'); 


function getRandomElement(arr) {
    if (!arr || arr.length === 0) {
        return null;
    }
    const randomIndex = Math.floor(Math.random() * arr.length);
    return arr[randomIndex];
}

async function randomizeGameAssociations() {
    console.log('Starting randomization of game associations...');

    try {
        const publishers = await new Promise((resolve, reject) => {
            db.all("SELECT id FROM publishers", [], (err, rows) => {
                if (err) {
                    console.error("Error fetching publisher IDs:", err.message);
                    reject(err);
                } else {
                    resolve(rows.map(row => row.id)); 
                }
            });
        });

        if (!publishers || publishers.length === 0) {
            console.error("No publishers found in the database. Cannot assign publisher IDs.");

            return;
        }
        console.log(`Found ${publishers.length} publisher IDs.`);


        const developers = await new Promise((resolve, reject) => {
            db.all("SELECT id FROM developers", [], (err, rows) => {
                if (err) {
                    console.error("Error fetching developer IDs:", err.message);
                    reject(err);
                } else {
                    resolve(rows.map(row => row.id)); 
                }
            });
        });

        if (!developers || developers.length === 0) {
            console.error("No developers found in the database. Cannot assign developer IDs.");
        
             return; 
        }
        console.log(`Found ${developers.length} developer IDs.`);

        const games = await new Promise((resolve, reject) => {
            db.all("SELECT id FROM games", [], (err, rows) => {
                if (err) {
                    console.error("Error fetching game IDs:", err.message);
                    reject(err);
                } else {
                    resolve(rows.map(row => row.id)); 
                }
            });
        });

        if (!games || games.length === 0) {
            console.log("No games found in the database. Nothing to update.");
            return;
        }
        console.log(`Found ${games.length} games to update.`);

        let updatedCount = 0;
        console.log("Updating game associations...");


        const updatePromises = games.map(gameId => {
            return new Promise(async (resolve, reject) => {
               
                const randomPublisherId = getRandomElement(publishers);
                const randomDeveloperId = getRandomElement(developers);

                if (randomDeveloperId === null) { 
                   console.warn(`Skipping game ID ${gameId}: Could not get random developer ID.`);
                   return resolve(); 
                }

                const sql = `UPDATE games SET publisher_id = ?, developer_id = ? WHERE id = ?`;
                db.run(sql, [randomPublisherId, randomDeveloperId, gameId], function (err) {
                    if (err) {
                        console.error(`Error updating game ID ${gameId}:`, err.message);
                        reject(err); 
                    } else {
                        if (this.changes > 0) {
                            console.log(` -> Updated Game ID ${gameId} with DevID: ${randomDeveloperId}, PubID: ${randomPublisherId}`);
                            updatedCount++; 
                        } else {
                            console.warn(` -> Game ID ${gameId} not found or not updated.`);
                        }
                         resolve(); 
                    }
                });
            });
        });

        
        await Promise.all(updatePromises);

        console.log(`\nFinished updating associations for ${updatedCount} games.`);

    } catch (error) {
        console.error("\nAn error occurred during the randomization process:", error);
    } finally {
        
        db.close((err) => {
            if (err) {
                console.error('Error closing database connection:', err.message);
            } else {
                console.log('Database connection closed.');
            }
        });
    }
}

// Запуск
randomizeGameAssociations();