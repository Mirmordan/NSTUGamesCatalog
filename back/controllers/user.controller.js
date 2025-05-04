// controllers/user.controller.js

const userService = require('../services/user.service');

/**
 * Handles GET /api/users request. Retrieves a list of all users.
 * Requires admin privileges.
 */
const getAllUsers = async (req, res, next) => {
    try {
        const users = await userService.findAllUsers();
        res.json(users);
    } catch (error) {
        console.error("Error in userController.getAllUsers:", error);
        // Pass error to a central error handler or send a generic 500
        res.status(500).json({ message: 'Internal server error while fetching users.' });
        // Or: next(error); if you have error handling middleware
    }
};

/**
 * Handles PUT /api/users/:id request. Updates the status of a user.
 * Requires admin privileges.
 */
const updateUserStatus = async (req, res, next) => {
    const userId = parseInt(req.params.id, 10);
    const { status } = req.body; // Expecting { "status": "active" | "blocked" }

    // --- Input Validation ---
    if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID format.' });
    }
    if (!status) {
        return res.status(400).json({ message: 'New status is required in the request body.' });
    }
    // Basic check for allowed values, more robust check is in the service
    if (status !== 'active' && status !== 'blocked') {
         return res.status(400).json({ message: "Invalid status value. Must be 'active' or 'blocked'." });
    }
    // --- End Validation ---


    try {
        // Call the service function to update the status
        await userService.updateUserStatus(userId, status);
        res.json({ message: `User ${userId} status updated successfully to '${status}'.` });

    } catch (error) {
        console.error(`Error in userController.updateUserStatus for user ${userId}:`, error);

        // Handle specific errors from the service
        if (error.message.startsWith('Invalid status value')) {
            return res.status(400).json({ message: error.message });
        }
        if (error.message.includes('not found')) {
             return res.status(404).json({ message: error.message }); // User not found
        }

        // Generic error for other issues
        res.status(500).json({ message: 'Internal server error while updating user status.' });
        // Or: next(error);
    }
};

// Note: A controller function for deleting a user (deleteUser) could be added here
// calling a corresponding service method if needed.

module.exports = {
    getAllUsers,
    updateUserStatus,
};