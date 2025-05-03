// routes/game.routes.js
const express = require('express');
const router = express.Router();
const gameController = require('../controllers/game.controller');

// GET /api/games - Get list of games (public access)
// Query Params: ?page=1&limit=10&search=...&year=...&publisher=...&developer=...&genre=...&minRating=...&sortBy=...&sortOrder=...
router.get('/', gameController.getGamesList);

// GET /api/games/:id - Get details of a specific game (public access)
router.get('/:id', gameController.getGameDetails);

// --- Placeholder for Review Submission (Requires Authentication) ---
// POST /api/games/:id/review - Submit a review for a game (requires user login)
// You'll need to implement the corresponding controller and service methods.
// Example:
// const reviewController = require('../controllers/review.controller'); // Assuming review logic is separated
// router.post('/:id/review', authenticateToken, reviewController.submitGameReview);

module.exports = router;