// services/game.service.js
const Game = require('../models/game');
const Publisher = require('../models/publisher'); // Needed if filtering by name requires ID lookup
const Developer = require('../models/developer'); // Needed if filtering by name requires ID lookup

const DEFAULT_PAGE_SIZE = 10;

const gameService = {
    /**
     * Get a paginated, filtered, and sorted list of games.
     * @param {object} options - Filtering, sorting, and pagination options.
     * @param {number} [options.page=1] - The page number to retrieve.
     * @param {number} [options.limit=10] - The number of items per page.
     * @param {string} [options.search] - Search term for name and description.
     * @param {number} [options.year] - Filter by year.
     * @param {number|string} [options.publisher] - Filter by publisher ID or name.
     * @param {number|string} [options.developer] - Filter by developer ID or name.
     * @param {string} [options.genre] - Filter by genre.
     * @param {number} [options.minRating] - Filter by minimum rating.
     * @param {number} [options.maxRating] - Filter by maximum rating. // Note: Game.findAll currently only supports minRating
     * @param {string} [options.sortBy='name'] - Field to sort by (name, year, rating).
     * @param {string} [options.sortOrder='ASC'] - Sort order ('ASC' or 'DESC').
     * @returns {Promise<{games: Array, totalGames: number, totalPages: number, currentPage: number}>}
     */
    getAllGames: async (options = {}) => {
        const page = parseInt(options.page, 10) || 1;
        const limit = parseInt(options.limit, 10) || DEFAULT_PAGE_SIZE;
        const offset = (page - 1) * limit;

        const modelOptions = {
            limit: limit,
            offset: offset,
            search: options.search,
            year: options.year ? parseInt(options.year, 10) : undefined,
            genre: options.genre,
            minRating: options.minRating ? parseFloat(options.minRating) : undefined,
            // maxRating: options.maxRating ? parseFloat(options.maxRating) : undefined, // Add to Game.findAll if needed
            sortBy: options.sortBy || 'g.name', // Default sort by game name
            sortOrder: options.sortOrder === 'DESC' ? 'DESC' : 'ASC',
        };

        // --- Handling Publisher/Developer Filters ---
        // If names are passed, find their IDs first. If IDs are passed, use them directly.
        if (options.publisher) {
            if (isNaN(parseInt(options.publisher, 10))) { // Check if it's not a number (likely a name)
                 console.log(`Finding publisher ID for name: ${options.publisher}`);
                 const publisher = await Publisher.findByName(options.publisher);
                 modelOptions.publisherId = publisher ? publisher.id : -1; // Use -1 or similar to ensure no match if name not found
                 if(!publisher) console.log(`Publisher not found: ${options.publisher}`);
            } else {
                modelOptions.publisherId = parseInt(options.publisher, 10);
            }
             console.log(`Using publisherId: ${modelOptions.publisherId}`);
        }

        if (options.developer) {
             if (isNaN(parseInt(options.developer, 10))) { // Check if it's not a number (likely a name)
                 console.log(`Finding developer ID for name: ${options.developer}`);
                 const developer = await Developer.findByName(options.developer);
                 modelOptions.developerId = developer ? developer.id : -1;
                 if(!developer) console.log(`Developer not found: ${options.developer}`);
             } else {
                modelOptions.developerId = parseInt(options.developer, 10);
             }
              console.log(`Using developerId: ${modelOptions.developerId}`);
        }
        // --- End Publisher/Developer Handling ---

        // Remove undefined filters for cleaner query options
        const filterOptions = { ...modelOptions };
        delete filterOptions.limit;
        delete filterOptions.offset;
        delete filterOptions.sortBy;
        delete filterOptions.sortOrder;
        Object.keys(filterOptions).forEach(key => filterOptions[key] === undefined && delete filterOptions[key]);
         Object.keys(modelOptions).forEach(key => modelOptions[key] === undefined && delete modelOptions[key]);

        try {
            // Get the total count matching the filters (without pagination)
            const totalGames = await Game.countAll(filterOptions);
            // Get the games for the current page with filters and pagination
            const games = await Game.findAll(modelOptions);

            const totalPages = Math.ceil(totalGames / limit);

            return {
                games,
                totalGames,
                totalPages,
                currentPage: page,
            };
        } catch (error) {
            console.error('Service error fetching games:', error);
            throw new Error('Failed to retrieve games.'); // Rethrow a generic error
        }
    },

    /**
     * Get details for a single game by its ID.
     * @param {number} id - The ID of the game.
     * @returns {Promise<object|null>} - The game object or null if not found.
     */
    getGameById: async (id) => {
        if (isNaN(id) || id <= 0) {
            console.error(`Invalid game ID requested: ${id}`);
            return null; // Or throw an error for invalid input
        }
        try {
            const game = await Game.findById(id);
            // Note: The Game.findById model already joins publishers and developers
            // to get their names.
            return game; // Returns the row object or undefined/null if not found
        } catch (error) {
            console.error(`Service error fetching game with ID ${id}:`, error);
            throw new Error('Failed to retrieve game details.');
        }
    }
};

module.exports = gameService;