// controllers/game.controller.js
const gameService = require('../services/game.service');

const gameController = {
    /**
     * Handles GET /api/games
     * Retrieves a list of games with pagination, search, and filtering.
     */
    getGamesList: async (req, res, next) => {
        try {
            // Extract query parameters
            const {
                page,           // page number
                limit,          // items per page (optional, service has default)
                search,         // search string
                year,           // filter
                publisher,      // filter (can be ID or name)
                developer,      // filter (can be ID or name)
                genre,          // filter
                minRating,      // filter (e.g., minRating=7.5)
                maxRating,      // filter (e.g., maxRating=9.0) - Currently only minRating supported by model
                sortBy,         // sort field (name, year, rating)
                sortOrder       // sort direction (ASC, DESC)
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
                maxRating, // Pass it along, service might handle it later if model updated
                sortBy,
                sortOrder
            };

            // Call the service to get games data
            const result = await gameService.getAllGames(options);

            // Send the successful response
            res.json(result); // Sends { games, totalGames, totalPages, currentPage }

        } catch (error) {
            console.error('Controller error in getGamesList:', error);
            // Pass error to the central error handler (if configured)
            // next(error);
            // Or send a generic server error response
            res.status(500).json({ message: 'Error retrieving game list.' });
        }
    },

    /**
     * Handles GET /api/games/:id
     * Retrieves details for a specific game.
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

            // Send the successful response with game data
            res.json(game);

        } catch (error) {
            console.error(`Controller error in getGameDetails for ID ${req.params.id}:`, error);
            // Pass error to the central error handler
            // next(error);
            // Or send a generic server error response
            res.status(500).json({ message: 'Error retrieving game details.' });
        }
    }
};

module.exports = gameController;