const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const authenticateToken = require('../middleware/authenticateToken');
const isAdmin = require('../middleware/isAdmin');

// --- Review Moderation Routes ---
// All routes below require admin privileges

// GET /api/reviews/ - Get reviews pending moderation
router.get(
    '/',
    authenticateToken,
    isAdmin,
    reviewController.getPendingReviews
);

// PUT /api/reviews/:id/status - Update status of a specific review
router.put(
    '/:id/status',
    authenticateToken,
    isAdmin,
    reviewController.updateReviewStatus
);

// DELETE /api/reviews/:id - Delete a specific review
router.delete(
    '/:id',
    authenticateToken,
    isAdmin,
    reviewController.deleteReview
);


// --- IMPORTANT REMINDER ---
// The route for SUBMITTING a review (POST /api/games/:id/review)
// should be defined in `game.routes.js` but can call `reviewController.submitReview`.
// Example for game.routes.js:
/*
 const gameRouter = require('express').Router();
 const gameController = require('../controllers/game.controller');
 const reviewController = require('../controllers/review.controller'); // Import review controller
 const authenticateToken = require('../middleware/authenticateToken');

 // ... other game routes ...

 // POST /api/games/:id/review - Submit a review for a game (requires user auth)
 gameRouter.post('/:id/review', authenticateToken, reviewController.submitReview);

 module.exports = gameRouter;
*/


module.exports = router;