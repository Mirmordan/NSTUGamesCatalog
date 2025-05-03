// scripts/updateGameAssociations.js
const db = require('../db/connection'); // Adjust path if needed

// Helper function to get a random element from an array
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
        // --- 1. Get all available Publisher IDs ---
        const publishers = await new Promise((resolve, reject) => {
            db.all("SELECT id FROM publishers", [], (err, rows) => {
                if (err) {
                    console.error("Error fetching publisher IDs:", err.message);
                    reject(err);
                } else {
                    resolve(rows.map(row => row.id)); // Extract just the IDs
                }
            });
        });

        if (!publishers || publishers.length === 0) {
            console.error("No publishers found in the database. Cannot assign publisher IDs.");
            // Decide whether to proceed with only developers or stop
            // For now, we'll stop if publishers are missing, as the request included both
            return;
        }
        console.log(`Found ${publishers.length} publisher IDs.`);

        // --- 2. Get all available Developer IDs ---
        const developers = await new Promise((resolve, reject) => {
            db.all("SELECT id FROM developers", [], (err, rows) => {
                if (err) {
                    console.error("Error fetching developer IDs:", err.message);
                    reject(err);
                } else {
                    resolve(rows.map(row => row.id)); // Extract just the IDs
                }
            });
        });

        if (!developers || developers.length === 0) {
            console.error("No developers found in the database. Cannot assign developer IDs.");
            // Decide whether to proceed with only publishers or stop
             return; // Stopping for now
        }
        console.log(`Found ${developers.length} developer IDs.`);

        // --- 3. Get all Game IDs ---
        const games = await new Promise((resolve, reject) => {
            db.all("SELECT id FROM games", [], (err, rows) => {
                if (err) {
                    console.error("Error fetching game IDs:", err.message);
                    reject(err);
                } else {
                    resolve(rows.map(row => row.id)); // Extract just the IDs
                }
            });
        });

        if (!games || games.length === 0) {
            console.log("No games found in the database. Nothing to update.");
            return;
        }
        console.log(`Found ${games.length} games to update.`);

        // --- 4. Update each game with random associations ---
        let updatedCount = 0;
        console.log("Updating game associations...");

        // Using Promise.all to run updates concurrently (can be faster for many games)
        // If you encounter issues with too many concurrent writes, switch to a sequential loop (for...of)
        const updatePromises = games.map(gameId => {
            return new Promise(async (resolve, reject) => {
                // Select random IDs
                const randomPublisherId = getRandomElement(publishers);
                const randomDeveloperId = getRandomElement(developers);

                // Allow null publisher sometimes? (Optional, uncomment if desired)
                // const randomPublisherId = Math.random() < 0.9 ? getRandomElement(publishers) : null;

                // Ensure we have valid IDs before updating
                if (randomDeveloperId === null) { // Developer is generally required
                   console.warn(`Skipping game ID ${gameId}: Could not get random developer ID.`);
                   return resolve(); // Resolve promise without updating
                }

                const sql = `UPDATE games SET publisher_id = ?, developer_id = ? WHERE id = ?`;
                db.run(sql, [randomPublisherId, randomDeveloperId, gameId], function (err) {
                    if (err) {
                        console.error(`Error updating game ID ${gameId}:`, err.message);
                        reject(err); // Reject this specific promise
                    } else {
                        if (this.changes > 0) {
                            console.log(` -> Updated Game ID ${gameId} with DevID: ${randomDeveloperId}, PubID: ${randomPublisherId}`);
                            updatedCount++; // Increment counter safely after successful update
                        } else {
                            console.warn(` -> Game ID ${gameId} not found or not updated.`);
                        }
                         resolve(); // Resolve promise after update attempt
                    }
                });
            });
        });

        // Wait for all update operations to complete
        await Promise.all(updatePromises);

        console.log(`\nFinished updating associations for ${updatedCount} games.`);

    } catch (error) {
        console.error("\nAn error occurred during the randomization process:", error);
    } finally {
        // Close the database connection regardless of success or failure
        db.close((err) => {
            if (err) {
                console.error('Error closing database connection:', err.message);
            } else {
                console.log('Database connection closed.');
            }
        });
    }
}

// --- Run the script ---
randomizeGameAssociations();