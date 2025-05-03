const reviewService = require('../services/review.service');

// NOTE: This function corresponds to POST /games/:id/review
// It's placed here for functional grouping as requested, but the route definition
// should ideally be in `game.routes.js`.
const submitReview = async (req, res, next) => {
    const { rank, review_text } = req.body; // Match column name 'review_text'
    const gameId = parseInt(req.params.id, 10);
    const userId = req.user.id; // Provided by authenticateToken middleware

    // Basic Validation
    if (!rank || typeof rank !== 'number' || rank < 1 || rank > 10) { // Assuming rank 1-10
        return res.status(400).json({ message: 'Rank is required and must be a number between 1 and 10.' });
    }
    if (!review_text || typeof review_text !== 'string' || review_text.trim() === '') {
        return res.status(400).json({ message: 'Review text is required.' });
    }
    if (isNaN(gameId)) {
         return res.status(400).json({ message: 'Invalid game ID format.' });
    }

    try {
        const newReview = await reviewService.createReview(userId, gameId, rank, review_text);
        res.status(201).json({ message: 'Review submitted successfully and is pending approval.', review: newReview });
    } catch (error) {
        console.error("Error in submitReview controller:", error);
        // Handle specific errors from the service if needed
        if (error.message.includes('constraint violation')) {
             return res.status(404).json({ message: 'Failed to submit review. Ensure the game exists.' }); // Or 400 Bad Request
        }
         if (error.message.includes('already reviewed')) {
             return res.status(409).json({ message: error.message }); // Conflict
        }
        // Generic error for other cases
        res.status(500).json({ message: 'Internal server error while submitting review.' });
    }
};

// GET /reviews - Fetch reviews for moderation (Admin only)
const getPendingReviews = async (req, res, next) => {
    try {
        const reviews = await reviewService.findPendingReviews();
        res.json(reviews);
    } catch (error) {
        console.error("Error in getPendingReviews controller:", error);
        res.status(500).json({ message: 'Internal server error while fetching pending reviews.' });
    }
};

// PUT /reviews/:id/status - Update review status (Admin only)
const updateReviewStatus = async (req, res, next) => {
    const reviewId = parseInt(req.params.id, 10);
    const { status } = req.body; // Expecting { "status": "ok" | "delete" | "review" }

    if (isNaN(reviewId)) {
        return res.status(400).json({ message: 'Invalid review ID format.' });
    }
    if (!status) {
        return res.status(400).json({ message: 'New status is required.' });
    }

    try {
        const result = await reviewService.updateStatus(reviewId, status);
        if (result.changes === 0) {
            return res.status(404).json({ message: `Review with ID ${reviewId} not found.` });
        }
        res.json({ message: `Review ${reviewId} status updated to '${status}'.` });
    } catch (error) {
        console.error("Error in updateReviewStatus controller:", error);
        // Handle specific validation error from service
        if (error.message.startsWith('Invalid status value')) {
             return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Internal server error while updating review status.' });
    }
};

// DELETE /reviews/:id - Delete a review (Admin only)
const deleteReview = async (req, res, next) => {
    const reviewId = parseInt(req.params.id, 10);

     if (isNaN(reviewId)) {
        return res.status(400).json({ message: 'Invalid review ID format.' });
    }

    try {
        const result = await reviewService.deleteById(reviewId);
        if (result.changes === 0) {
            return res.status(404).json({ message: `Review with ID ${reviewId} not found.` });
        }
        // Use 204 No Content for successful deletions with no body, or 200 OK with a message
        // res.sendStatus(204);
         res.json({ message: `Review ${reviewId} deleted successfully.` });
    } catch (error) {
        console.error("Error in deleteReview controller:", error);
        res.status(500).json({ message: 'Internal server error while deleting review.' });
    }
};

module.exports = {
    submitReview, // Remember this corresponds to POST /games/:id/review
    getPendingReviews,
    updateReviewStatus,
    deleteReview,
};