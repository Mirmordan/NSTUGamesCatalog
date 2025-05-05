// controllers/game.controller.js
// --- Импорты ---
const gameService = require('../services/game.service');

// --- Контроллеры ---

const gameController = {
    // Получает список игр с пагинацией, поиском и фильтрацией.
    getGamesList: async (req, res, next) => {
        try {
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

            const result = await gameService.getAllGames(options);

            res.json(result);

        } catch (error) {
            console.error('Controller error in getGamesList:', error);
            res.status(500).json({ message: 'Ошибка получения списка игр.' });
        }
    },

    // Получает детальную информацию по конкретной игре по её ID.
    getGameDetails: async (req, res, next) => {
        try {
            const gameId = parseInt(req.params.id, 10);

            if (isNaN(gameId) || gameId <= 0) {
                return res.status(400).json({ message: 'Неверный ID игры.' });
            }

            const game = await gameService.getGameById(gameId);

            if (!game) {
                return res.status(404).json({ message: 'Игра не найдена.' });
            }

            res.json(game);

        } catch (error) {
            console.error(`Controller error in getGameDetails for ID ${req.params.id}:`, error);
            res.status(500).json({ message: 'Ошибка получения деталей игры.' });
        }
    }
};

// --- Экспорт ---
module.exports = gameController;