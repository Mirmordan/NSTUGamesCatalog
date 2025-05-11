// services/user.service.js

const User = require('../models/user.js'); // Import the User model

/**
 * Retrieves all users from the database.
 * (Excludes password hashes as handled by User.findAll).
 * @returns {Promise<Array<object>>} A promise that resolves with an array of user objects.
 */
const findAllUsers = async () => {
    try {
        // The User.findAll method already selects only necessary fields
        const users = await User.findAll();
        return users;
    } catch (error) {
        console.error("Error in userService.findAllUsers:", error);
        // Re-throw the error to be handled by the controller
        throw new Error('Failed to retrieve users.');
    }
};

/**
 * Updates the status of a specific user.
 * @param {number} userId - The ID of the user to update.
 * @param {string} newStatus - The new status ('active' or 'blocked').
 * @returns {Promise<number>} A promise that resolves with the number of rows affected (should be 1 if successful, 0 if user not found).
 * @throws {Error} If the status is invalid or if the update fails.
 */
const updateUserStatus = async (userId, newStatus) => {
    const allowedStatuses = ['active', 'blocked'];
    if (!allowedStatuses.includes(newStatus)) {
        // Throw an error for invalid status, caught by the controller
        throw new Error(`Invalid status value: ${newStatus}. Must be 'active' or 'blocked'.`);
    }

    try {
        // Use the User model's update method
        const changes = await User.update(userId, { status: newStatus });

        if (changes === 0) {
            // Throw a specific error if the user wasn't found
             throw new Error(`User with ID ${userId} not found.`);
        }
        return changes; // Return the number of changes (typically 1)
    } catch (error) {
        console.error(`Error updating status for user ${userId}:`, error);
        // Re-throw the original error (could be "User not found" or other DB errors)
        throw error;
    }
};

/**
 * Retrieves profile information (login and status) for a specific user.
 * @param {number} userId - The ID of the user.
 * @returns {Promise<object>} A promise that resolves with the user's login and status.
 * @throws {Error} If the user is not found or if retrieval fails.
 */
const getUserProfile = async (userId) => {
    try {
        const userProfile = await User.findProfileById(userId);
        if (!userProfile) {
            throw new Error(`User profile with ID ${userId} not found.`);
        }
        return userProfile;
    } catch (error) {
        console.error(`Error in userService.getUserProfile for ID ${userId}:`, error);
        // Re-throw the error to be handled by the controller
        // (could be "User profile not found" or other DB errors)
        throw error;
    }
};


// Note: A service function for deleting a user could be added here using User.remove(userId)
// if that functionality is needed later.

module.exports = {
    findAllUsers,
    updateUserStatus,
    getUserProfile, // Добавлен экспорт новой функции
};
