// routes/user.routes.js

const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authenticateToken = require('../middleware/authenticateToken');
const isAdmin = require('../middleware/isAdmin');

// --- User Management Routes (Admin Only) ---

// GET /api/users - Get a list of all users
// Requires user to be logged in (authenticateToken) and be an admin (isAdmin)
router.get(
    '/',
    authenticateToken,
    isAdmin,
    userController.getAllUsers
);

// PUT /api/users/:id - Update user status (e.g., block/unblock)
// Requires user to be logged in (authenticateToken) and be an admin (isAdmin)
router.put(
    '/:id', // The route expects the user ID as a parameter
    authenticateToken,
    isAdmin,
    userController.updateUserStatus
);

// Note: A route for deleting a user could be added here:
// DELETE /api/users/:id
// router.delete('/:id', authenticateToken, isAdmin, userController.deleteUser);
// (Requires implementing deleteUser in controller and service)

module.exports = router;