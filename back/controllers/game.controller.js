// controllers/game.controller.js
const gameService = require('../services/game.service');

const gameController = {
    /**
     * Handles GET /api/games
     * Retrieves a list of games with pagination, search, and filtering.
     * Note: This function does NOT add image URLs to the list view
     * for performance reasons (avoids constructing URLs for potentially many items).
     * The frontend can construct these if needed based on the game ID.
     */
    getGamesList: async (req, res, next) => {
        try {
            // Extract query parameters
            const {
                page,
                limit,
                search,
                year,
                publisher,
                developer,
                genre,
                minRating,
                maxRating,
                sortBy,
                sortOrder
            } = req.query;

            // Prepare options for the service
            const options = {
                page,
                limit,
                search,
                year,
                publisher,
                developer,
                genre,
                minRating,
                maxRating,
                sortBy,
                sortOrder
            };

            // Call the service to get games data
            const result = await gameService.getAllGames(options);

            // Send the successful response
            res.json(result); // Sends { games, totalGames, totalPages, currentPage }

        } catch (error) {
            console.error('Controller error in getGamesList:', error);
            res.status(500).json({ message: 'Error retrieving game list.' });
        }
    },

    /**
     * Handles GET /api/games/:id
     * Retrieves details for a specific game, including a URL to its image.
     */
    getGameDetails: async (req, res, next) => {
        try {
            const gameId = parseInt(req.params.id, 10);

            // Basic validation for the ID
            if (isNaN(gameId) || gameId <= 0) {
                return res.status(400).json({ message: 'Invalid game ID provided.' });
            }

            // Call the service to get game details
            const game = await gameService.getGameById(gameId);

            if (!game) {
                // Game not found with the given ID
                return res.status(404).json({ message: 'Game not found.' });
            }

            


            // Send the successful response with game data including the image URL
            res.json(game);

        } catch (error) {
            console.error(`Controller error in getGameDetails for ID ${req.params.id}:`, error);
            res.status(500).json({ message: 'Error retrieving game details.' });
        }
    }
};

module.exports = gameController;